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
    // CRITICAL: Read the body ONLY ONCE at the beginning
    const body = await req.json();
    const { action, year, artistMbid, artistName, setlistId, query, venueId, venueName, cityName } = body;
    
    console.log('Setlist.fm API request:', { action, year, artistMbid, artistName, query, venueId, venueName });

    if (!SETLIST_FM_API_KEY) {
      throw new Error('SETLIST_FM_API_KEY not configured');
    }

    const headers = {
      'x-api-key': SETLIST_FM_API_KEY,
      'Accept': 'application/json',
    };

    // ========== ACTION: Get artists from a specific venue ==========
    if (action === 'getVenueArtists') {
      const searchUrl = new URL(`${SETLIST_FM_BASE_URL}/search/setlists`);
      
      // Use the venue name and city provided by the user
      if (venueName) {
        searchUrl.searchParams.set('venueName', venueName);
      }
      if (cityName) {
        searchUrl.searchParams.set('cityName', cityName);
      }
      if (year) {
        searchUrl.searchParams.set('year', year.toString());
      }
      searchUrl.searchParams.set('p', '1');
      
      console.log('Fetching venue artists from:', searchUrl.toString());
      
      const response = await fetch(searchUrl.toString(), { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Setlist.fm API error:', response.status, errorText);
        throw new Error(`Setlist.fm API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Setlist.fm response:', JSON.stringify(data).substring(0, 500));
      
      // Extract unique artists from all setlists
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

      // Get more pages if available (up to 10 pages)
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
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const artists = Array.from(artistsMap.values());
      console.log(`Found ${artists.length} unique artists for venue`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          artists,
          total: data.total || artists.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== ACTION: Get artist setlist ==========
    if (action === 'getArtistSetlist') {
      let songs: string[] = [];
      let foundSetlist = false;
      
      // Priority 1: Try specific setlist if setlistId is provided
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
      
      // Priority 2: Get recent setlists if no songs found
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

    // ========== ACTION: Universal search for festivals and artists ==========
    if (action === 'searchFestivalsAndArtists') {
      const searchQuery = query || '';
      
      console.log('Searching for festivals and artists:', searchQuery);
      
      if (!searchQuery.trim()) {
        return new Response(
          JSON.stringify({ success: true, results: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Use Maps for deduplication - key by CITY to avoid listing multiple stages at same location
      const festivalsMap = new Map<string, {
        type: 'festival';
        id: string;
        name: string;
        venue?: string;
        city?: string;
        country?: string;
        year?: string;
        eventDate?: string;
      }>();
      
      const artistsMap = new Map<string, {
        type: 'artist';
        id: string;
        name: string;
      }>();
      
      // Search for venues/festivals
      try {
        const venueSearchUrl = `${SETLIST_FM_BASE_URL}/search/venues?name=${encodeURIComponent(searchQuery)}&p=1`;
        console.log('Searching venues:', venueSearchUrl);
        const venueResponse = await fetch(venueSearchUrl, { headers });
        
        if (venueResponse.ok) {
          const venueData = await venueResponse.json();
          if (venueData.venue) {
            for (const venue of venueData.venue.slice(0, 20)) {
              // Create a key by city to group venues in the same location
              const cityKey = `${venue.city?.name || 'unknown'}-${venue.city?.country?.code || ''}`.toLowerCase();
              
              // Only add if we have a valid ID and not already in map for this city
              // Prefer the main festival name (longest or most relevant)
              if (venue.id) {
                const existing = festivalsMap.get(cityKey);
                // Keep the one with the search query in the name, or the first one found
                const nameMatchesQuery = venue.name.toLowerCase().includes(searchQuery.toLowerCase());
                const shouldReplace = !existing || 
                  (nameMatchesQuery && !existing.name.toLowerCase().includes(searchQuery.toLowerCase()));
                
                if (shouldReplace) {
                  festivalsMap.set(cityKey, {
                    type: 'festival',
                    id: venue.id,
                    name: venue.name,
                    venue: venue.name,
                    city: venue.city?.name,
                    country: venue.city?.country?.name,
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        console.log('Venue search error:', e);
      }
      
      // Search for artists
      try {
        const artistSearchUrl = `${SETLIST_FM_BASE_URL}/search/artists?artistName=${encodeURIComponent(searchQuery)}&p=1`;
        console.log('Searching artists:', artistSearchUrl);
        const artistResponse = await fetch(artistSearchUrl, { headers });
        
        if (artistResponse.ok) {
          const artistData = await artistResponse.json();
          if (artistData.artist) {
            for (const artist of artistData.artist.slice(0, 10)) {
              const artistId = artist.mbid || artist.name;
              // Only add if we have a valid ID and not already in map
              if (artistId && !artistsMap.has(artistId)) {
                artistsMap.set(artistId, {
                  type: 'artist',
                  id: artistId,
                  name: artist.name,
                });
              }
            }
          }
        }
      } catch (e) {
        console.log('Artist search error:', e);
      }

      // Also search for setlists directly (to find specific events/concerts)
      try {
        const setlistSearchUrl = `${SETLIST_FM_BASE_URL}/search/setlists?artistName=${encodeURIComponent(searchQuery)}&p=1`;
        console.log('Searching setlists:', setlistSearchUrl);
        const setlistResponse = await fetch(setlistSearchUrl, { headers });
        
        if (setlistResponse.ok) {
          const setlistData = await setlistResponse.json();
          if (setlistData.setlist) {
            for (const setlist of setlistData.setlist.slice(0, 20) as SetlistFmSetlist[]) {
              // Create a key by city+year to group events at same location
              const cityKey = `${setlist.venue.city?.name || 'unknown'}-${setlist.venue.city?.country?.code || ''}`.toLowerCase();
              
              // Parse year from DD-MM-YYYY format
              const dateParts = setlist.eventDate?.split('-');
              const year = dateParts && dateParts.length === 3 ? dateParts[2] : undefined;
              
              // Only add if not already in map for this city
              if (setlist.venue.id && !festivalsMap.has(cityKey)) {
                festivalsMap.set(cityKey, {
                  type: 'festival',
                  id: setlist.venue.id,
                  name: setlist.venue.name,
                  venue: setlist.venue.name,
                  city: setlist.venue.city?.name,
                  country: setlist.venue.city?.country?.name,
                  year: year,
                  eventDate: setlist.eventDate,
                });
              }
            }
          }
        }
      } catch (e) {
        console.log('Setlist search error:', e);
      }
      
      // Combine results: festivals first, then artists (already deduplicated)
      const results = [
        ...Array.from(festivalsMap.values()).slice(0, 10),
        ...Array.from(artistsMap.values()).slice(0, 10),
      ];
      
      console.log(`Found ${results.length} unique results (${festivalsMap.size} festivals, ${artistsMap.size} artists)`);
      
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== ACTION: Get single setlist by ID ==========
    if (action === 'getSetlist') {
      if (!setlistId) {
        return new Response(
          JSON.stringify({ success: false, error: 'setlistId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Fetching setlist:', setlistId);
      
      const response = await fetch(`${SETLIST_FM_BASE_URL}/setlist/${setlistId}`, { headers });
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: false, error: 'Setlist not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const setlist = await response.json() as SetlistFmSetlist;
      
      // Extract songs
      const songs: string[] = [];
      if (setlist.sets?.set) {
        for (const set of setlist.sets.set) {
          if (set.song) {
            for (const song of set.song) {
              if (song.name) {
                songs.push(song.name);
              }
            }
          }
        }
      }

      // Parse date from DD-MM-YYYY to YYYY-MM-DD
      let isoDate = '';
      if (setlist.eventDate) {
        const parts = setlist.eventDate.split('-');
        if (parts.length === 3) {
          isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          setlist: {
            id: setlist.id,
            artistName: setlist.artist.name,
            artistMbid: setlist.artist.mbid,
            venue: setlist.venue.name,
            city: setlist.venue.city?.name,
            country: setlist.venue.city?.country?.name,
            eventDate: setlist.eventDate,
            isoDate,
            songs,
            url: setlist.artist.url,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== ACTION: Get artist concerts/history ==========
    if (action === 'getArtistConcerts') {
      const searchUrl = artistMbid 
        ? `${SETLIST_FM_BASE_URL}/artist/${artistMbid}/setlists?p=1`
        : `${SETLIST_FM_BASE_URL}/search/setlists?artistName=${encodeURIComponent(artistName)}&p=1`;
      
      console.log('Fetching artist concerts:', searchUrl);
      
      const response = await fetch(searchUrl, { headers });
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: true, concerts: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      
      const concerts = (data.setlist || []).slice(0, 20).map((setlist: SetlistFmSetlist) => ({
        id: setlist.id,
        eventDate: setlist.eventDate,
        venue: setlist.venue.name,
        city: setlist.venue.city?.name,
        country: setlist.venue.city?.country?.name,
        songCount: setlist.sets?.set?.reduce((acc: number, s: { song?: Array<{ name: string }> }) => 
          acc + (s.song?.length || 0), 0) || 0,
      }));

      return new Response(
        JSON.stringify({ success: true, concerts, artistName }),
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
