export default async function handler(req, res) {
  const { query } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;

  console.log("--- NOUVELLE RECHERCHE ---");
  console.log("Query:", query);
  console.log("Clé API présente:", apiKey ? "OUI (commence par " + apiKey.substring(0, 4) + ")" : "NON");

  if (!apiKey) return res.status(500).json({ error: "Clé API manquante" });

  try {
    const url = `https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=1`;
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0' // On simule un navigateur pour éviter d'être bloqué
      }
    });

    console.log("Statut Setlist.fm:", response.status);

    if (response.status === 403) {
      console.error("ERREUR 403: Votre clé API est probablement invalide ou désactivée.");
      return res.status(403).json({ error: "Clé API refusée par Setlist.fm" });
    }

    const data = await response.json();
    console.log("Nombre de setlists reçues:", data.setlist ? data.setlist.length : 0);

    const resultsMap = new Map();
    if (data.setlist) {
      data.setlist.forEach(s => {
        const year = s.eventDate.split('-')[2];
        const key = `${s.venue.name}-${year}`;
        if (!grouped.has(key)) {
          resultsMap.set(key, {
            type: 'festival',
            id: s.venue.id,
            name: `${s.venue.name} ${year}`,
            city: s.venue.city.name,
            year: year
          });
        }
      });
    }

    // Si pas de festival, on cherche l'artiste automatiquement
    if (resultsMap.size === 0) {
       console.log("Aucun festival, tentative recherche Artiste...");
       const artRes = await fetch(`https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(query)}&p=1`, {
         headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
       });
       const artData = await artRes.json();
       const artists = (artData.artist || []).slice(0, 5).map(a => ({
         type: 'artist',
         id: a.mbid,
         name: a.name
       }));
       return res.status(200).json({ results: artists });
    }

    return res.status(200).json({ results: Array.from(resultsMap.values()) });

  } catch (error) {
    console.error("CRASH TUNNEL:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
