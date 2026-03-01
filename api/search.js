// api/search.js ou api/search.ts

// Fonction helper pour parser les dates Setlist.fm (format DD-MM-YYYY)
function parseDateSetlistFm(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return new Date(dateStr);
}

// Fonction helper pour formater en YYYYMMDD
function formatDateSetlistFm(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export default async function handler(req, res) {
  // CORRECTION ICI : On récupère bien 'type' et 'p' depuis la requête URL
  const { q, action, username, upcoming, type, p } = req.query;
  
  const SETLIST_FM_API_KEY = process.env.SETLIST_FM_API_KEY || 'votre-clé-api';

  try {
    // CAS 1 : Recherche de concerts pour un artiste, ville ou tournée
    if (q && !action) {
      // 1. On sécurise le type de recherche (par défaut: artistName)
      const searchType = ['artistName', 'cityName', 'tourName'].includes(type) ? type : 'artistName';
      // 2. On récupère la page demandée (par défaut: 1)
      const page = p || 1;
      
      console.log(`🔍 Recherche pour: ${q} (Type: ${searchType}, Page: ${page})`);
      
      // 3. L'URL s'adapte maintenant à la ville/tournée et à la page !
      let apiUrl = `https://api.setlist.fm/rest/1.0/search/setlists?${searchType}=${encodeURIComponent(q)}&p=${page}`;
      
      if (upcoming === 'true') {
        const today = new Date();
        const todayStr = formatDateSetlistFm(today);
        apiUrl += `&date=${todayStr}`; // Setlist.fm cherche >= cette date
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'x-api-key': SETLIST_FM_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Setlist.fm API error: ${response.status}`);
        return res.status(response.status).json({ 
          error: 'Erreur API Setlist.fm',
          results: []
        });
      }

      const data = await response.json();
      const concerts = data.setlist || [];
      
      console.log(`✅ ${concerts.length} concert(s) trouvé(s)`);

      // 4. On renvoie aussi les infos de pagination !
      return res.status(200).json({
        results: concerts,
        total: data.total || 0,
        itemsPerPage: data.itemsPerPage || 20,
        page: data.page || 1
      });
    }

    // CAS 2 : Récupérer les concerts d'un utilisateur (action=user)
    if (action === 'user' && username) {
      console.log(`📡 Récupération concerts pour user: ${username}`);
      
      let allConcerts = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `https://api.setlist.fm/rest/1.0/user/${username}/attended?p=${page}`,
          {
            headers: {
              'x-api-key': SETLIST_FM_API_KEY,
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error(`❌ Error fetching page ${page}`);
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

      console.log(`✅ Total: ${allConcerts.length} concerts`);

      return res.status(200).json({
        results: allConcerts,
        total: allConcerts.length
      });
    }

    // CAS 3 : Récupérer les détails d'une setlist (action=songs)
    if (action === 'songs') {
      const { setlistId } = req.query;
      
      if (!setlistId) {
        return res.status(400).json({ error: 'setlistId requis' });
      }

      const response = await fetch(
        `https://api.setlist.fm/rest/1.0/setlist/${setlistId}`,
        {
          headers: {
            'x-api-key': SETLIST_FM_API_KEY,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Setlist introuvable' });
      }

      const data = await response.json();
      
      return res.status(200).json(data);
    }

    // Aucun paramètre valide
    return res.status(400).json({ 
      error: 'Paramètres invalides',
      message: 'Utilisez ?q=artiste OU ?action=user&username=xxx'
    });

  } catch (error) {
    console.error('❌ Erreur API:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      results: []
    });
  }
}
