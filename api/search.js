export default async function handler(req, res) {
  // Correction de la récupération des paramètres pour éviter le warning
  const urlObj = new URL(req.url, `https://${req.headers.host}`);
  const action = urlObj.searchParams.get('action');
  const username = urlObj.searchParams.get('username')?.trim();
  const setlistId = urlObj.searchParams.get('setlistId');
  const p = urlObj.searchParams.get('p') || '1';

  const apiKey = process.env.SETLIST_FM_API_KEY;
  const headers = { 
    'x-api-key': apiKey, 
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  try {
    if (action === 'getUserConcerts') {
      // On teste l'URL précise que l'API attend
      const apiUrl = `https://api.setlist.fm/rest/1.0/user/${username}/attended?p=${p}`;
      console.log(`[DEBUG] Appel API : ${apiUrl}`);

      const response = await fetch(apiUrl, { headers });
      
      if (response.status === 404) {
        // On tente une version tout en minuscules au cas où
        const retryUrl = `https://api.setlist.fm/rest/1.0/user/${username.toLowerCase()}/attended?p=${p}`;
        console.log(`[DEBUG] 404 reçu. Tentative de secours : ${retryUrl}`);
        const retryRes = await fetch(retryUrl, { headers });
        
        if (!retryRes.ok) {
          return res.status(404).json({ error: `Setlist.fm ne trouve pas l'utilisateur "${username}" via son API. Vérifie que ton pseudo est exactement celui affiché sur ton profil (souvent sensible à la casse).` });
        }
        // Si le secours fonctionne, on continue avec ces données
        const data = await retryRes.json();
        return res.status(200).json({ results: formatConcerts(data) });
      }

      const data = await response.json();
      return res.status(200).json({ results: formatConcerts(data) });
    }

    if (action === 'getSetlist') {
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, { headers });
      const s = await response.json();
      const songs = s.sets?.set?.flatMap(set => set.song?.map(so => so.name)) || [];
      return res.status(200).json({ artist: s.artist.name, songs });
    }
  } catch (e) {
    console.error(`[CRASH] ${e.message}`);
    res.status(500).json({ error: "Erreur technique." });
  }
}

// Fonction pour harmoniser les données
function formatConcerts(data) {
  return (data.setlist || []).map(s => ({
    id: s.id,
    artist: s.artist.name,
    venue: s.venue.name,
    city: s.venue.city.name,
    date: s.eventDate
  }));
}
