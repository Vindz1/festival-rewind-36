export default async function handler(req, res) {
  const { query, action, venueId, year, setlistId, mbid } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };

  try {
    // RECHERCHE (Artiste ou Festival)
    if (!action || action === 'search') {
      // 1. On cherche d'abord si c'est un artiste (ex: Gojira)
      const artRes = await fetch(`https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(query)}&p=1`, { headers });
      const artData = await artRes.json();
      const artists = (artData.artist || []).slice(0, 3).map(a => ({
        id: a.mbid, name: a.name, type: 'artist'
      }));

      // 2. On cherche les éditions de festivals
      const yearMatch = query.match(/\b(19|20)\d{2}\b/);
      const forcedYear = yearMatch ? yearMatch[0] : null;
      const cleanQuery = forcedYear ? query.replace(forcedYear, '').trim() : query;
      const years = forcedYear ? [forcedYear] : [2025, 2024, 2023];

      const festivals = [];
      for (const y of years) {
        const setRes = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(cleanQuery)}&year=${y}&p=1`, { headers });
        const setData = await setRes.json();
        if (setData.setlist && setData.setlist.length > 0) {
          const s = setData.setlist[0];
          festivals.push({ id: s.venue.id, name: `${cleanQuery} ${y}`, city: s.venue.city.name, year: y, type: 'festival' });
        }
      }
      return res.status(200).json({ results: [...artists, ...festivals] });
    }

    // LISTE DES CONCERTS D'UN ARTISTE
    if (action === 'artistConcerts') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/artist/${mbid}/setlists?p=1`, { headers });
      const data = await response.json();
      const concerts = (data.setlist || []).map(s => ({
        setlistId: s.id, eventDate: s.eventDate, venue: s.venue.name, city: s.venue.city.name
      }));
      return res.status(200).json({ concerts });
    }

    // LISTE DES ARTISTES D'UN FESTIVAL
    if (action === 'artists') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueId=${venueId}&year=${year}&p=1`, { headers });
      const data = await response.json();
      const artists = (data.setlist || []).map(s => ({
        name: s.artist.name, mbid: s.artist.mbid, setlistId: s.id, eventDate: s.eventDate
      }));
      return res.status(200).json({ artists: artists.filter((v,i,a)=>a.findIndex(t=>(t.name===v.name))===i) });
    }

    // DÉTAIL SETLIST
    if (action === 'setlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => so.name)) || [];
      return res.status(200).json({ setlist: { artistName: s.artist.name, eventDate: s.eventDate, songs, id: s.id } });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
}
