export default async function handler(req, res) {
  const { action, username, setlistId, q } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 
    'x-api-key': apiKey, 
    'Accept': 'application/json', 
    'User-Agent': 'Festival-Rewind' 
  };
  
  try {
    // CORRECTION : Gérer le cas "action=user"
    if (action === 'user') {
      if (!username) {
        return res.status(400).json({ error: "Username manquant" });
      }
      
      // Récupérer TOUS les concerts (pagination)
      let allConcerts = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/user/${username}/attended?p=${page}`, { headers });
        if (!response.ok) {
          if (page === 1) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
          }
          break;
        }
        
        const data = await response.json();
        const concerts = data.setlist || [];
        
        if (concerts.length === 0) {
          hasMore = false;
        } else {
          allConcerts = [...allConcerts, ...concerts];
          
          const totalPages = Math.ceil((data.total || 0) / (data.itemsPerPage || 20));
          if (page >= totalPages) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }
      
      return res.status(200).json({ results: allConcerts });
    }
    
    if (action === 'songs') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => so.name)) || [];
      return res.status(200).json({ artist: s.artist.name, songs: songs.filter(Boolean) });
    }
    
    // CORRECTION : Gérer la recherche classique (q=...)
    if (q) {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(q)}`, { headers });
      const data = await response.json();
      return res.status(200).json({ results: data.setlist || [] });
    }
    
    // Si aucun paramètre valide
    return res.status(400).json({ error: "Paramètres manquants (action, q, ou setlistId requis)" });
    
  } catch (e) {
    console.error('API Error:', e);
    res.status(500).json({ error: e.message });
  }
}
