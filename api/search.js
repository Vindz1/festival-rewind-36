export default async function handler(req, res) {
  const { action, name, city, year, venueId, setlistId } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    // 1. RECHERCHE FESTIVALS
    if (action === 'searchFestivals') {
      const resultsMap = new Map();
      for (let page = 1; page <= 10; page++) {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(name)}${city ? `&cityName=${encodeURIComponent(city)}` : ''}${year ? `&year=${year}` : ''}&p=${page}`, { headers });
        if (!response.ok) break;
        const data = await response.json();
        if (!data.setlist) break;
        data.setlist.forEach(s => {
          const y = s.eventDate.split('-')[2];
          const key = `${s.venue.id}-${y}`;
          if (!resultsMap.has(key)) {
            resultsMap.set(key, { id: s.venue.id, name: `${s.venue.name} ${y}`, city: s.venue.city.name, year: y, type: 'festival' });
          }
        });
        if (data.total <= page * 20) break;
        await sleep(50);
      }
      return res.status(200).json({ results: Array.from(resultsMap.values()).sort((a,b) => b.year - a.year) });
    }

    // 2. RECHERCHE ARTISTES
    if (action === 'searchArtists') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(name)}${city ? `&cityName=${encodeURIComponent(city)}` : ''}${year ? `&year=${year}` : ''}&p=1`, { headers });
      const data = await response.json();
      const results = (data.setlist || []).map(s => ({
        id: s.id, name: s.artist.name, venue: s.venue.name, city: s.venue.city.name, date: s.eventDate, type: 'setlist'
      }));
      return res.status(200).json({ results });
    }

    // 3. ARTISTES D'UN FESTIVAL
    if (action === 'getFestivalArtists') {
      const artists = new Map();
      for (let page = 1; page <= 8; page++) {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueId=${venueId}&year=${year}&p=${page}`, { headers });
        if (!response.ok) break;
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

    // 4. RÉCUPÉRATION SETLIST (CORRIGÉ)
    if (action === 'getSetlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      if (!s.artist) return res.status(404).json({ error: "Non trouvé" });
      
      // Extraction sécurisée des chansons
      const songs = [];
      if (s.sets && s.sets.set) {
        s.sets.set.forEach(set => {
          if (set.song) {
            set.song.forEach(song => { if (song.name) songs.push(song.name); });
          }
        });
      }
      return res.status(200).json({ setlist: { artistName: s.artist.name, eventDate: s.eventDate, songs } });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
}
