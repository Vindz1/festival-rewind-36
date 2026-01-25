export default async function handler(req, res) {
  const { query } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;

  try {
    const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=1`, {
      headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
    });

    const data = await response.json();
    const resultsMap = new Map();

    if (data.setlist) {
      data.setlist.forEach(s => {
        const year = s.eventDate.split('-')[2];
        const key = `${s.venue.city.name}-${year}`;
        if (!resultsMap.has(key)) {
          resultsMap.set(key, {
            id: s.venue.id,
            name: `${query} ${year}`,
            city: s.venue.city.name,
            year: year,
            type: 'festival'
          });
        }
      });
    }

    // On renvoie un objet propre : { results: [...] }
    return res.status(200).json({ results: Array.from(resultsMap.values()) });
  } catch (e) {
    return res.status(500).json({ results: [], error: e.message });
  }
}
