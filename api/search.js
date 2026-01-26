export default async function handler(req, res) {
  const { action, username, setlistId } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Festival-Rewind-V3' };

  try {
    if (action === 'user') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/user/${username}/attended?p=1`, { headers });
      if (!response.ok) return res.status(response.status).json({ error: "Utilisateur non trouvé sur Setlist.fm" });
      const data = await response.json();
      return res.status(200).json({ 
        concerts: (data.setlist || []).map(s => ({
          id: s.id, artist: s.artist.name, venue: s.venue.name, date: s.eventDate, city: s.venue.city.name
        }))
      });
    }

    if (action === 'songs') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => so.name)) || [];
      return res.status(200).json({ artist: s.artist.name, songs: songs.filter(Boolean) });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
