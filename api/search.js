// api/search.js ou api/search.ts

function parseDateSetlistFm(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return new Date(dateStr);
}

function formatDateSetlistFm(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export default async function handler(req, res) {
  const { q, action, username, upcoming, type, p } = req.query;
  const SETLIST_FM_API_KEY = process.env.SETLIST_FM_API_KEY || 'votre-clé-api';

  try {
    // CAS 1 : Recherche Classique
    if (q && !action) {
      // Si "type" n'est pas fourni, on utilise "all" (Mélangé) par défaut
      const searchType = ['artistName', 'cityName', 'tourName', 'all'].includes(type) ? type : 'all';
      const page = p || 1;
      
      let results = [];
      let total = 0;
      let itemsPerPage = 20;

      // Fonction pour appeler Setlist.fm
      const fetchSetlists = async (queryType) => {
        let apiUrl = `https://api.setlist.fm/rest/1.0/search/setlists?${queryType}=${encodeURIComponent(q)}&p=${page}`;
        if (upcoming === 'true') {
          apiUrl += `&date=${formatDateSetlistFm(new Date())}`;
        }
        const response = await fetch(apiUrl, {
          headers: { 'x-api-key': SETLIST_FM_API_KEY, 'Accept': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          return { setlist: data.setlist || [], total: data.total || 0, itemsPerPage: data.itemsPerPage || 20 };
        }
        return { setlist: [], total: 0, itemsPerPage: 20 };
      };

      if (searchType === 'all') {
        // Double recherche : Artiste + Tournée
        const artistData = await fetchSetlists('artistName');
        const tourData = await fetchSetlists('tourName');
        
        results = [...artistData.setlist, ...tourData.setlist];
        total = Math.max(artistData.total, tourData.total) * 2; // Estimation du total restant
        itemsPerPage = artistData.itemsPerPage;

        // Éliminer les doublons
        const unique = [];
        const ids = new Set();
        for (const c of results) {
          if (!ids.has(c.id)) { ids.add(c.id); unique.push(c); }
        }
        
        // Trier par date du plus récent au plus ancien
        unique.sort((a,b) => parseDateSetlistFm(b.eventDate) - parseDateSetlistFm(a.eventDate));
        results = unique;

      } else {
        // Recherche stricte (Ville, ou forcé Artiste)
        const data = await fetchSetlists(searchType);
        results = data.setlist;
        total = data.total;
        itemsPerPage = data.itemsPerPage;
      }

      return res.status(200).json({
        results,
        total,
        itemsPerPage,
        page: parseInt(page)
      });
    }

    // CAS 2 : User
    if (action === 'user' && username) {
      // ... (Reste de ton code pour User ne change pas)
      let allConcerts = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/user/${username}/attended?p=${page}`, {
          headers: { 'x-api-key': SETLIST_FM_API_KEY, 'Accept': 'application/json' }
        });
        if (!response.ok) break;
        const data = await response.json();
        const concerts = data.setlist || [];
        if (concerts.length === 0) hasMore = false;
        else {
          allConcerts = [...allConcerts, ...concerts];
          if (page >= Math.ceil((data.total || 0) / (data.itemsPerPage || 20))) hasMore = false;
          else page++;
        }
      }
      return res.status(200).json({ results: allConcerts, total: allConcerts.length });
    }

    // CAS 3 : Songs
    if (action === 'songs') {
      const { setlistId } = req.query;
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, {
        headers: { 'x-api-key': SETLIST_FM_API_KEY, 'Accept': 'application/json' }
      });
      if (!response.ok) return res.status(response.status).json({ error: 'Introuvable' });
      return res.status(200).json(await response.json());
    }

    return res.status(400).json({ error: 'Invalide' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur', results: [] });
  }
}
