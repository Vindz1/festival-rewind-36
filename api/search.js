export default async function handler(req, res) {
  const { query, action, city, year, setlistId } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };

  // Fonction pour attendre un peu entre deux pages (évite d'être bloqué par Setlist.fm)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // CAS 1 : RECHERCHE DES ÉDITIONS (On cherche sur 10 pages pour remonter dans le temps)
    if (!action || action === 'search') {
      const resultsMap = new Map();
      // On remonte jusqu'à 10 pages pour trouver les anciennes années
      for (let p = 1; p <= 8; p++) {
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
        if (p < 8) await sleep(100); 
      }
      return res.status(200).json({ results: Array.from(resultsMap.values()) });
    }

    // CAS 2 : LISTE COMPLÈTE DES ARTISTES (On tourne les pages jusqu'à 10 pages de groupes)
    if (action === 'artists') {
      const uniqueArtists = new Map();
      for (let p = 1; p <= 10; p++) {
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
        await sleep(100);
      }
      // On trie les artistes par nom pour que ce soit plus propre
      const sortedArtists = Array.from(uniqueArtists.values()).sort((a, b) => a.name.localeCompare(b.name));
      return res.status(200).json({ artists: sortedArtists });
    }

    // CAS 3 : DÉTAIL D'UNE SETLIST (Inchangé car fonctionnel)
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
