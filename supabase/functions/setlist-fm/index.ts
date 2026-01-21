import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SETLIST_FM_API_KEY = Deno.env.get('SETLIST_FM_API_KEY');
const SETLIST_FM_BASE_URL = 'https://api.setlist.fm/rest/1.0';

interface SetlistFmArtist {
  mbid: string;
  name: string;
  sortName: string;
  disambiguation?: string;
  url: string;
}

interface SetlistFmVenue {
  id: string;
  name: string;
  city: {
    id: string;
    name: string;
    country: {
      code: string;
      name: string;
    };
  };
}

interface SetlistFmSetlist {
  id: string;
  eventDate: string;
  artist: SetlistFmArtist;
  venue: SetlistFmVenue;
  sets: {
    set: Array<{
      song: Array<{
        name: string;
        cover?: { name: string };
      }>;
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, festivalName, year, artistMbid, artistName } = await req.json();
    
    console.log('Setlist.fm API request:', { action, festivalName, year, artistMbid, artistName });

    if (!SETLIST_FM_API_KEY) {
      throw new Error('SETLIST_FM_API_KEY not configured');
    }

    const headers = {
      'x-api-key': SETLIST_FM_API_KEY,
      'Accept': 'application/json',
    };

    if (action === 'getFestivalArtists') {
      // Search for Hellfest setlists for the given year
      // Hellfest is in Clisson, France
      const searchUrl = new URL(`${SETLIST_FM_BASE_URL}/search/setlists`);
      searchUrl.searchParams.set('festivalName', festivalName || 'Hellfest');
      searchUrl.searchParams.set('year', year.toString());
      searchUrl.searchParams.set('p', '1');
      
      console.log('Fetching festival artists from:', searchUrl.toString());
      
      const response = await fetch(searchUrl.toString(), { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Setlist.fm API error:', response.status, errorText);
        throw new Error(`Setlist.fm API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Setlist.fm response:', JSON.stringify(data).substring(0, 500));
      
      // Extract unique artists from all setlists
      const artistsMap = new Map<string, { mbid: string; name: string; eventDate: string; venueId: string }>();
      
      if (data.setlist) {
        for (const setlist of data.setlist as SetlistFmSetlist[]) {
          const artistKey = setlist.artist.mbid || setlist.artist.name;
          if (!artistsMap.has(artistKey)) {
            artistsMap.set(artistKey, {
              mbid: setlist.artist.mbid,
              name: setlist.artist.name,
              eventDate: setlist.eventDate,
              venueId: setlist.venue.id,
            });
          }
        }
      }

      // Get more pages if available
      const totalPages = Math.min(Math.ceil((data.total || 0) / (data.itemsPerPage || 20)), 5);
      
      for (let page = 2; page <= totalPages; page++) {
        searchUrl.searchParams.set('p', page.toString());
        const pageResponse = await fetch(searchUrl.toString(), { headers });
        if (pageResponse.ok) {
          const pageData = await pageResponse.json();
          if (pageData.setlist) {
            for (const setlist of pageData.setlist as SetlistFmSetlist[]) {
              const artistKey = setlist.artist.mbid || setlist.artist.name;
              if (!artistsMap.has(artistKey)) {
                artistsMap.set(artistKey, {
                  mbid: setlist.artist.mbid,
                  name: setlist.artist.name,
                  eventDate: setlist.eventDate,
                  venueId: setlist.venue.id,
                });
              }
            }
          }
        }
      }

      const artists = Array.from(artistsMap.values());
      console.log(`Found ${artists.length} unique artists`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          artists,
          total: data.total || artists.length,
          festivalId: `hellfest-${year}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getArtistSetlist') {
      // Get the most recent setlists for an artist to extract songs
      let searchUrl: string;
      
      if (artistMbid) {
        searchUrl = `${SETLIST_FM_BASE_URL}/artist/${artistMbid}/setlists`;
      } else {
        searchUrl = `${SETLIST_FM_BASE_URL}/search/setlists?artistName=${encodeURIComponent(artistName)}`;
      }
      
      console.log('Fetching artist setlist from:', searchUrl);
      
      const response = await fetch(searchUrl, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Setlist.fm API error:', response.status, errorText);
        throw new Error(`Setlist.fm API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract unique songs from the setlists (up to 15)
      const songsSet = new Set<string>();
      const songs: string[] = [];
      
      const setlists = data.setlist || [];
      
      for (const setlist of setlists as SetlistFmSetlist[]) {
        if (setlist.sets?.set) {
          for (const set of setlist.sets.set) {
            if (set.song) {
              for (const song of set.song) {
                if (song.name && !songsSet.has(song.name) && songs.length < 15) {
                  songsSet.add(song.name);
                  songs.push(song.name);
                }
              }
            }
          }
          if (songs.length >= 15) break;
        }
        if (songs.length >= 15) break;
      }

      console.log(`Found ${songs.length} songs for artist ${artistName || artistMbid}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          songs,
          artistName: artistName || (setlists[0] as SetlistFmSetlist)?.artist?.name,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in setlist-fm function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
