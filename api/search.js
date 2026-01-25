export default async function handler(req, res) {
  const { query, action, city, year, setlistId } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };

  try {
    // CAS 1 : RECHERCHE INITIALE (On récupère 3 pages pour avoir les anciennes années)
    if (!action || action === 'search') {
      const resultsMap = new Map();
      // On boucle sur 3 pages pour remonter dans le temps
      for (let p = 1; p <= 3; p++) {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=${p}`, { headers });
        const data = await response.json();
        if (data.setlist) {
          data.setlist.forEach(s => {
            const yearEv = s.eventDate.split('-')[2];
            const cityEv = s.venue.city.name;
            const key = `${cityEv}-${yearEv}`;
            if (!resultsMap.has(key)) {
              resultsMap.set(key, {
                id: s.venue.id,
                name: `${query} ${yearEv}`,
                city: cityEv,
                year: yearEv,
                type: 'festival'
              });
            }
          });
        }
      }
      return res.status(200).json({ results: Array.from(resultsMap.values()) });
    }

    // CAS 2 : LISTE DES ARTISTES D'UNE ÉDITION
    if (action === 'artists') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?cityName=${encodeURIComponent(city)}&year=${year}&p=1`, { headers });
      const data = await response.json();
      const uniqueArtists = new Map();
      data.setlist?.forEach(s => {
        if (!uniqueArtists.has(s.artist.name)) {
          uniqueArtists.set(s.artist.name, {
            name: s.artist.name, mbid: s.artist.mbid, setlistId: s.id, eventDate: s.eventDate
          });
        }
      });
      return res.status(200).json({ artists: Array.from(uniqueArtists.values()) });
    }

    // CAS 3 : DÉTAIL D'UNE SETLIST (CHANSONS)
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
