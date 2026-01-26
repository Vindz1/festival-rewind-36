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
      // On teste le pseudo tel quel
      const url = `https://api.setlist.fm/rest/1.0/user/${encodeURIComponent(username)}/attended?p=1`;
      console.log("Tentative d'import pour :", username);
      
      const response = await fetch(url, { headers });
      
      if (response.status === 404) {
        return res.status(404).json({ 
          error: `L'utilisateur "${username}" est introuvable. Vérifie l'orthographe ou assure-toi que ton profil Setlist.fm n'est pas en "Privé".` 
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("Erreur API:", errText);
        return res.status(response.status).json({ error: "Setlist.fm refuse l'accès." });
      }

      const data = await response.json();
      
      // Si la liste est vide
      if (!data.setlist || data.setlist.length === 0) {
        return res.status(200).json({ 
          results: [], 
          message: "Ton profil est bien trouvé, mais tu n'as aucun concert marqué comme 'I was there'." 
        });
      }

      const concerts = data.setlist.map(s => ({
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
    console.error("Crash Tunnel:", e);
    res.status(500).json({ error: "Erreur technique du serveur." });
  }
}
