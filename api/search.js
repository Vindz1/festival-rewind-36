export default async function handler(req, res) {
  const { query, action, venueId, year, setlistId, mbid } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    // RECHERCHE BRUTE (Festivals & Artistes)
    if (!action || action === 'search') {
      const resultsMap = new Map();
      const artists = [];

      // 1. Recherche Artistes (Top 5)
      const artRes = await fetch(`https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(query)}&p=1`, { headers });
      const artData = await artRes.json();
      if (artData.artist) {
        artData.artist.slice(0, 5).forEach(a => artists.push({ id: a.mbid, name: a.name, type: 'artist' }));
      }

      // 2. Recherche Festivals (SCRAPING DE 50 PAGES)
      // On boucle pour remonter très loin dans les archives
      for (let p = 1; p <= 50; p++) {
        const setRes = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=${p}`, { headers });
        const setData = await setRes.json();
        if (!setData.setlist || setData.setlist.length === 0) break;

        setData.setlist.forEach(s => {
          const y = s.eventDate.split('-')[2];
          const key = `${s.venue.id}-${y}`;
          if (!resultsMap.has(key)) {
            resultsMap.set(key, {
              id: s.venue.id,
              name: `${s.venue.name} ${y}`,
              city: s.venue.city.name,
              year: y,
              type: 'festival'
            });
          }
        });
        await sleep(100); // Protection anti-blocage
      }
      return res.status(200).json({ results: [...artists, ...Array.from(resultsMap.values())] });
    }

    // LISTE TOTALE ARTISTES (SCRAPING DE 50 PAGES)
    if (action === 'artists') {
      const uniqueArtists = new Map();
      for (let p = 1; p <= 50; p++) {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueId=${venueId}&year=${year}&p=${p}`, { headers });
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
      return res.status(200).json({ artists: Array.from(uniqueArtists.values()).sort((a,b) => a.name.localeCompare(b.name)) });
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
