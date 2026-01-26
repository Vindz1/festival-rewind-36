export default async function handler(req, res) {
  const { action, username, setlistId } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;

  const headers = { 
    'x-api-key': apiKey, 
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0'
  };

  try {
    if (action === 'getUserConcerts') {
      const apiUrl = `https://api.setlist.fm/rest/1.0/user/${username.trim()}/attended?p=1`;
      const response = await fetch(apiUrl, { headers });
      
      // DEBUG : On regarde ce que l'API dit vraiment
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Erreur API ${response.status}`,
          debug: `L'API Setlist.fm a répondu ${response.status} pour le pseudo ${username}.`
        });
      }

      const data = await response.json();
      return res.status(200).json({ results: data.setlist || [] });
    }

    if (action === 'getSetlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => (typeof so === 'string' ? so : so.name))) || [];
      return res.status(200).json({ artist: s.artist.name, songs });
    }
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur", details: e.message });
  }
}
