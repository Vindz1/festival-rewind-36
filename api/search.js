export default async function handler(req, res) {
  const { action, name, city, year, venueId, setlistId, mbid, p = 1 } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    // RECHERCHE DE FESTIVALS / LIEUX
    if (action === 'searchFestivals') {
      const resultsMap = new Map();
      // On boucle sur 5 pages pour ratisser large
      for (let page = 1; page <= 5; page++) {
        let url = `https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(name)}&p=${page}`;
        if (city) url += `&cityName=${encodeURIComponent(city)}`;
        if (year) url += `&year=${year}`;

        const response = await fetch(url, { headers });
        const data = await response.json();
        if (!data.setlist) break;

        data.setlist.forEach(s => {
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
        await sleep(100);
      }
      return res.status(200).json({ results: Array.from(resultsMap.values()) });
    }

    // RECHERCHE D'ARTISTES / CONCERTS PRÉCIS
    if (action === 'searchArtists') {
      let url = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(name)}&p=1`;
      if (city) url += `&cityName=${encodeURIComponent(city)}`;
      if (year) url += `&year=${year}`;

      const response = await fetch(url, { headers });
      const data = await response.json();
      
      const results = (data.setlist || []).map(s => ({
        id: s.id,
        name: s.artist.name,
        venue: s.venue.name,
        city: s.venue.city.name,
        date: s.eventDate,
        type: 'setlist'
      }));
      return res.status(200).json({ results });
    }

    // LISTE DES ARTISTES D'UN FESTIVAL (VENUE ID + YEAR)
    if (action === 'getFestivalArtists') {
      const artists = new Map();
      for (let page = 1; page <= 10; page++) {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueId=${venueId}&year=${year}&p=${page}`, { headers });
        const data = await response.json();
        if (!data.setlist) break;
        data.setlist.forEach(s => {
          if (!artists.has(s.artist.name)) {
            artists.set(s.artist.name, { name: s.artist.name, mbid: s.artist.mbid, setlistId: s.id, eventDate: s.eventDate });
          }
        });
        await sleep(50);
      }
      return res.status(200).json({ artists: Array.from(artists.values()).sort((a,b) => a.name.localeCompare(b.name)) });
    }

    // RÉCUPÉRATION DES MORCEAUX
    if (action === 'getSetlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => so.name)) || [];
      return res.status(200).json({ setlist: { artistName: s.artist.name, eventDate: s.eventDate, songs } });
    }

  } catch (e) { res.status(500).json({ error: e.message }); }
}
