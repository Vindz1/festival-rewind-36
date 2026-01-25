import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SETLIST_FM_API_KEY = Deno.env.get('SETLIST_FM_API_KEY');
const SETLIST_FM_BASE_URL = 'https://api.setlist.fm/rest/1.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, year, artistMbid, artistName, setlistId, query, venueId, venueName, cityName } = body;
    
    if (!SETLIST_FM_API_KEY) throw new Error('SETLIST_FM_API_KEY non configurée');

    const headers = { 'x-api-key': SETLIST_FM_API_KEY, 'Accept': 'application/json' };

    // RECHERCHE UNIVERSELLE : On cherche des festivals par nom et année
    if (action === 'searchFestivalsAndArtists') {
      const resultsMap = new Map();
      
      // On cherche directement dans les setlists pour avoir les années et les vrais événements
      const searchUrl = `${SETLIST_FM_BASE_URL}/search/setlists?venueName=${encodeURIComponent(query)}&p=1`;
      const response = await fetch(searchUrl, { headers });
      
      if (response.ok) {
        const data = await response.json();
        if (data.setlist) {
          data.setlist.forEach((s: any) => {
            const year = s.eventDate.split('-')[2];
            const key = `${s.venue.name}-${year}`; // Clé unique par Nom + Année
            if (!resultsMap.has(key)) {
              resultsMap.set(key, {
                type: 'festival',
                id: s.venue.id,
                name: `${s.venue.name} ${year}`,
                venue: s.venue.name,
                city: s.venue.city.name,
                year: year,
                eventDate: s.eventDate
              });
            }
          });
        }
      }

      // On ajoute aussi une recherche par artiste au cas où
      const artResponse = await fetch(`${SETLIST_FM_BASE_URL}/search/artists?artistName=${encodeURIComponent(query)}&p=1`, { headers });
      const artData = artResponse.ok ? await artResponse.json() : { artist: [] };
      const artists = (artData.artist || []).slice(0, 5).map((a: any) => ({
        type: 'artist',
        id: a.mbid,
        name: a.name
      }));

      return new Response(JSON.stringify({ 
        success: true, 
        results: [...Array.from(resultsMap.values()), ...artists] 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // RÉCUPÉRATION DES ARTISTES (HELLFEST, ETC.)
    if (action === 'getVenueArtists') {
      const url = `${SETLIST_FM_BASE_URL}/search/setlists?venueId=${venueId}${year ? `&year=${year}` : ''}&p=1`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      const artists = (data.setlist || []).map((s: any) => ({
        mbid: s.artist.mbid,
        name: s.artist.name,
        eventDate: s.eventDate,
        setlistId: s.id
      }));

      return new Response(JSON.stringify({ success: true, artists }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // RÉCUPÉRATION D'UNE SETLIST PRÉCISE
    if (action === 'getSetlist') {
      const response = await fetch(`${SETLIST_FM_BASE_URL}/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap((set: any) => set.song?.map((so: any) => so.name)) || [];
      
      return new Response(JSON.stringify({
        success: true,
        setlist: {
          id: s.id,
          artistName: s.artist.name,
          venue: s.venue.name,
          eventDate: s.eventDate,
          songs
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, error: 'Action invalide' }), { status: 400, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsHeaders });
  }
});
