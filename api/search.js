export default async function handler(req, res) {
  const { action, username, setlistId, p = 1 } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json' };

  try {
    if (action === 'getUserConcerts') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/user/${username}/attended?p=${p}`, { headers });
      
      if (response.status === 404) return res.status(404).json({ error: "Utilisateur introuvable. Vérifie le pseudo ou si le profil est bien public." });
      if (!response.ok) return res.status(response.status).json({ error: "Erreur API Setlist.fm" });

      const data = await response.json();
      const concerts = (data.setlist || []).map(s => ({
        id: s.id,
        artist: s.artist.name,
        venue: s.venue.name,
        city: s.venue.city.name,
        date: s.eventDate
      }));
      
      return res.status(200).json({ results: concerts });
    }

    if (action === 'getSetlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => so.name)) || [];
      return res.status(200).json({ artist: s.artist.name, songs });
    }
  } catch (e) {
    res.status(500).json({ error: "Le serveur a rencontré un problème." });
  }
}
