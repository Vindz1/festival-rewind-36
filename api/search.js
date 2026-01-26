export default async function handler(req, res) {
  const { action, username, setlistId, p = 1 } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 'x-api-key': apiKey, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };

  try {
    // RÉCUPÉRER LES CONCERTS D'UN UTILISATEUR
    if (action === 'getUserConcerts') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/user/${username}/attended?p=${p}`, { headers });
      
      if (response.status === 404) return res.status(404).json({ error: "Utilisateur non trouvé ou profil privé" });
      
      const data = await response.json();
      const concerts = (data.setlist || []).map(s => ({
        id: s.id,
        artist: s.artist.name,
        venue: s.venue.name,
        city: s.venue.city.name,
        date: s.eventDate,
        year: s.eventDate.split('-')[2]
      }));
      
      return res.status(200).json({ concerts, total: data.total });
    }

    // RÉCUPÉRER LES CHANSONS D'UNE SETLIST
    if (action === 'getSetlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = [];
      if (s.sets && s.sets.set) {
        s.sets.set.forEach(set => {
          if (set.song) set.song.forEach(song => { if (song.name) songs.push(song.name); });
        });
      }
      return res.status(200).json({ artist: s.artist.name, songs });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
