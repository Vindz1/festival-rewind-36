export default async function handler(req, res) {
  const { query } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Configuration API manquante" });

  try {
    const headers = {
      'x-api-key': apiKey,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    };
    
    // On cherche les événements
    const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=1`, { headers });
    const data = await response.json();

    const resultsMap = new Map();
    
    if (data.setlist) {
      data.setlist.forEach(s => {
        const year = s.eventDate.split('-')[2];
        const city = s.venue.city.name;
        const key = `${city}-${year}`;
        
        // CORRECTION ICI : On utilise bien resultsMap partout
        if (!resultsMap.has(key)) {
          resultsMap.set(key, {
            type: 'festival',
            id: s.venue.id,
            name: `${query} ${year}`,
            city: city,
            country: s.venue.city.country.name,
            year: year
          });
        }
      });
    }

    let finalResults = Array.from(resultsMap.values());

    // Si on n'a pas trouvé de festival, on cherche l'artiste (ex: Gojira)
    if (finalResults.length === 0) {
      const artRes = await fetch(`https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(query)}&p=1`, { headers });
      const artData = await artRes.json();
      if (artData.artist) {
        finalResults = artData.artist.slice(0, 5).map(a => ({
          type: 'artist',
          id: a.mbid,
          name: a.name
        }));
      }
    }

    return res.status(200).json({ results: finalResults });

  } catch (error) {
    return res.status(500).json({ error: "Erreur technique du tunnel" });
  }
}
