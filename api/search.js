export default async function handler(req, res) {
  const { query, action, city, year, setlistId } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    if (!action || action === 'search') {
      const resultsMap = new Map();
      
      // 1. DÉTECTION D'UNE ANNÉE DANS LA RECHERCHE (ex: "Hellfest 2016")
      const yearMatch = query.match(/\b(19|20)\d{2}\b/);
      const forcedYear = yearMatch ? yearMatch[0] : null;
      const cleanQuery = forcedYear ? query.replace(forcedYear, '').trim() : query;

      // 2. LOGIQUE DE RECHERCHE
      // Si une année est précisée, on cherche uniquement celle-là
      // Sinon, on cherche les 6 dernières années par défaut
      const yearsToCheck = forcedYear ? [forcedYear] : [2025, 2024, 2023, 2022, 2021, 2019];

      for (const y of yearsToCheck) {
        const url = `https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(cleanQuery)}&year=${y}&p=1`;
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        if (data.setlist && data.setlist.length > 0) {
          const s = data.setlist[0];
          const cityEv = s.venue.city.name;
          const key = `${cityEv}-${y}`;
          
          if (!resultsMap.has(key)) {
            resultsMap.set(key, {
              id: s.venue.id,
              name: `${cleanQuery} ${y}`,
              city: cityEv,
              year: y,
              type: 'festival'
            });
          }
        }
        if (yearsToCheck.length > 1) await sleep(50);
      }
      
      return res.status(200).json({ results: Array.from(resultsMap.values()) });
    }

    // CAS : ARTISTES (On augmente à 15 pages pour être sûr de tout avoir)
    if (action === 'artists') {
      const uniqueArtists = new Map();
      for (let p = 1; p <= 15; p++) {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?cityName=${encodeURIComponent(city)}&year=${year}&p=${p}`, { headers });
        const data = await response.json();
        if (!data.setlist || data.setlist.length === 0) break;

        data.setlist.forEach(s => {
          if (!uniqueArtists.has(s.artist.name)) {
            uniqueArtists.set(s.artist.name, {
              name: s.artist.name, mbid: s.artist.mbid, setlistId: s.id, eventDate: s.eventDate
            });
          }
        });
        await sleep(50);
      }
      const sortedArtists = Array.from(uniqueArtists.values()).sort((a, b) => a.name.localeCompare(b.name));
      return res.status(200).json({ artists: sortedArtists });
    }

    // CAS : SETLIST
    if (action === 'setlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => so.name)) || [];
      return res.status(200).json({
        setlist: { artistName: s.artist.name, eventDate: s.eventDate, songs, id: s.id }
      });
    }

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
