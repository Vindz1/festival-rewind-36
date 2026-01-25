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
    const { action, query, venueId, year, cityName, setlistId } = body;
    const headers = { 'x-api-key': SETLIST_FM_API_KEY!, 'Accept': 'application/json' };

    // RECHERCHE MONDIALE REGROUPÉE PAR ANNÉE
    if (action === 'searchFestivalsAndArtists') {
      const resultsMap = new Map();
      const response = await fetch(`${SETLIST_FM_BASE_URL}/search/setlists?venueName=${encodeURIComponent(query)}&p=1`, { headers });
      const data = await response.json();

      if (data.setlist) {
        data.setlist.forEach((s: any) => {
          const yearEv = s.eventDate.split('-')[2];
          const city = s.venue.city.name;
          // Clé unique : Ville + Année (ex: Clisson-2024)
          const key = `${city}-${yearEv}`;
          
          if (!resultsMap.has(key)) {
            resultsMap.set(key, {
              type: 'festival',
              id: s.venue.id, // On garde un ID de référence
              name: `${query} ${yearEv}`,
              city: city,
              country: s.venue.city.country.name,
              year: yearEv
            });
          }
        });
      }
      return new Response(JSON.stringify({ success: true, results: Array.from(resultsMap.values()) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // CHARGEMENT DE TOUS LES ARTISTES D'UNE VILLE POUR UNE ANNÉE (FESTIVAL COMPLET)
    if (action === 'getVenueArtists') {
      // On cherche par Ville + Année pour avoir TOUTES les scènes du festival
      const url = `${SETLIST_FM_BASE_URL}/search/setlists?cityName=${encodeURIComponent(cityName)}&year=${year}&p=1`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      // Dédoublonnage des artistes
      const artistsMap = new Map();
      (data.setlist || []).forEach((s: any) => {
        if (!artistsMap.has(s.artist.name)) {
          artistsMap.set(s.artist.name, {
            mbid: s.artist.mbid,
            name: s.artist.name,
            eventDate: s.eventDate,
            setlistId: s.id
          });
        }
      });

      return new Response(JSON.stringify({ success: true, artists: Array.from(artistsMap.values()) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // RÉCUPÉRATION D'UNE SETLIST (AVEC LES MORCEAUX)
    if (action === 'getSetlist') {
      const response = await fetch(`${SETLIST_FM_BASE_URL}/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap((set: any) => set.song?.map((so: any) => so.name)) || [];
      return new Response(JSON.stringify({
        success: true,
        setlist: { id: s.id, artistName: s.artist.name, eventDate: s.eventDate, songs, venue: s.venue.name }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
