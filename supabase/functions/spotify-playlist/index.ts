import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface TrackToAdd {
  artistName: string;
  songName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, playlistName, tracks } = await req.json();
    
    console.log('Spotify playlist request:', { action, userId, playlistName, tracksCount: tracks?.length });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get access token from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spotify_access_token, spotify_token_expires_at')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.spotify_access_token) {
      throw new Error('No Spotify access token found. Please connect Spotify first.');
    }

    // Check if token is expired
    if (profile.spotify_token_expires_at && new Date(profile.spotify_token_expires_at) < new Date()) {
      throw new Error('Spotify token expired. Please reconnect Spotify.');
    }

    const accessToken = profile.spotify_access_token;

    // Get Spotify user ID
    const meResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!meResponse.ok) {
      throw new Error('Failed to get Spotify user info');
    }

    const me = await meResponse.json();
    const spotifyUserId = me.id;
    console.log('Spotify user ID:', spotifyUserId);

    if (action === 'createPlaylist') {
      // Create playlist
      const createResponse = await fetch(`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          description: 'Généré par SetlistFest - Vos souvenirs de concerts',
          public: false,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('Failed to create playlist:', error);
        throw new Error('Failed to create playlist');
      }

      const playlist = await createResponse.json();
      console.log('Created playlist:', playlist.id);

      // Search for tracks and add them
      const trackUris: string[] = [];
      const addedTracks: { artistName: string; songName: string; found: boolean }[] = [];

      for (const track of tracks as TrackToAdd[]) {
        const searchQuery = `track:${track.songName} artist:${track.artistName}`;
        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`;
        
        const searchResponse = await fetch(searchUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.tracks?.items?.length > 0) {
            trackUris.push(searchData.tracks.items[0].uri);
            addedTracks.push({ ...track, found: true });
          } else {
            addedTracks.push({ ...track, found: false });
          }
        } else {
          addedTracks.push({ ...track, found: false });
        }

        // Rate limiting - wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`Found ${trackUris.length} tracks out of ${tracks.length}`);

      // Add tracks to playlist in batches of 100
      for (let i = 0; i < trackUris.length; i += 100) {
        const batch = trackUris.slice(i, i + 100);
        await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: batch }),
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          playlistId: playlist.id,
          playlistUrl: playlist.external_urls.spotify,
          tracksAdded: trackUris.length,
          tracksTotal: tracks.length,
          addedTracks,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in spotify-playlist function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
