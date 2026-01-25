export default async function handler(req, res) {
  const { query, action, venueId, year, setlistId } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // 1. RECHERCHE DES ÉDITIONS : On filtre pour éviter les bars/clubs
    if (!action || action === 'search') {
      const resultsMap = new Map();
      const yearMatch = query.match(/\b(19|20)\d{2}\b/);
      const forcedYear = yearMatch ? yearMatch[0] : null;
      const cleanQuery = forcedYear ? query.replace(forcedYear, '').trim() : query;

      // On cherche sur plusieurs années
      const years = forcedYear ? [forcedYear] : [2025, 2024, 2023, 2022, 2019, 2018, 2017, 2016];

      for (const y of years) {
        const url = `https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(cleanQuery)}&year=${y}&p=1`;
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        if (data.setlist && data.setlist.length > 0) {
          // On cherche la setlist qui a le plus de morceaux (signe du vrai festival)
          const mainEvent = data.setlist.reduce((prev, current) => 
            (prev.sets?.set?.length || 0) > (current.sets?.set?.length || 0) ? prev : current
          );

          const key = `${mainEvent.venue.id}-${y}`;
          if (!resultsMap.has(key)) {
            resultsMap.set(key, {
              id: mainEvent.venue.id,
              name: `${cleanQuery} ${y}`,
              city: mainEvent.venue.city.name,
              year: y,
              type: 'festival'
            });
          }
        }
        if (years.length > 1) await sleep(50);
      }
      return res.status(200).json({ results: Array.from(resultsMap.values()) });
    }

    // 2. LISTE DES ARTISTES : On utilise le VENUE ID (indispensable !)
    if (action === 'artists') {
      const uniqueArtists = new Map();
      for (let p = 1; p <= 15; p++) {
        const url = `https://api.setlist.fm/rest/1.0/search/setlists?venueId=${venueId}&year=${year}&p=${p}`;
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (!data.setlist) break;

        data.setlist.forEach(s => {
          if (!uniqueArtists.has(s.artist.name)) {
            uniqueArtists.set(s.artist.name, {
              name: s.artist.name, mbid: s.artist.mbid, setlistId: s.id, eventDate: s.eventDate
            });
          }
        });
        await sleep(50);
      }
      return res.status(200).json({ artists: Array.from(uniqueArtists.values()).sort((a, b) => a.name.localeCompare(b.name)) });
    }

    // 3. SETLIST (Détail chansons)
    if (action === 'setlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => so.name)) || [];
      return res.status(200).json({ setlist: { artistName: s.artist.name, eventDate: s.eventDate, songs, id: s.id } });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
