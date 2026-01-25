export default async function handler(req, res) {
  const { query } = req.query;
  // On utilise le nom de clé standardisé
  const apiKey = process.env.SETLIST_FM_API_KEY;

  console.log("Recherche lancée pour:", query);
  
  if (!apiKey) {
    console.error("ERREUR: Clé API manquante dans Vercel");
    return res.status(500).json({ error: "Configuration clé API manquante" });
  }

  try {
    const headers = { 
      'x-api-key': apiKey, 
      'Accept': 'application/json',
      'User-Agent': 'SetlistMemory/1.0'
    };
    
    // On tente une recherche large (Setlists)
    const url = `https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=1`;
    const response = await fetch(url, { headers });
    const data = await response.json();

    let results = [];

    // Si on trouve des festivals/concerts
    if (data.setlist) {
      const grouped = new Map();
      data.setlist.forEach(s => {
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
      results = Array.from(grouped.values());
    }

    // Si c'est vide, on tente de chercher l'artiste (ex: Gojira)
    if (results.length === 0) {
      const artRes = await fetch(`https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(query)}&p=1`, { headers });
      const artData = await artRes.json();
      if (artData.artist) {
        results = artData.artist.slice(0, 5).map(a => ({
          type: 'artist',
          id: a.mbid,
          name: a.name
        }));
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Crash du tunnel:", error);
    return res.status(500).json({ error: "Erreur interne du tunnel" });
  }
}
