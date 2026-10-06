// api/search.js — moteur Setlist.fm unifié (Vercel serverless)
// Actions :
//   ?q=…&type=all|artistName|tourName|cityName|venueName&p=1   → recherche de concerts (« Hellfest 2025 » : l'année filtre)
//   ?action=user&username=…                           → concerts d'un profil (pagination par lots)
//   ?action=songs&setlistId=…                         → détail d'une setlist
//   ?action=artists&q=…                               → autocomplétion d'artistes (mbid)
//   ?action=average&artist=…[&mbid=…][&year=…]        → setlist moyenne récente d'un artiste

const API = 'https://api.setlist.fm/rest/1.0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const norm = (s = '') =>
  String(s).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

function parseDate(d) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d || '');
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date(0);
}

// Sur setlist.fm, un festival n'existe pas sous son nom : ses concerts sont rangés par SCÈNE, dans la VILLE du festival
// (ex. Hellfest = « Mainstage 01 », « Valley Stage »… à Clisson). On relie donc les festivals connus à leur ville.
const FESTIVALS = {
  hellfest: ['Clisson', 'FR'], 'hellfest open air': ['Clisson', 'FR'],
  wacken: ['Wacken', 'DE'], 'wacken open air': ['Wacken', 'DE'],
  graspop: ['Dessel', 'BE'], 'graspop metal meeting': ['Dessel', 'BE'],
  download: ['Castle Donington', 'GB'], 'download festival': ['Castle Donington', 'GB'],
  'rock am ring': ['Nürburg', 'DE'],
  motocultor: ['Saint-Nolff', 'FR'],
  werchter: ['Werchter', 'BE'], 'rock werchter': ['Werchter', 'BE'],
  'rock en seine': ['Saint-Cloud', 'FR'],
};

// « Hellfest 2025 » → { term: 'Hellfest', year: '2025' } ; « 2025 » seul reste un terme
function parseQuery(raw) {
  const s = String(raw || '').trim();
  const m = /^(.*?)[\s,]*((?:19|20)\d{2})$/.exec(s);
  return m && m[1].trim() ? { term: m[1].trim(), year: m[2] } : { term: s, year: '' };
}

// Appel Setlist.fm avec reprise automatique sur 429 (rate limit)
async function sfm(path, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(API + path, {
      headers: { 'x-api-key': process.env.SETLIST_FM_API_KEY, Accept: 'application/json', 'Accept-Language': 'fr' },
    });
    if (res.status === 429 && attempt < retries) {
      await sleep(700 * 2 ** attempt);
      continue;
    }
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = new Error(`setlist.fm ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  return null;
}

function songsOf(setlist, artistName) {
  const out = [];
  for (const set of toArray(setlist?.sets?.set)) {
    for (const so of toArray(set.song)) {
      const name = (so?.name || '').trim();
      if (!name || so.tape || /unknown/i.test(name)) continue;
      // Reprise : auteur d'origine, sauf mentions génériques « [traditional] », « [unknown] »… → l'interprète
      const cover = String(so.cover?.name || '').trim();
      out.push({ name, artist: cover && !/^\[.*\]$/.test(cover) ? cover : artistName });
    }
  }
  return out;
}

async function resolveArtist(name, mbid) {
  if (mbid) return { mbid, name };
  const d = await sfm(`/search/artists?artistName=${encodeURIComponent(name)}&sort=relevance&p=1`);
  const list = toArray(d?.artist);
  if (!list.length) return null;
  const exact = list.find((a) => norm(a.name) === norm(name));
  const pick = exact || list[0];
  return { mbid: pick.mbid, name: pick.name };
}

// Setlist moyenne : titres présents dans ≥ 40 % des derniers concerts, classés par position moyenne
async function averageSetlist(name, mbidIn, year) {
  const artist = await resolveArtist(name, mbidIn);
  if (!artist) return { artist: name, mbid: null, basedOn: 0, songs: [] };

  let lists = [];
  for (let p = 1; p <= 3; p++) {
    const d = await sfm(`/artist/${artist.mbid}/setlists?p=${p}`);
    const batch = toArray(d?.setlist);
    if (!batch.length) break;
    for (const sl of batch) {
      const songs = songsOf(sl, artist.name);
      if (songs.length >= 6) lists.push({ year: (sl.eventDate || '').slice(-4), songs });
    }
    if (lists.length >= 40 || p * (d?.itemsPerPage || 20) >= (d?.total || 0)) break;
    await sleep(250);
  }
  if (year) {
    const inYear = lists.filter((l) => l.year === String(year));
    if (inYear.length >= 4) lists = inYear;
  }
  lists = lists.slice(0, 40);
  const n = lists.length;
  if (!n) return { artist: artist.name, mbid: artist.mbid, basedOn: 0, songs: [] };

  const stats = new Map();
  for (const { songs } of lists) {
    const seen = new Set();
    songs.forEach((s, i) => {
      const k = `${norm(s.name)}|${norm(s.artist)}`;
      if (seen.has(k)) return;
      seen.add(k);
      const st = stats.get(k) || { name: s.name, artist: s.artist, count: 0, pos: 0 };
      st.count += 1;
      st.pos += i / Math.max(1, songs.length - 1);
      stats.set(k, st);
    });
  }
  let arr = [...stats.values()].map((s) => ({ ...s, ratio: s.count / n, avgPos: s.pos / s.count }));
  let kept = arr.filter((s) => s.ratio >= 0.4);
  if (kept.length < 8) kept = [...arr].sort((a, b) => b.count - a.count).slice(0, 12);
  kept = kept.sort((a, b) => a.avgPos - b.avgPos).slice(0, 25);
  return {
    artist: artist.name,
    mbid: artist.mbid,
    basedOn: n,
    songs: kept.map((s) => ({ name: s.name, artist: s.artist, ratio: +s.ratio.toFixed(2) })),
  };
}

// Concerts d'un profil : page 1 puis le reste par lots de 4 en parallèle
async function attended(username) {
  const first = await sfm(`/user/${encodeURIComponent(username)}/attended?p=1`);
  if (!first) return null;
  const total = first.total || 0;
  const perPage = first.itemsPerPage || 20;
  const pages = Math.max(1, Math.ceil(total / perPage));
  let results = [...toArray(first.setlist)];
  let partial = false;
  for (let start = 2; start <= pages; start += 4) {
    const batch = [];
    for (let p = start; p < start + 4 && p <= pages; p++) batch.push(p);
    const got = await Promise.all(
      batch.map((p) =>
        sfm(`/user/${encodeURIComponent(username)}/attended?p=${p}`)
          .then((d) => toArray(d?.setlist))
          .catch(() => {
            partial = true;
            return [];
          })
      )
    );
    got.forEach((g) => (results = results.concat(g)));
    if (start + 4 <= pages) await sleep(250);
  }
  return { results, total, partial };
}

export default async function handler(req, res) {
  if (!process.env.SETLIST_FM_API_KEY) {
    return res.status(500).json({ error: 'SETLIST_FM_API_KEY manquante côté serveur', results: [] });
  }
  const { q, action, username, setlistId, artist, mbid, year, type, p } = req.query;

  try {
    // --- Recherche de concerts ---
    if (q && !action) {
      const page = Math.max(1, parseInt(p, 10) || 1);
      const searchType = ['artistName', 'cityName', 'tourName', 'venueName', 'all'].includes(type) ? type : 'all';
      const { term, year } = parseQuery(q);
      const fest = FESTIVALS[norm(term)];

      // Une recherche Setlist.fm ; « aucun résultat » (404) = liste vide ; seule une limite de débit remonte en erreur
      const run = async (params) => {
        const qs = new URLSearchParams({ ...params, ...(year ? { year } : {}), p: String(page) });
        try {
          const d = await sfm(`/search/setlists?${qs}`);
          return { list: toArray(d?.setlist), total: d?.total || 0, perPage: d?.itemsPerPage || 20 };
        } catch (e) {
          if (e.status === 429) throw e;
          return { list: [], total: 0, perPage: 20 };
        }
      };
      const festival = () => run({ cityName: fest[0], countryCode: fest[1] });

      let parts = [];
      if (searchType === 'all') {
        if (fest) parts = [await festival()];
        if (!parts.some((x) => x.list.length)) {
          // d'abord artiste et tournée ; si rien, salle/scène et ville (un festival tapé par sa ville, ex. « Clisson 2025 »)
          parts = await Promise.all([run({ artistName: term }), run({ tourName: term })]);
          if (!parts.some((x) => x.list.length)) parts = await Promise.all([run({ venueName: term }), run({ cityName: term })]);
        }
      } else if (searchType === 'cityName') {
        parts = [fest ? await festival() : await run({ cityName: term })];
      } else {
        parts = [await run({ [searchType]: term })];
      }

      const seen = new Set();
      const results = parts.flatMap((x) => x.list).filter((c) => (seen.has(c.id) ? false : seen.add(c.id)));
      results.sort((x, y) => parseDate(y.eventDate) - parseDate(x.eventDate));
      const total = Math.max(0, ...parts.map((x) => x.total));
      const perPage = parts[0]?.perPage || 20;
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({ results, total, itemsPerPage: perPage, page, hasMore: page * perPage < total, festival: fest ? { city: fest[0], country: fest[1], year: year || null } : null });
    }

    // --- Profil Setlist.fm ---
    if (action === 'user' && username) {
      const data = await attended(username);
      if (!data) return res.status(404).json({ error: 'Utilisateur introuvable', results: [] });
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json(data);
    }

    // --- Détail d'une setlist ---
    if (action === 'songs' && setlistId) {
      const d = await sfm(`/setlist/${encodeURIComponent(setlistId)}`);
      if (!d) return res.status(404).json({ error: 'Introuvable' });
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json(d);
    }

    // --- Autocomplétion artistes ---
    if (action === 'artists' && q) {
      const d = await sfm(`/search/artists?artistName=${encodeURIComponent(q)}&sort=relevance&p=1`);
      const artists = toArray(d?.artist)
        .slice(0, 8)
        .map((a) => ({ mbid: a.mbid, name: a.name, disambiguation: a.disambiguation || '' }));
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ artists });
    }

    // --- Setlist moyenne ---
    if (action === 'average' && artist) {
      const d = await averageSetlist(artist, mbid, year);
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json(d);
    }

    return res.status(400).json({ error: 'Requête invalide', results: [] });
  } catch (e) {
    const status = e.status === 429 ? 429 : 500;
    return res.status(status).json({ error: status === 429 ? 'Setlist.fm limite le débit, réessaie' : 'Erreur serveur', results: [] });
  }
}
