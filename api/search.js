export default async function handler(req, res) {
  const { query } = req.query;
  // Utilisation du nom de clé corrigé
  const apiKey = process.env.SETLIST_FM_API_KEY;

  try {
    // STRATÉGIE : On cherche dans les SETLISTS pour trouver les éditions par année
    const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=1`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    // Si l'API renvoie des résultats, on les nettoie pour ne garder que les festivals par année
    if (data.setlist) {
      const grouped = new Map();
      data.setlist.forEach(s => {
        const year = s.eventDate.split('-')[2];
        const city = s.venue.city.name;
        const key = `${city}-${year}`;
        
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: s.venue.id,
            name: `${query} ${year}`, // Ex: Hellfest 2024
            city: city,
            country: s.venue.city.country.name,
            year: year
          });
        }
      });
      return res.status(200).json({ results: Array.from(grouped.values()) });
    }

    res.status(200).json({ results: [] });
  } catch (error) {
    res.status(500).json({ error: "Erreur tunnel de recherche" });
  }
}
