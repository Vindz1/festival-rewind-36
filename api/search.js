export default async function handler(req, res) {
  // On récupère le pseudo proprement sans passer par url.parse()
  const { action, username, setlistId } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;

  const headers = { 
    'x-api-key': apiKey, 
    'Accept': 'application/json',
    'User-Agent': 'Festival-Rewind-App'
  };

  try {
    if (action === 'getUserConcerts') {
      const cleanUsername = username.trim();
      const apiUrl = `https://api.setlist.fm/rest/1.0/user/${cleanUsername}/attended?p=1`;
      
      console.log(`[DEBUG] Tentative sur : ${apiUrl}`);

      const response = await fetch(apiUrl, { headers });
      
      // Si 404, on essaie une dernière fois en minuscules
      if (response.status === 404) {
        const retryUrl = `https://api.setlist.fm/rest/1.0/user/${cleanUsername.toLowerCase()}/attended?p=1`;
        const retryRes = await fetch(retryUrl, { headers });
        
        if (!retryRes.ok) {
          return res.status(404).json({ 
            error: `Pseudo "${cleanUsername}" non reconnu par l'API. Es-tu sûr de ton pseudo technique ?` 
          });
        }
        const data = await retryRes.json();
        return res.status(200).json({ results: data.setlist || [] });
      }

      const data = await response.json();
      // On renvoie directement la liste
      return res.status(200).json({ results: data.setlist || [] });
    }

    if (action === 'getSetlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => (typeof so === 'string' ? so : so.name))) || [];
      return res.status(200).json({ artist: s.artist.name, songs });
    }
  } catch (e) {
    res.status(500).json({ error: "Erreur de serveur : " + e.message });
  }
}
