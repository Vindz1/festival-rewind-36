// api/search.js

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

// Helper : fetch avec retry sur 429 (rate limit)
async function fetchWithRetry(url, options, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, options);
      if (r.ok) return r;
      if (r.status === 429 && attempt < retries) {
        await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
        continue;
      }
      return r;
    } catch (e) {
      if (attempt >= retries) throw e;
      await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
    }
  }
}

export default async function handler(req, res) {
  const { q, action, username, upcoming, type, p } = req.query;
  const SETLIST_FM_API_KEY = process.env.SETLIST_FM_API_KEY || 'votre-clé-api';
  const SETLIST_HEADERS = { 'x-api-key': SETLIST_FM_API_KEY, 'Accept': 'application/json' };

  try {
    // CAS 1 : Recherche Classique (INCHANGÉ)
    if (q && !action) {
      const searchType = ['artistName', 'cityName', 'tourName', 'all'].includes(type) ? type : 'all';
      const page = p || 1;

      let results = [];
      let total = 0;
      let itemsPerPage = 20;

      const fetchSetlists = async (queryType) => {
        let apiUrl = `https://api.setlist.fm/rest/1.0/search/setlists?${queryType}=${encodeURIComponent(q)}&p=${page}`;
        if (upcoming === 'true') {
          apiUrl += `&date=${formatDateSetlistFm(new Date())}`;
        }
        const response = await fetch(apiUrl, { headers: SETLIST_HEADERS });
        if (response.ok) {
          const data = await response.json();
          return { setlist: data.setlist || [], total: data.total || 0, itemsPerPage: data.itemsPerPage || 20 };
        }
        return { setlist: [], total: 0, itemsPerPage: 20 };
      };

      if (searchType === 'all') {
        const artistData = await fetchSetlists('artistName');
        const tourData = await fetchSetlists('tourName');

        results = [...artistData.setlist, ...tourData.setlist];
        total = Math.max(artistData.total, tourData.total) * 2;
        itemsPerPage = artistData.itemsPerPage;

        const unique = [];
        const ids = new Set();
        for (const c of results) {
          if (!ids.has(c.id)) { ids.add(c.id); unique.push(c); }
        }

        unique.sort((a, b) => parseDateSetlistFm(b.eventDate) - parseDateSetlistFm(a.eventDate));
        results = unique;

      } else {
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

    // CAS 2 : User (RÉÉCRIT : parallélisé + retry + cache)
    if (action === 'user' && username) {
      const baseUrl = `https://api.setlist.fm/rest/1.0/user/${username}/attended`;

      // Étape 1 : page 1 pour connaître le total
      const firstResponse = await fetchWithRetry(`${baseUrl}?p=1`, { headers: SETLIST_HEADERS });

      if (!firstResponse || !firstResponse.ok) {
        if (firstResponse && firstResponse.status === 404) {
          return res.status(404).json({ error: 'Utilisateur non trouvé', results: [] });
        }
        return res.status(200).json({ results: [], total: 0 });
      }

      const firstData = await firstResponse.json();
      const itemsPerPage = firstData.itemsPerPage || 20;
      const total = firstData.total || 0;
      const totalPages = total > 0 ? Math.ceil(total / itemsPerPage) : 1;

      let allConcerts = firstData.setlist || [];

      // Étape 2 : pages restantes en parallèle, par lots de 4
      if (totalPages > 1) {
        const remainingPages = [];
        for (let pg = 2; pg <= totalPages; pg++) remainingPages.push(pg);

        const BATCH_SIZE = 4;
        for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
          const batch = remainingPages.slice(i, i + BATCH_SIZE);
          const pageResults = await Promise.all(
            batch.map(async (pageNum) => {
              const r = await fetchWithRetry(`${baseUrl}?p=${pageNum}`, { headers: SETLIST_HEADERS });
              if (!r || !r.ok) return [];
              const d = await r.json();
              return d.setlist || [];
            })
          );
          for (const concerts of pageResults) {
            allConcerts = allConcerts.concat(concerts);
          }
        }
      }

      // Dédoublonnage par sécurité
      const seen = new Set();
      const unique = allConcerts.filter(c => {
        if (!c || !c.id || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      // Cache CDN Vercel : 5 min, stale 10 min
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({ results: unique, total: unique.length });
    }

    // CAS 3 : Songs (INCHANGÉ)
    if (action === 'songs') {
      const { setlistId } = req.query;
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, {
        headers: SETLIST_HEADERS
      });
      if (!response.ok) return res.status(response.status).json({ error: 'Introuvable' });
      return res.status(200).json(await response.json());
    }

    return res.status(400).json({ error: 'Invalide' });
  } catch (error) {
    console.error('Erreur API search:', error);
    return res.status(500).json({ error: 'Erreur serveur', results: [] });
  }
}
