// src/lib/engine.ts — moteur Setlive (front)
// Cascade de génération : setlist exacte → setlist moyenne → top titres iTunes
import { supabase } from '@/supabaseClient';

export type Source = 'exact' | 'average' | 'top';
export type Origin = 'past' | 'future' | 'festival';

export interface Track { artist: string; name: string; source: Source }

export interface StudioItem {
  uid: string;
  kind: 'concert' | 'artist';
  origin: Origin;
  artist: string;
  mbid?: string;
  setlistId?: string;
  sub?: string;
  eventDate?: string;
  sets?: any;
  songCount?: number;
}

export interface Profile {
  username: string;
  pastItems: StudioItem[];
  futureItems: StudioItem[];
  loading: boolean;
  loaded: boolean;
  partial: boolean;
}

export interface ItemReport { uid: string; label: string; source: Source | 'none'; count: number }

// ---------- utilitaires ----------
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const enc = encodeURIComponent;

export const norm = (s = '') =>
  s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

// clé de dédoublonnage des titres : ignore (Remastered), [Live], « - 2011 Remaster »…
const titleKey = (s: string) => norm(s.replace(/\(.*?\)|\[.*?\]/g, ' ').replace(/\s-\s.*$/, ' '));

export function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const k = `${norm(t.artist)}|${titleKey(t.name)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function parseDate(d?: string): Date | null {
  if (!d) return null;
  let m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

export function isFuture(d?: string): boolean {
  const dt = parseDate(d);
  if (!dt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dt >= today;
}

export function fmtDate(d?: string): string {
  const dt = parseDate(d);
  return dt ? dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

function cacheGet<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    return Date.now() - t > ttl ? null : (v as T);
  } catch { return null; }
}
function cacheSet(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch { /* quota plein : on ignore */ }
}

async function getJson(url: string): Promise<any> {
  const r = await fetch(url);
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
  return r.json();
}

// ---------- accès API ----------
export const searchConcerts = (q: string, type: string, page: number) =>
  getJson(`/api/search?q=${enc(q)}&type=${type}&p=${page}`);
export const searchArtists = (q: string) => getJson(`/api/search?action=artists&q=${enc(q)}`);
export const fetchSetlist = (id: string) => getJson(`/api/search?action=songs&setlistId=${enc(id)}`);

// ---------- normalisation des concerts (API Setlist.fm, scraping, Supabase) ----------
export function concertToItem(c: any, origin: Origin): StudioItem {
  const artist: string =
    c.artist?.name || (typeof c.artist === 'string' ? c.artist : '') || c.artist_name || c.artistName || 'Artiste inconnu';
  const venue: string = c.venue?.name || (typeof c.venue === 'string' ? c.venue : '') || c.venue_name || '';
  const city: string = c.venue?.city?.name || c.city || '';
  const eventDate: string = c.eventDate || c.event_date || c.date || '';
  const sets = c.sets;
  const songCount = (Array.isArray(sets?.set) ? sets.set : sets?.set ? [sets.set] : []).reduce(
    (n: number, s: any) => n + (Array.isArray(s.song) ? s.song.filter((x: any) => x?.name && !x.tape).length : 0), 0);
  const isSfmId = origin === 'past' && c.id && !String(c.id).includes('-');
  return {
    uid: `${origin}:${isSfmId ? c.id : norm(artist)}:${eventDate}`,
    kind: origin === 'past' ? 'concert' : 'artist',
    origin,
    artist,
    mbid: c.artist?.mbid || c.artist_mbid,
    setlistId: isSfmId ? String(c.id) : undefined,
    sub: [venue, city].filter(Boolean).join(' · '),
    eventDate,
    sets: origin === 'past' ? sets : undefined,
    songCount,
  };
}

export function artistItem(name: string, mbid?: string, eventDate?: string, origin: Origin = 'future'): StudioItem {
  return { uid: `${origin}:artist:${mbid || norm(name)}`, kind: 'artist', origin, artist: name, mbid, eventDate };
}

// Profil Setlist.fm : passés / à venir (API + page « upcoming » + concerts ajoutés dans Supabase)
export async function loadProfile(username: string, userId?: string): Promise<Pick<Profile, 'pastItems' | 'futureItems' | 'partial'>> {
  const data = await getJson(`/api/search?action=user&username=${enc(username)}`);
  const all: any[] = data.results || [];
  const pastItems = all.filter((c) => !isFuture(c.eventDate)).map((c) => concertToItem(c, 'past'));
  let futureRaw: any[] = all.filter((c) => isFuture(c.eventDate));

  // Complément « best effort » : si ça échoue, on n'affiche simplement rien de plus
  try {
    const d = await getJson(`/api/upcoming-shows?username=${enc(username)}`);
    futureRaw = futureRaw.concat(d.results || []);
  } catch { /* ignoré */ }
  if (userId) {
    try {
      const { data: sb } = await supabase.from('upcoming_concerts').select('*').eq('user_id', userId);
      if (sb) futureRaw = futureRaw.concat(sb);
    } catch { /* ignoré */ }
  }

  const byArtist = new Map<string, StudioItem>();
  futureRaw.map((c) => concertToItem(c, 'future')).forEach((it) => {
    const k = norm(it.artist);
    const prev = byArtist.get(k);
    if (!prev || (parseDate(it.eventDate)?.getTime() ?? Infinity) < (parseDate(prev.eventDate)?.getTime() ?? Infinity)) byArtist.set(k, it);
  });
  return { pastItems, futureItems: [...byArtist.values()], partial: !!data.partial };
}

// ---------- sources de morceaux ----------
function tracksFromSets(sets: any, artist: string) {
  const out: { artist: string; name: string }[] = [];
  const list = Array.isArray(sets?.set) ? sets.set : sets?.set ? [sets.set] : [];
  list.forEach((s: any) => {
    (Array.isArray(s.song) ? s.song : s.song ? [s.song] : []).forEach((so: any) => {
      const name = (so?.name || '').trim();
      if (!name || so.tape || /unknown/i.test(name)) return;
      out.push({ artist: so.cover?.name || artist, name });
    });
  });
  return out;
}

async function exactTracks(it: StudioItem): Promise<Track[]> {
  let sets = it.sets;
  if (!sets?.set && it.setlistId) {
    const d = await fetchSetlist(it.setlistId).catch(() => null);
    sets = d?.sets;
  }
  return tracksFromSets(sets, it.artist).map((t) => ({ ...t, source: 'exact' as const }));
}

async function averageTracks(it: StudioItem): Promise<Track[]> {
  const key = `sl_avg_v2:${it.mbid || norm(it.artist)}`;
  let data = cacheGet<any>(key, 30 * 24 * 3600 * 1000);
  if (!data) {
    data = await getJson(`/api/search?action=average&artist=${enc(it.artist)}${it.mbid ? `&mbid=${it.mbid}` : ''}`).catch(() => null);
    if (data?.songs?.length) cacheSet(key, data);
  }
  return (data?.songs || []).map((s: any) => ({ artist: s.artist || it.artist, name: s.name, source: 'average' as const }));
}

async function itunesFetch(artist: string, country: string): Promise<any[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${enc(artist)}&entity=song&limit=50&country=${country}`);
      if (r.status === 403 || r.status === 429) { await sleep(1200); continue; }
      if (!r.ok) return [];
      return (await r.json()).results || [];
    } catch { return []; }
  }
  return [];
}

async function topTracks(artist: string, limit: number): Promise<Track[]> {
  const wanted = norm(artist);
  const out: Track[] = [];
  for (const country of ['FR', 'US', 'GB']) {
    const results = await itunesFetch(artist, country);
    results.forEach((r: any) => {
      const n = norm(r.artistName || '');
      const ok = n === wanted || ` ${n} `.includes(` ${wanted} `);
      if (ok && r.trackName) out.push({ artist: r.artistName, name: r.trackName, source: 'top' });
    });
    if (dedupe(out).length >= limit) break;
  }
  return dedupe(out).slice(0, limit);
}

// ---------- génération ----------
export async function buildPlaylist(
  items: StudioItem[],
  opts: { topCount: number },
  onProgress?: (msg: string) => void
): Promise<{ tracks: Track[]; report: ItemReport[] }> {
  // Au-delà de 15 artistes sans setlist, on saute la setlist moyenne (trop d'appels Setlist.fm)
  const allowAverage = items.filter((i) => i.origin !== 'festival' && i.kind === 'artist').length <= 15;
  const results: Track[][] = new Array(items.length);
  const report: ItemReport[] = new Array(items.length);
  let next = 0;
  let done = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      const it = items[i];
      let tracks: Track[] = [];
      let source: Source | 'none' = 'none';
      try {
        if (it.kind === 'concert') {
          tracks = await exactTracks(it);
          if (tracks.length) source = 'exact';
        }
        if (!tracks.length && it.origin !== 'festival' && allowAverage) {
          tracks = await averageTracks(it);
          if (tracks.length) source = 'average';
        }
        if (!tracks.length) {
          tracks = await topTracks(it.artist, opts.topCount);
          if (tracks.length) source = 'top';
        }
      } catch { /* l'item sera signalé « aucun titre » */ }
      results[i] = tracks;
      report[i] = { uid: it.uid, label: it.artist, source, count: tracks.length };
      done += 1;
      onProgress?.(`${done}/${items.length} — ${it.artist}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, items.length) }, worker));
  return { tracks: dedupe(results.flat()), report };
}

// ---------- exports ----------
const label = (t: Track, live: boolean) => (live ? `${t.name} (Live)` : t.name);
export const toText = (tracks: Track[], live: boolean) => tracks.map((t) => `${t.artist} - ${label(t, live)}`).join('\n');
export const toCsv = (tracks: Track[], live: boolean) =>
  'Artist,Title\n' + tracks.map((t) => `"${t.artist.replace(/"/g, '""')}","${label(t, live).replace(/"/g, '""')}"`).join('\n');

export function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
