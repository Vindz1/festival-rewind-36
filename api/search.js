export default async function handler(req, res) {
  const { query } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;

  if (!query) return res.status(400).json({ error: "Requête vide" });

  try {
    const headers = { 'x-api-key': apiKey, 'Accept': 'application/json' };
    
    // 1. On cherche si c'est un ARTISTE (ex: Gojira)
    const artRes = await fetch(`https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(query)}&p=1`, { headers });
    const artData = await artRes.json();
    const artists = (artData.artist || []).slice(0, 5).map(a => ({
      type: 'artist',
      id: a.mbid,
      name: a.name
    }));

    // 2. On cherche si c'est un FESTIVAL / LIEU (ex: Hellfest)
    const setRes = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=1`, { headers });
    const setData = await setRes.json();
    
    const festivals = [];
    if (setData.setlist) {
      const grouped = new Map();
      setData.setlist.forEach(s => {
        const year = s.eventDate.split('-')[2];
        const key = `${s.venue.name}-${year}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            type: 'festival',
            id: s.venue.id,
            name: `${s.venue.name} ${year}`,
            city: s.venue.city.name,
            year: year
          });
        }
      });
      festivals.push(...Array.from(grouped.values()).slice(0, 10));
    }

    // On renvoie le mélange des deux
    res.status(200).json({ results: [...artists, ...festivals] });
  } catch (error) {
    res.status(500).json({ error: "Erreur moteur" });
  }
}
