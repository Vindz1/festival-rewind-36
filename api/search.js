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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch une URL Setlist.fm avec retry exponentiel sur 429.
 * - maxRetries : nombre max de tentatives (défaut 3 = jusqu'à ~7s de backoff au total)
 * - Renvoie { ok, data, status } : ok=false si toutes les tentatives ont échoué.
 */
async function fetchSetlistWithRetry(url, headers, maxRetries = 3) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, { headers });
      lastStatus = response.status;

      if (response.ok) {
        const data = await response.json();
        return { ok: true, data, status: response.status };
      }

      // 429 ou 503 = on attend et on retente
      if (response.status === 429 || response.status === 503) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`[Setlist.fm] ${response.status} sur ${url} — retry dans ${backoffMs}ms (tentative ${attempt + 1}/${maxRetries})`);
        await sleep(backoffMs);
        continue;
      }

      // Autre code d'erreur (404, 500…) → on ne retry pas
      return { ok: false, data: null, status: response.status };
    } catch (err) {
      console.error(`[Setlist.fm] Exception sur ${url} (tentative ${attempt + 1}):`, err.message);
      // Retry sur erreur réseau aussi
      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  console.error(`[Setlist.fm] Échec définitif après ${maxRetries} tentatives : ${url} (dernier statut: ${lastStatus})`);
  return { ok: false, data: null, status: lastStatus };
}

/**
 * Extrait tous les morceaux d'une setlist Setlist.fm en gérant tous les cas vides.
 * Filtre les "tape" (musique d'ambiance), "Unknown", etc.
 */
function extractSongsFromSetlist(setlist, defaultArtist) {
  const songs = [];
  if (!setlist?.sets?.set) return songs;
  const sets = Array.isArray(setlist.sets.set) ? setlist.sets.set : [setlist.sets.set];
  for (const s of sets) {
    if (!s.song) continue;
    const songArr = Array.isArray(s.song) ? s.song : [s.song];
    for (const song of songArr) {
      if (
        song.tape ||
        !song.name ||
        song.name.trim() === '' ||
        song.name.toLowerCase().includes('unknown')
      ) continue;
      songs.push({
        artist: song.cover?.name || defaultArtist,
        name: song.name.trim(),
      });
    }
  }
  return songs;
}

/**
 * Agrège plusieurs setlists pour calculer la "setlist moyenne" d'un artiste.
 * Retourne les morceaux triés par fréquence décroissante.
 *
 * Stratégie : on garde les morceaux joués dans au moins MIN_FREQ_RATIO des setlists,
 * avec un plafond à MAX_SONGS pour rester proche d'une vraie taille de setlist.
 */
function aggregateSetlists(setlists, defaultArtist) {
  const MIN_FREQ_RATIO = 0.3; // un morceau doit apparaître dans ≥30% des setlists
  const MAX_SONGS = 20; // taille max d'une "average setlist"

  if (setlists.length === 0) return [];

  // Normalisation pour grouper "Heir Apparent" / "heir apparent" / etc.
  const normalize = (s) =>
    s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');

  const songCounts = new Map(); // normalized name -> { count, originalName, artist }
  for (const setlist of setlists) {
    const songs = extractSongsFromSetlist(setlist, defaultArtist);
    // Dédoublonne au sein d'une même setlist (rappels, etc.)
    const uniqueInThis = new Set();
    for (const song of songs) {
      const key = normalize(song.name);
      if (uniqueInThis.has(key)) continue;
      uniqueInThis.add(key);
      const existing = songCounts.get(key);
      if (existing) existing.count++;
      else songCounts.set(key, { count: 1, originalName: song.name, artist: song.artist });
    }
  }

  const minOccurrences = Math.max(2, Math.ceil(setlists.length * MIN_FREQ_RATIO));

  const ranked = Array.from(songCounts.values())
    .filter((s) => s.count >= minOccurrences)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_SONGS)
    .map((s) => ({ artist: s.artist, name: s.originalName }));

  return ranked;
}

export default async function handler(req, res) {
  const { q, action, username, upcoming, type, p } = req.query;
  const SETLIST_FM_API_KEY = process.env.SETLIST_FM_API_KEY || 'votre-clé-api';
  const HEADERS = { 'x-api-key': SETLIST_FM_API_KEY, 'Accept': 'application/json' };

  try {
    // ========================================================================
    // CAS 1 : Recherche Classique (inchangé)
    // ========================================================================
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
        const response = await fetch(apiUrl, { headers: HEADERS });
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
          if (!ids.has(c.id)) {
            ids.add(c.id);
            unique.push(c);
          }
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
        page: parseInt(page),
      });
    }

    // ========================================================================
    // CAS 2 : User /attended — FIX : pagination batch + retry 429
    // ========================================================================
    if (action === 'user' && username) {
      const baseUrl = `https://api.setlist.fm/rest/1.0/user/${encodeURIComponent(username)}/attended`;
      const BATCH_SIZE = 4; // 4 pages en parallèle, comme le fix de la recherche
      const DELAY_BETWEEN_BATCHES_MS = 600;

      // ÉTAPE 1 : récupérer la page 1 pour connaître le total réel
      const firstPage = await fetchSetlistWithRetry(`${baseUrl}?p=1`, HEADERS);

      if (!firstPage.ok) {
        if (firstPage.status === 404) {
          return res.status(404).json({ error: 'Utilisateur Setlist.fm introuvable' });
        }
        return res.status(firstPage.status || 500).json({
          error: 'Erreur Setlist.fm lors de la première requête',
          status: firstPage.status,
        });
      }

      const firstData = firstPage.data;
      const itemsPerPage = firstData.itemsPerPage || 20;
      const totalConcerts = firstData.total || 0;
      const totalPages = Math.ceil(totalConcerts / itemsPerPage);

      console.log(`[Setlist.fm/user] ${username} — total annoncé: ${totalConcerts} (${totalPages} page(s))`);

      let allConcerts = [...(firstData.setlist || [])];

      // ÉTAPE 2 : si plus d'une page, fetch les pages restantes en batches parallèles
      if (totalPages > 1) {
        const remainingPages = [];
        for (let p = 2; p <= totalPages; p++) {
          remainingPages.push(p);
        }

        let failedPages = [];

        // Batch loop
        for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
          const batch = remainingPages.slice(i, i + BATCH_SIZE);

          const batchResults = await Promise.all(
            batch.map((pageNum) =>
              fetchSetlistWithRetry(`${baseUrl}?p=${pageNum}`, HEADERS).then((result) => ({
                pageNum,
                ...result,
              }))
            )
          );

          for (const r of batchResults) {
            if (r.ok && r.data?.setlist) {
              allConcerts.push(...r.data.setlist);
            } else {
              failedPages.push(r.pageNum);
            }
          }

          // Petite pause entre les batches pour rester poli avec l'API
          if (i + BATCH_SIZE < remainingPages.length) {
            await sleep(DELAY_BETWEEN_BATCHES_MS);
          }
        }

        if (failedPages.length > 0) {
          console.warn(
            `[Setlist.fm/user] ${username} — ${failedPages.length} page(s) en échec définitif:`,
            failedPages
          );
        }
      }

      // Dédoublonnage par ID (au cas où l'API renvoie des doublons en bordure de page)
      const seen = new Set();
      const uniqueConcerts = [];
      for (const c of allConcerts) {
        if (c.id && !seen.has(c.id)) {
          seen.add(c.id);
          uniqueConcerts.push(c);
        }
      }

      const partial = uniqueConcerts.length < totalConcerts;

      console.log(
        `[Setlist.fm/user] ${username} — récupéré: ${uniqueConcerts.length}/${totalConcerts}${
          partial ? ' (PARTIEL)' : ''
        }`
      );

      return res.status(200).json({
        results: uniqueConcerts,
        total: totalConcerts, // ← vrai total de Setlist.fm, pas la longueur du résultat
        fetched: uniqueConcerts.length, // ← combien on a vraiment récupéré
        partial, // ← true si on n'a pas tout eu
      });
    }

    // ========================================================================
    // CAS 3 : Find Setlists — recherche multi-critères pour un artiste
    //   - artistName (requis)
    //   - year (optionnel)
    //   - date (optionnel, format dd-MM-yyyy comme Setlist.fm)
    //   - cityName (optionnel)
    //   - venueName (optionnel)
    // Utilisé pour : retrouver la setlist d'un artiste à un festival passé
    // ========================================================================
    if (action === 'findSetlists') {
      const { artistName, year, date, cityName, venueName } = req.query;
      if (!artistName) return res.status(400).json({ error: 'artistName requis' });

      const params = new URLSearchParams({ artistName, p: '1' });
      if (year) params.set('year', year);
      if (date) params.set('date', date);
      if (cityName) params.set('cityName', cityName);
      if (venueName) params.set('venueName', venueName);

      const url = `https://api.setlist.fm/rest/1.0/search/setlists?${params.toString()}`;
      const result = await fetchSetlistWithRetry(url, HEADERS);

      if (!result.ok) {
        // 404 = aucun résultat, ce n'est pas une erreur applicative
        if (result.status === 404) {
          return res.status(200).json({ results: [], total: 0 });
        }
        return res.status(result.status || 500).json({
          error: 'Erreur Setlist.fm',
          status: result.status,
        });
      }

      return res.status(200).json({
        results: result.data.setlist || [],
        total: result.data.total || 0,
      });
    }

    // ========================================================================
    // CAS 4 : Average Setlist — la setlist "type" d'un artiste sur une année
    // Récupère jusqu'à N pages de setlists pour cet artiste/année, agrège,
    // renvoie les morceaux les plus joués.
    //   - artistName (requis)
    //   - year (optionnel mais recommandé)
    //   - maxPages (optionnel, défaut 5 = jusqu'à 100 setlists analysées)
    // ========================================================================
    if (action === 'averageSetlist') {
      const { artistName, year } = req.query;
      const maxPages = Math.min(parseInt(req.query.maxPages || '5', 10), 10);

      if (!artistName) return res.status(400).json({ error: 'artistName requis' });

      const baseParams = new URLSearchParams({ artistName });
      if (year) baseParams.set('year', year);

      const buildUrl = (page) => {
        const p = new URLSearchParams(baseParams);
        p.set('p', String(page));
        return `https://api.setlist.fm/rest/1.0/search/setlists?${p.toString()}`;
      };

      // Page 1 d'abord pour connaître le total
      const firstPage = await fetchSetlistWithRetry(buildUrl(1), HEADERS);
      if (!firstPage.ok) {
        if (firstPage.status === 404) {
          return res.status(200).json({ tracks: [], analyzedSetlists: 0, source: 'average' });
        }
        return res.status(firstPage.status || 500).json({
          error: 'Erreur Setlist.fm',
          status: firstPage.status,
        });
      }

      const itemsPerPage = firstPage.data.itemsPerPage || 20;
      const totalAvailable = firstPage.data.total || 0;
      const totalPages = Math.min(Math.ceil(totalAvailable / itemsPerPage), maxPages);

      console.log(
        `[averageSetlist] ${artistName}${year ? ' (' + year + ')' : ''} — ${totalAvailable} setlists disponibles, on en analyse jusqu'à ${maxPages * itemsPerPage}`
      );

      const allSetlists = [...(firstPage.data.setlist || [])];

      // Pages restantes en parallèle (batch de 4)
      if (totalPages > 1) {
        const remainingPages = [];
        for (let p = 2; p <= totalPages; p++) remainingPages.push(p);
        const BATCH_SIZE = 4;
        for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
          const batch = remainingPages.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(
            batch.map((p) => fetchSetlistWithRetry(buildUrl(p), HEADERS))
          );
          for (const r of results) {
            if (r.ok && r.data?.setlist) allSetlists.push(...r.data.setlist);
          }
          if (i + BATCH_SIZE < remainingPages.length) await sleep(600);
        }
      }

      const tracks = aggregateSetlists(allSetlists, artistName);

      console.log(
        `[averageSetlist] ${artistName} — ${allSetlists.length} setlists analysées → ${tracks.length} morceaux retenus`
      );

      return res.status(200).json({
        tracks,
        analyzedSetlists: allSetlists.length,
        source: 'average',
      });
    }

    // ========================================================================
    // CAS 5 : Songs (inchangé)
    // ========================================================================
    if (action === 'songs') {
      const { setlistId } = req.query;
      const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${setlistId}`, {
        headers: HEADERS,
      });
      if (!response.ok) return res.status(response.status).json({ error: 'Introuvable' });
      return res.status(200).json(await response.json());
    }

    return res.status(400).json({ error: 'Invalide' });
  } catch (error) {
    console.error('[api/search] Erreur serveur:', error);
    return res.status(500).json({ error: 'Erreur serveur', results: [] });
  }
}
