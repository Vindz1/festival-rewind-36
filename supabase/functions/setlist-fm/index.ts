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
    const { action, festivalName, year, artistMbid, artistName, setlistId, eventDate, venueName } = await req.json();
    
    console.log('Setlist.fm API request:', { action, festivalName, year, artistMbid, artistName });

    if (!SETLIST_FM_API_KEY) {
      throw new Error('SETLIST_FM_API_KEY not configured');
    }

    const headers = {
      'x-api-key': SETLIST_FM_API_KEY,
      'Accept': 'application/json',
    };

    if (action === 'getFestivalArtists') {
      // Search for Hellfest setlists for the given year using venue and city
      // Hellfest is at Val de Moine in Clisson, France
      const searchUrl = new URL(`${SETLIST_FM_BASE_URL}/search/setlists`);
      searchUrl.searchParams.set('venueName', 'Val de Moine');
      searchUrl.searchParams.set('cityName', 'Clisson');
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
      
      // Extract unique artists from all setlists with their specific event info
      const artistsMap = new Map<string, { 
        mbid: string; 
        name: string; 
        eventDate: string; 
        venueId: string;
        setlistId: string;
      }>();
      
      if (data.setlist) {
        for (const setlist of data.setlist as SetlistFmSetlist[]) {
          const artistKey = setlist.artist.mbid || setlist.artist.name;
          if (!artistsMap.has(artistKey)) {
            artistsMap.set(artistKey, {
              mbid: setlist.artist.mbid,
              name: setlist.artist.name,
              eventDate: setlist.eventDate,
              venueId: setlist.venue.id,
              setlistId: setlist.id,
            });
          }
        }
      }

      // Get more pages if available (up to 10 pages for better coverage)
      const totalPages = Math.min(Math.ceil((data.total || 0) / (data.itemsPerPage || 20)), 10);
      
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
                  setlistId: setlist.id,
                });
              }
            }
          }
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const artists = Array.from(artistsMap.values());
      console.log(`Found ${artists.length} unique artists for Hellfest ${year}`);

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
      let songs: string[] = [];
      let foundSetlist = false;
      
      // Priority 1: Try to get the specific setlist from the festival if setlistId is provided
      if (setlistId) {
        console.log(`Fetching specific setlist: ${setlistId}`);
        try {
          const setlistResponse = await fetch(`${SETLIST_FM_BASE_URL}/setlist/${setlistId}`, { headers });
          if (setlistResponse.ok) {
            const setlistData = await setlistResponse.json();
            if (setlistData.sets?.set) {
              for (const set of setlistData.sets.set) {
                if (set.song) {
                  for (const song of set.song) {
                    if (song.name && songs.length < 20) {
                      songs.push(song.name);
                    }
                  }
                }
              }
            }
            if (songs.length > 0) {
              foundSetlist = true;
              console.log(`Found ${songs.length} songs from specific setlist for ${artistName}`);
            }
          }
        } catch (e) {
          console.log('Could not fetch specific setlist, falling back to recent setlists');
        }
      }
      
      // Priority 2: If no songs found from specific setlist, get the most recent setlists
      if (!foundSetlist) {
        let searchUrl: string;
        
        if (artistMbid) {
          searchUrl = `${SETLIST_FM_BASE_URL}/artist/${artistMbid}/setlists`;
        } else {
          searchUrl = `${SETLIST_FM_BASE_URL}/search/setlists?artistName=${encodeURIComponent(artistName)}`;
        }
        
        console.log('Fetching artist recent setlists from:', searchUrl);
        
        const response = await fetch(searchUrl, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Setlist.fm API error:', response.status, errorText);
          // Return empty songs instead of throwing - artist may have no setlists
          return new Response(
            JSON.stringify({ 
              success: true, 
              songs: [],
              artistName,
              noSetlist: true,
              message: 'Set-list non disponible pour ce groupe',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        
        // Extract unique songs from the setlists (up to 15)
        const songsSet = new Set<string>();
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
      }

      console.log(`Found ${songs.length} songs for artist ${artistName || artistMbid}`);

      if (songs.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            songs: [],
            artistName,
            noSetlist: true,
            message: 'Set-list non disponible pour ce groupe',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          songs,
          artistName,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'searchFestivalsAndArtists') {
      const { query } = await req.json().catch(() => ({ query: '' }));
      
      // Get the query from the original request body
      const requestBody = await req.clone().json().catch(() => ({}));
      const searchQuery = requestBody.query || query;
      
      console.log('Searching for festivals and artists:', searchQuery);
      
      const results: Array<{
        type: 'festival' | 'artist';
        id: string;
        name: string;
        venue?: string;
        city?: string;
        country?: string;
        year?: string;
      }> = [];
      
      // Search for venues/festivals
      try {
        const venueSearchUrl = `${SETLIST_FM_BASE_URL}/search/venues?name=${encodeURIComponent(searchQuery)}&p=1`;
        const venueResponse = await fetch(venueSearchUrl, { headers });
        
        if (venueResponse.ok) {
          const venueData = await venueResponse.json();
          if (venueData.venue) {
            for (const venue of venueData.venue.slice(0, 5)) {
              results.push({
                type: 'festival',
                id: venue.id,
                name: venue.name,
                venue: venue.name,
                city: venue.city?.name,
                country: venue.city?.country?.name,
                year: new Date().getFullYear().toString(),
              });
            }
          }
        }
      } catch (e) {
        console.log('Venue search error:', e);
      }
      
      // Search for artists
      try {
        const artistSearchUrl = `${SETLIST_FM_BASE_URL}/search/artists?artistName=${encodeURIComponent(searchQuery)}&p=1`;
        const artistResponse = await fetch(artistSearchUrl, { headers });
        
        if (artistResponse.ok) {
          const artistData = await artistResponse.json();
          if (artistData.artist) {
            for (const artist of artistData.artist.slice(0, 5)) {
              results.push({
                type: 'artist',
                id: artist.mbid || artist.name,
                name: artist.name,
              });
            }
          }
        }
      } catch (e) {
        console.log('Artist search error:', e);
      }
      
      return new Response(
        JSON.stringify({ success: true, results }),
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
