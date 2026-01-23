import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Track {
  artistName: string;
  songName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracks, platform } = await req.json() as { 
      tracks: Track[]; 
      platform: 'apple' | 'deezer';
    };
    
    console.log('Odesli request:', { tracksCount: tracks.length, platform });

    const links: string[] = [];
    const foundTracks: { track: Track; url: string }[] = [];

    // Process tracks with rate limiting
    for (const track of tracks) {
      try {
        // Search for the track on Spotify first (most reliable for Odesli)
        const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${track.artistName} ${track.songName}`)}`;
        
        // Use Odesli API to get platform-specific links
        // Note: Odesli/song.link works better with direct track URLs
        // For better results, we'll generate platform-specific search URLs
        
        if (platform === 'apple') {
          // Apple Music search URL format
          const appleSearchUrl = `https://music.apple.com/search?term=${encodeURIComponent(`${track.artistName} ${track.songName}`)}`;
          links.push(appleSearchUrl);
          foundTracks.push({ track, url: appleSearchUrl });
        } else if (platform === 'deezer') {
          // Deezer search URL format
          const deezerSearchUrl = `https://www.deezer.com/search/${encodeURIComponent(`${track.artistName} ${track.songName}`)}`;
          links.push(deezerSearchUrl);
          foundTracks.push({ track, url: deezerSearchUrl });
        }

        // Rate limiting - small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
        console.log(`Could not get link for ${track.artistName} - ${track.songName}`);
      }
    }

    console.log(`Found ${links.length} links for platform ${platform}`);

    // Generate a combined URL for the first 10 tracks
    let combinedUrl = '';
    if (platform === 'apple') {
      const searchTerms = tracks.slice(0, 10).map(t => `${t.artistName} ${t.songName}`).join(', ');
      combinedUrl = `https://music.apple.com/search?term=${encodeURIComponent(searchTerms)}`;
    } else if (platform === 'deezer') {
      const searchTerms = tracks.slice(0, 10).map(t => `${t.artistName} ${t.songName}`).join(' ');
      combinedUrl = `https://www.deezer.com/search/${encodeURIComponent(searchTerms)}`;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        links,
        foundTracks,
        combinedUrl,
        platform,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in odesli function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});