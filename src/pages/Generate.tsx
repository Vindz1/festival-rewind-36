import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Download,
  Copy,
  ExternalLink,
  Check,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Music,
  Lock,
  Crown,
  Zap,
  ClipboardPaste,
  Target,
  BarChart3,
  Disc,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';
import {
  getUserSubscription,
  checkExportQuota,
  trackExport,
  type ExportQuota,
} from '@/lib/subscription';

interface Track {
  artist: string;
  name: string;
  source?: 'exact' | 'average' | 'topTracks';
}

interface ConcertData {
  id?: string;
  artist: string | { name: string };
  venue?: string;
  eventDate?: string;
  isFuture?: boolean;
  sets?: any;
  tracks?: Track[];
}

const TMM_URL = 'https://www.tunemymusic.com/fr/transfer';

// Cache localStorage 30 jours pour les setlists moyennes (réduit les hits Setlist.fm)
const AVG_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const avgCacheKey = (artist: string, year: string | number | null) =>
  `setlive_avg_${artist.toLowerCase().replace(/\s+/g, '_')}_${year || 'all'}`;

// Bornes du slider
const MIN_TOP_TRACKS = 3;
const MAX_TOP_TRACKS = 10;
const DEFAULT_TOP_TRACKS = 5;

/**
 * Détecte si un morceau iTunes est une version live, en se basant sur :
 *   - le nom du morceau (signal le plus fiable : convention iTunes "(Live ...)")
 *   - le nom de l'album/collection (live, concert, unplugged...)
 *   - les patterns combinés année/tour ("Live 1985", "Tour 2018")
 * On ne se contente PAS de matcher un mot-clé isolé dans l'album, ça génère
 * trop de faux positifs sur les rééditions studio "Greatest Hits 2010" etc.
 */
const isLiveTrack = (trackName: string, collectionName: string): boolean => {
  const t = trackName || '';
  const c = collectionName || '';

  // Signal 1 : "(Live ...)" ou " - Live ..." dans le titre du morceau — très fiable
  if (/[(\[\-]\s*live\b/i.test(t)) return true;
  if (/\blive\s+(at|from|in|on)\b/i.test(t)) return true;

  // Signal 2 : mots-clés live dans le nom d'album
  if (/\b(unplugged|en concert|en direct|au zenith)\b/i.test(c)) return true;
  if (/\blive\b/i.test(c)) return true;
  if (/\bconcert\b/i.test(c) && !/concerto/i.test(c)) return true;

  // Signal 3 : patterns combinés année + tour/live dans l'album
  if (/\blive\s+(19|20)\d{2}\b/i.test(c)) return true;
  if (/\b(19|20)\d{2}\s+tour\b/i.test(c)) return true;
  if (/\btour\s+(19|20)\d{2}\b/i.test(c)) return true;

  return false;
};

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [songs, setSongs] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [mainArtist, setMainArtist] = useState('');
  const [exported, setExported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  // Slider top-tracks
  const [topTracksCount, setTopTracksCount] = useState<number>(DEFAULT_TOP_TRACKS);
  const lastUsedCountRef = useRef<number>(DEFAULT_TOP_TRACKS);
  const [countDirty, setCountDirty] = useState(false);

  // Cache des données source au premier appel — permet à "Régénérer" de fonctionner
  // sans relire localStorage (qui a été nettoyé en fin de première génération)
  const sourceContextRef = useRef<{
    dataToUse: ConcertData[];
    playlistName: string;
    runMode: 'past' | 'future' | 'pastFestival';
    festivalDate?: string;
    festivalCity?: string;
    festivalYear?: string;
  } | null>(null);

  // Préférence live à l'export (sauvegardée en localStorage)
  const [preferLive, setPreferLive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('setlive_prefer_live');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('setlive_prefer_live', String(preferLive));
    } catch {
      /* localStorage bloqué */
    }
  }, [preferLive]);

  // Stats des sources utilisées (pour afficher un récap)
  const [sourceStats, setSourceStats] = useState<{ exact: number; average: number; topTracks: number }>({
    exact: 0,
    average: 0,
    topTracks: 0,
  });

  const [quota, setQuota] = useState<ExportQuota>({
    canExport: false,
    remaining: 0,
    isPremium: false,
    renewalDate: '',
    used: 0,
  });

  useEffect(() => {
    // Toute nouvelle navigation (location.state change) doit repartir des sources,
    // pas du cache d'une précédente génération.
    sourceContextRef.current = null;
    processGeneration(DEFAULT_TOP_TRACKS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    if (user) {
      getUserSubscription(user.id)
        .then((sub) => setIsPremium(sub.subscription_type === 'premium'))
        .catch(() => setIsPremium(false));
      checkExportQuota(user.id).then((q) => setQuota(q)).catch(() => {});
    } else {
      setIsPremium(false);
    }
  }, [user]);

  // Helpers
  const normalizeString = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');

  const deduplicateTracks = (tracks: Track[]) => {
    const seen = new Set<string>();
    return tracks.filter((t) => {
      const key = `${normalizeString(t.artist)}|||${normalizeString(t.name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const extractYear = (dateStr?: string): string | null => {
    if (!dateStr) return null;
    const m = dateStr.match(/(\d{4})/);
    return m ? m[1] : null;
  };

  // ============================================================
  // PLAN A — extraction de la setlist exacte (déjà fournie par l'API)
  // ============================================================
  const extractFromSetlist = async (
    concert: ConcertData,
    defaultArtist: string
  ): Promise<Track[]> => {
    const result: Track[] = [];
    if (concert.tracks && Array.isArray(concert.tracks)) {
      return concert.tracks.filter(
        (t) =>
          t.name &&
          t.name.trim() !== '' &&
          !['titre inconnu', 'unknown'].includes(t.name.toLowerCase())
      );
    }
    if (concert.id && !concert.sets) {
      try {
        const response = await fetch(`/api/search?action=songs&setlistId=${concert.id}`);
        if (!response.ok) return [];
        const data = await response.json();
        if (data.sets?.set) concert.sets = data.sets;
        else return [];
      } catch {
        return [];
      }
    }
    if (concert.sets?.set) {
      const sets = Array.isArray(concert.sets.set) ? concert.sets.set : [concert.sets.set];
      sets.forEach((s: any) => {
        if (!s.song) return;
        const songs = Array.isArray(s.song) ? s.song : [s.song];
        songs.forEach((song: any) => {
          if (
            song.tape ||
            !song.name ||
            song.name.trim() === '' ||
            song.name.toLowerCase().includes('unknown')
          )
            return;
          result.push({ artist: song.cover?.name || defaultArtist, name: song.name.trim() });
        });
      });
    }
    return result;
  };

  // ============================================================
  // PLAN A (variante festival passé) — trouve la setlist à une date donnée
  // ============================================================
  const findSetlistAtDate = async (
    artistName: string,
    date: string, // format dd-MM-yyyy
    cityName?: string
  ): Promise<Track[]> => {
    try {
      const params = new URLSearchParams({ action: 'findSetlists', artistName, date });
      if (cityName) params.set('cityName', cityName);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      const setlists = data.results || [];
      for (const sl of setlists) {
        const tracks = await extractFromSetlist(sl, artistName);
        if (tracks.length > 0) return tracks;
      }
      return [];
    } catch (err) {
      console.error(`Erreur findSetlistAtDate(${artistName}, ${date}):`, err);
      return [];
    }
  };

  // ============================================================
  // PLAN B — setlist moyenne (avec cache localStorage 30j)
  // ============================================================
  const fetchAverageSetlist = async (
    artistName: string,
    year: string | null
  ): Promise<Track[]> => {
    const cacheKey = avgCacheKey(artistName, year);
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { tracks, ts } = JSON.parse(cached);
        if (Date.now() - ts < AVG_CACHE_TTL_MS && Array.isArray(tracks)) {
          return tracks;
        }
      }
    } catch {
      /* cache illisible, on continue */
    }

    try {
      const params = new URLSearchParams({ action: 'averageSetlist', artistName });
      if (year) params.set('year', year);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      const tracks: Track[] = data.tracks || [];
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ tracks, ts: Date.now() }));
      } catch {
        /* localStorage plein */
      }
      return tracks;
    } catch (err) {
      console.error(`Erreur fetchAverageSetlist(${artistName}, ${year}):`, err);
      return [];
    }
  };

  // ============================================================
  // PLAN C — top tracks iTunes avec priorité aux pistes live
  // Stratégie en 2 phases :
  //   Phase 1 : recherche dédiée "Artist live" — iTunes met les live en tête
  //   Phase 2 (fallback) : recherche générique "Artist" — pour les artistes
  //              qui n'ont pas (ou peu) de live sur iTunes
  // ============================================================
  const fetchTopTracks = async (artist: string, limit: number): Promise<Track[]> => {
    const countries = ['US', 'GB', 'FR'];
    const normalizedSearchArtist = normalizeString(artist);

    const itemArtistMatches = (item: any): boolean => {
      const n = normalizeString(item.artistName || '');
      return n === normalizedSearchArtist || n.includes(normalizedSearchArtist);
    };

    // ---------- PHASE 1 : recherche dédiée "Artist live" ----------
    const liveCandidates: any[] = [];
    for (const country of countries) {
      try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
          artist + ' live'
        )}&entity=song&limit=100&country=${country}`;
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        if (!data.results?.length) continue;

        // On garde uniquement les morceaux du bon artiste ET qui sont effectivement live
        const filtered = data.results.filter(
          (item: any) =>
            itemArtistMatches(item) && isLiveTrack(item.trackName, item.collectionName)
        );
        liveCandidates.push(...filtered);

        // Si on a déjà largement de quoi servir, on arrête de scanner les autres pays
        if (liveCandidates.length >= limit * 4) break;
      } catch (err) {
        console.error(`Erreur iTunes live (${country}) pour ${artist}:`, err);
      }
    }

    const dedupedLive = deduplicateTracks(
      liveCandidates.map((item: any) => ({
        artist: item.artistName,
        name: item.trackName,
      }))
    );

    if (dedupedLive.length >= limit) {
      console.log(
        `[fetchTopTracks] ${artist} : ${dedupedLive.length} live trouvés → on sert ${limit}`
      );
      return dedupedLive.slice(0, limit);
    }

    // ---------- PHASE 2 (fallback) : recherche générique "Artist" ----------
    console.log(
      `[fetchTopTracks] ${artist} : seulement ${dedupedLive.length} live trouvés, fallback studio`
    );

    const studioCandidates: any[] = [];
    for (const country of countries) {
      try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
          artist
        )}&entity=song&limit=100&country=${country}`;
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        if (!data.results?.length) continue;

        const filtered = data.results.filter((item: any) => itemArtistMatches(item));
        studioCandidates.push(...filtered);

        if (studioCandidates.length >= limit * 3) break;
      } catch (err) {
        console.error(`Erreur iTunes studio (${country}) pour ${artist}:`, err);
      }
    }

    // Re-tri : les live qu'on a trouvés en phase 1 restent prioritaires,
    // puis on complète avec du studio (ou live oublié) dans l'ordre iTunes
    const dedupedStudio = deduplicateTracks(
      studioCandidates.map((item: any) => ({
        artist: item.artistName,
        name: item.trackName,
      }))
    );

    const combined: Track[] = [];
    const seen = new Set<string>();
    const pushIfNew = (t: Track) => {
      const key = `${normalizeString(t.artist)}|||${normalizeString(t.name)}`;
      if (!seen.has(key) && combined.length < limit) {
        seen.add(key);
        combined.push(t);
      }
    };

    // 1. Les live trouvés en phase 1 d'abord
    dedupedLive.forEach(pushIfNew);
    // 2. Compléter avec du studio
    dedupedStudio.forEach(pushIfNew);

    return combined;
  };

  // ============================================================
  // MOTEUR PRINCIPAL — cascade Plan A → B → C par concert
  // ============================================================
  const getTracksForItem = async (
    item: ConcertData,
    currentArtist: string,
    opts: {
      mode: 'past' | 'future' | 'pastFestival';
      topTracksCount: number;
      festivalDate?: string;
      festivalCity?: string;
      festivalYear?: string;
    }
  ): Promise<{ tracks: Track[]; source: 'exact' | 'average' | 'topTracks' }> => {
    const { mode, topTracksCount: ttc, festivalDate, festivalCity, festivalYear } = opts;

    // Futur pur : top tracks
    if (mode === 'future') {
      const tt = await fetchTopTracks(currentArtist, ttc);
      return { tracks: tt, source: 'topTracks' };
    }

    // Festival passé : cherche setlist à la date du festival
    if (mode === 'pastFestival' && festivalDate) {
      const exact = await findSetlistAtDate(currentArtist, festivalDate, festivalCity);
      if (exact.length > 0) return { tracks: exact, source: 'exact' };

      const avg = await fetchAverageSetlist(currentArtist, festivalYear || null);
      if (avg.length > 0) return { tracks: avg, source: 'average' };

      const tt = await fetchTopTracks(currentArtist, ttc);
      return { tracks: tt, source: 'topTracks' };
    }

    // Passé classique
    const exact = await extractFromSetlist(item, currentArtist);
    if (exact.length > 0) return { tracks: exact, source: 'exact' };

    const year = extractYear(item.eventDate);
    const avg = await fetchAverageSetlist(currentArtist, year);
    if (avg.length > 0) return { tracks: avg, source: 'average' };

    const tt = await fetchTopTracks(currentArtist, ttc);
    return { tracks: tt, source: 'topTracks' };
  };

  // ============================================================
  // PROCESS — orchestre le tout
  // ============================================================
  const processGeneration = async (ttc: number) => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSourceStats({ exact: 0, average: 0, topTracks: 0 });

      let dataToUse: ConcertData[] = [];
      let pName = 'Ma Setlist';
      let runMode: 'past' | 'future' | 'pastFestival' = 'past';
      let festivalDate: string | undefined;
      let festivalCity: string | undefined;
      let festivalYear: string | undefined;

      // Si on a déjà parsé les sources lors d'une précédente génération,
      // on les réutilise directement (cas du clic "Régénérer" après changement de slider).
      if (sourceContextRef.current) {
        const ctx = sourceContextRef.current;
        dataToUse = ctx.dataToUse;
        pName = ctx.playlistName;
        runMode = ctx.runMode;
        festivalDate = ctx.festivalDate;
        festivalCity = ctx.festivalCity;
        festivalYear = ctx.festivalYear;
      } else {
        // Premier passage : on parse les sources (location.state ou localStorage)
        const stateData = location.state;
        const mode = searchParams.get('mode');

        if (stateData?.artists && Array.isArray(stateData.artists)) {
          // Cas festival — détection passé/futur via festivalEndDate si présent
          const endDateRaw = stateData.festivalEndDate || stateData.endDate;
          const endDate = endDateRaw ? new Date(endDateRaw) : null;
          const isPastFestival = endDate && !isNaN(endDate.getTime()) && endDate < new Date();

          runMode = isPastFestival ? 'pastFestival' : 'future';
          if (isPastFestival && endDate) {
            const startRaw = stateData.festivalStartDate || stateData.startDate || endDateRaw;
            const startDate = new Date(startRaw);
            const d = String(startDate.getDate()).padStart(2, '0');
            const m = String(startDate.getMonth() + 1).padStart(2, '0');
            const y = startDate.getFullYear();
            festivalDate = `${d}-${m}-${y}`;
            festivalYear = String(y);
            festivalCity = stateData.festivalCity || stateData.cityName;
            console.log(
              `[Generate] Festival passé détecté → mode pastFestival (date=${festivalDate}, ville=${festivalCity || 'n/a'})`
            );
          }

          dataToUse = stateData.artists.map((artistName: string) => ({
            artist: artistName,
            isFuture: runMode === 'future',
            id: artistName.toLowerCase().replace(/\s+/g, '-'),
          }));
          pName = stateData.eventName || 'Festival Playlist';
        } else if (localStorage.getItem('playlistData')) {
          const raw = localStorage.getItem('playlistData');
          if (raw) {
            const parsed = JSON.parse(raw);
            runMode = 'future';
            dataToUse = parsed.songs.map((s: any) => ({ artist: s.artist, isFuture: true }));
            pName = parsed.playlistName || 'Ma Sélection';
          }
        } else if (mode === 'upcoming') {
          runMode = 'future';
          const futureRaw = localStorage.getItem('selected_upcoming');
          if (futureRaw) {
            const parsed = JSON.parse(futureRaw);
            dataToUse = parsed.map((c: any) => ({
              ...c,
              artist: c.artist?.name || c.artist,
              isFuture: true,
            }));
            pName = parsed.length === 1 ? `${dataToUse[0].artist} - Warmup` : 'Ma Sélection Future';
          }
        } else {
          runMode = 'past';
          const pastRaw = localStorage.getItem('selected_concerts');
          if (pastRaw) {
            const parsed = JSON.parse(pastRaw);
            dataToUse = parsed.map((c: any) => ({
              ...c,
              artist: c.artist?.name || c.artist,
              isFuture: false,
            }));
            pName = parsed.length === 1 ? `${dataToUse[0].artist} Live` : 'Mes Concerts (Passés)';
          }
        }

        if (dataToUse.length === 0) throw new Error('Aucun concert ou artiste sélectionné.');

        // Mémorise le contexte pour les futures régénérations
        sourceContextRef.current = {
          dataToUse,
          playlistName: pName,
          runMode,
          festivalDate,
          festivalCity,
          festivalYear,
        };
      }

      setPlaylistName(pName);

      const messages: Record<string, string> = {
        past: 'Extraction des setlists réelles...',
        future: `Récupération des morceaux live pour ${dataToUse.length} artiste(s)...`,
        pastFestival: 'Recherche des setlists du festival...',
      };
      setLoadingMessage(messages[runMode]);

      const finalTracks: Track[] = [];
      const stats = { exact: 0, average: 0, topTracks: 0 };
      let processedCount = 0;

      for (const item of dataToUse) {
        processedCount++;
        const currentArtist =
          typeof item.artist === 'string'
            ? item.artist
            : item.artist?.name || 'Artiste Inconnu';
        setLoadingMessage(`${processedCount}/${dataToUse.length} - ${currentArtist}...`);

        try {
          const { tracks, source } = await getTracksForItem(item, currentArtist, {
            mode: runMode,
            topTracksCount: ttc,
            festivalDate,
            festivalCity,
            festivalYear,
          });

          tracks.forEach((t) => finalTracks.push({ ...t, source }));
          stats[source] += tracks.length;
        } catch (err) {
          console.error(`Erreur pour ${currentArtist}:`, err);
        }
      }

      const uniqueTracks = deduplicateTracks(finalTracks);
      if (uniqueTracks.length === 0) {
        throw new Error('Impossible de récupérer des morceaux pour ces artistes.');
      }

      setSongs(uniqueTracks);
      setSourceStats(stats);
      setMainArtist(uniqueTracks[0].artist);
      lastUsedCountRef.current = ttc;
      setCountDirty(false);

      if (user) {
        try {
          await saveToHistory({
            userId: user.id,
            playlistName: pName,
            tracks: uniqueTracks.map((t) => ({ artist: t.artist })),
            sourceType: runMode === 'past' ? 'concert' : 'upcoming',
            platform: 'csv',
          });
        } catch (err) {
          console.error('Erreur historique:', err);
        }
      }

      localStorage.removeItem('playlistData');
      localStorage.removeItem('selected_concerts');
      localStorage.removeItem('selected_upcoming');

      toast.success(`${uniqueTracks.length} morceaux prêts`, {
        description:
          stats.exact + stats.average > 0
            ? `🎯 ${stats.exact} exacts · 📊 ${stats.average} moyenne · 🎵 ${stats.topTracks} top tracks`
            : undefined,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      toast.error('Erreur de génération');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ACTIONS EXPORT
  // ============================================================

  /**
   * Formate une ligne d'export en ajoutant éventuellement un hint "(Live)"
   * pour biaiser TuneMyMusic/Spotify vers les versions live.
   * On ne double-tague pas les morceaux dont le nom contient déjà "live".
   */
  const formatTrackForExport = (track: Track): string => {
    const base = `${track.artist} - ${track.name}`;
    if (!preferLive) return base;
    // Détecte si "live" est déjà présent comme mot (évite le double tag sur
    // les morceaux issus du Plan C Phase 1 type "Enter Sandman (Live at FOO)")
    if (/\blive\b/i.test(track.name)) return base;
    return `${base} (Live)`;
  };

  const copyTracksToClipboard = async (): Promise<boolean> => {
    try {
      const text = songs.map(formatTrackForExport).join('\n');
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard error:', err);
      return false;
    }
  };

  const guardAndTrackExport = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Connectez-vous pour exporter');
      navigate('/auth');
      return false;
    }
    if (!quota.canExport) {
      toast.error(`Quota épuisé ! 2 exports/an en version gratuite.`, {
        duration: 5000,
        action: { label: 'Passer Premium', onClick: () => navigate('/subscription') },
      });
      return false;
    }
    const tracked = await trackExport(user.id, playlistName, songs.length);
    if (tracked) {
      setQuota((prev) => ({
        ...prev,
        remaining: Math.max(0, prev.remaining - 1),
        used: prev.used + 1,
      }));
    }
    return true;
  };

  const handleExportToTMM = async () => {
    const allowed = await guardAndTrackExport();
    if (!allowed) return;
    const ok = await copyTracksToClipboard();
    if (!ok) {
      toast.error('Erreur lors de la copie. Réessayez.');
      return;
    }
    window.open(TMM_URL, '_blank', 'noopener,noreferrer');
    setExported(true);
    toast.success('Liste copiée et TuneMyMusic ouvert !', {
      duration: 6000,
      description: 'Sur TuneMyMusic : 1. Cliquez sur "Texte" — 2. Collez (Ctrl+V)',
    });
    setTimeout(() => setExported(false), 4000);
  };

  const handleCopyOnly = async () => {
    const allowed = await guardAndTrackExport();
    if (!allowed) return;
    const ok = await copyTracksToClipboard();
    if (!ok) {
      toast.error('Erreur lors de la copie');
      return;
    }
    setExported(true);
    toast.success(
      quota.isPremium
        ? 'Liste copiée !'
        : `Liste copiée ! ${Math.max(0, quota.remaining - 1)} export(s) restant(s)`
    );
    setTimeout(() => setExported(false), 2000);
  };

  const handleDownload = () => {
    const text = songs.map(formatTrackForExport).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlistName.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Fichier téléchargé !');
  };

  const handleSliderChange = (val: number) => {
    setTopTracksCount(val);
    setCountDirty(val !== lastUsedCountRef.current);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
        <p className="text-[#a0a0a0] font-mono uppercase tracking-widest text-xs">
          {loadingMessage}
        </p>
      </div>
    );
  }

  const canViewFullList = !!user && quota.canExport;
  const visibleSongs = canViewFullList ? songs : songs.slice(0, 3);

  const SourceBadge = ({ source }: { source?: Track['source'] }) => {
    if (!source) return null;
    const config = {
      exact: { icon: Target, color: 'text-green-400 bg-green-500/10', label: 'Setlist exacte' },
      average: { icon: BarChart3, color: 'text-blue-400 bg-blue-500/10', label: 'Setlist moyenne' },
      topTracks: { icon: Disc, color: 'text-orange-400 bg-orange-500/10', label: 'Top tracks' },
    }[source];
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${config.color}`}
        title={config.label}
      >
        <Icon className="w-2.5 h-2.5" />
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-16 flex flex-col font-sans">
      <Header />

      <div className="flex-grow max-w-4xl mx-auto w-full px-3 sm:px-4 pb-16 sm:pb-20">
        {errorMsg ? (
          <div className="bg-[#252525] border border-red-500/30 p-8 rounded-3xl text-center shadow-2xl mt-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black italic uppercase mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-6 text-sm leading-relaxed">{errorMsg}</p>
            <Button
              onClick={() => navigate(-1)}
              className="bg-white text-black hover:bg-[#4d94ff] hover:text-white rounded-none px-6 font-black italic uppercase text-sm"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Retour
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="text-center pt-4 sm:pt-8 pb-3 sm:pb-6">
              <h1 className="text-3xl sm:text-5xl md:text-8xl font-black italic uppercase mb-2 tracking-tighter leading-none">
                C'est prêt !
              </h1>
              <div className="inline-block bg-[#4d94ff] text-white px-4 sm:px-6 py-1.5 sm:py-2 text-base sm:text-2xl font-black italic uppercase skew-x-[-12deg] shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                {songs.length} MORCEAUX
              </div>
              <p className="text-[#666] mt-2 font-bold uppercase tracking-widest text-xs truncate px-4">
                {playlistName}
              </p>
            </div>

            {/* STATS DES SOURCES UTILISÉES */}
            {(sourceStats.exact > 0 || sourceStats.average > 0 || sourceStats.topTracks > 0) && (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                {sourceStats.exact > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                    <Target className="w-3 h-3" /> {sourceStats.exact} setlist exacte
                  </span>
                )}
                {sourceStats.average > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    <BarChart3 className="w-3 h-3" /> {sourceStats.average} setlist moyenne
                  </span>
                )}
                {sourceStats.topTracks > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    <Disc className="w-3 h-3" /> {sourceStats.topTracks} top tracks live
                  </span>
                )}
              </div>
            )}

            {/* BADGE QUOTA */}
            <div className="mb-4 text-center">
              {!user ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs">
                  <Lock className="w-3 h-3 text-orange-400" />
                  <span className="text-orange-400 font-bold">Non connecté</span>
                  <span className="text-gray-400">•</span>
                  <button onClick={() => navigate('/auth')} className="text-blue-400 underline font-semibold">
                    Connexion
                  </button>
                </div>
              ) : quota.isPremium ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-xs">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span className="text-yellow-500 font-bold">Premium • Exports illimités</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs">
                  <span className={`font-bold ${quota.remaining === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {quota.remaining}/2 exports restants
                  </span>
                  {quota.remaining === 0 && (
                    <button onClick={() => navigate('/subscription')} className="text-yellow-500 underline font-semibold">
                      → Premium
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SLIDER TOP TRACKS — affiché si pertinent */}
            {(sourceStats.topTracks > 0 || sourceStats.average === 0) && (
              <div className="mb-6 bg-[#252525] border border-[#333] rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">
                    Top tracks par artiste (en repli)
                  </label>
                  <span className="text-lg font-black text-[#4d94ff] tabular-nums">
                    {topTracksCount}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_TOP_TRACKS}
                  max={MAX_TOP_TRACKS}
                  step={1}
                  value={topTracksCount}
                  onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                  className="w-full accent-[#4d94ff] h-2"
                />
                <div className="flex justify-between text-[10px] text-[#666] mt-1">
                  <span>{MIN_TOP_TRACKS}</span>
                  <span>{MAX_TOP_TRACKS}</span>
                </div>
                {countDirty && (
                  <Button
                    onClick={() => processGeneration(topTracksCount)}
                    className="w-full mt-3 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Régénérer avec {topTracksCount} morceaux/artiste
                  </Button>
                )}
              </div>
            )}

            {/* TOGGLE PRÉFÉRENCE LIVE */}
            <div className="mb-3 flex items-center justify-center">
              <label
                className="inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full bg-[#252525] border border-[#333] hover:border-[#4d94ff] transition-colors group"
                title={
                  preferLive
                    ? 'Le hint "(Live)" est ajouté à chaque morceau pour que Spotify/Deezer/Apple Music préfèrent la version live quand elle existe.'
                    : 'Export standard : Spotify/Deezer choisiront la version la plus écoutée (souvent studio).'
                }
              >
                <input
                  type="checkbox"
                  checked={preferLive}
                  onChange={(e) => setPreferLive(e.target.checked)}
                  className="accent-[#4d94ff] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-[#a0a0a0] group-hover:text-white transition-colors">
                  🎤 Préférer les versions live
                </span>
              </label>
            </div>

            {/* CTA PRINCIPAL : EXPORT TMM EN 1 CLIC */}
            <div className="mb-6 sm:mb-8">
              <Button
                onClick={handleExportToTMM}
                disabled={!canViewFullList}
                className={`w-full h-16 sm:h-24 text-base sm:text-2xl font-black italic uppercase rounded-2xl sm:rounded-none shadow-[6px_6px_0px_rgba(77,148,255,0.3)] sm:shadow-[8px_8px_0px_rgba(77,148,255,0.3)] transition-all gap-3 ${
                  exported
                    ? 'bg-[#00ff00] text-black'
                    : !canViewFullList
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black active:scale-[0.98]'
                }`}
              >
                {exported ? (
                  <>
                    <Check className="w-5 h-5 sm:w-7 sm:h-7" />
                    Copié & ouvert !
                  </>
                ) : !canViewFullList ? (
                  <>
                    <Lock className="w-5 h-5 sm:w-7 sm:h-7" />
                    Quota épuisé
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 sm:w-7 sm:h-7" />
                    Exporter vers TuneMyMusic
                  </>
                )}
              </Button>

              <p className="text-center text-[10px] sm:text-xs text-[#666] mt-2 font-mono uppercase tracking-wider">
                1 clic : copie la liste et ouvre TuneMyMusic
              </p>
            </div>

            {/* MODE D'EMPLOI VISUEL DES 2 ÉTAPES RESTANTES SUR TMM */}
            <div className="mb-8 bg-[#252525] border border-[#333] rounded-2xl p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-[#a0a0a0] font-bold uppercase tracking-wider mb-4 text-center">
                Une fois sur TuneMyMusic, plus que 2 étapes :
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 sm:p-5 flex flex-col items-center text-center">
                  <div className="bg-[#4d94ff] text-white w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-sm sm:text-base mb-2 sm:mb-3">
                    1
                  </div>
                  <Music className="w-6 h-6 sm:w-8 sm:h-8 text-[#4d94ff] mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Cliquez sur{' '}
                    <span className="bg-[#4d94ff]/20 text-[#4d94ff] px-1.5 py-0.5 rounded">Texte</span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#666] mt-1 sm:mt-2">
                    comme source de la playlist
                  </p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 sm:p-5 flex flex-col items-center text-center">
                  <div className="bg-[#00ff00] text-black w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-sm sm:text-base mb-2 sm:mb-3">
                    2
                  </div>
                  <ClipboardPaste className="w-6 h-6 sm:w-8 sm:h-8 text-[#00ff00] mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Collez avec{' '}
                    <span className="bg-[#00ff00]/20 text-[#00ff00] px-1.5 py-0.5 rounded font-mono">
                      Ctrl+V
                    </span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#666] mt-1 sm:mt-2">(ou ⌘+V sur Mac)</p>
                </div>
              </div>
              <p className="text-center text-[10px] sm:text-xs text-[#666] mt-4 leading-relaxed">
                Choisissez ensuite votre plateforme (Spotify, Deezer, Apple Music, Qobuz…) et c'est fini.
              </p>
            </div>

            {/* ACTIONS SECONDAIRES */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-8 justify-center">
              <Button
                onClick={handleCopyOnly}
                disabled={!canViewFullList}
                variant="outline"
                className="border-[#333] bg-[#252525] hover:bg-[#2d2d2d] text-[#a0a0a0] hover:text-white text-xs sm:text-sm gap-2"
              >
                <Copy className="w-4 h-4" />
                Copier seulement
              </Button>

              <a
                href={TMM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-[#333] bg-[#252525] hover:bg-[#2d2d2d] text-[#a0a0a0] hover:text-white text-xs sm:text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir TuneMyMusic
              </a>

              {isPremium ? (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="border-yellow-500/40 bg-[#252525] hover:bg-yellow-500/10 text-yellow-500 text-xs sm:text-sm gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger .txt
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/subscription')}
                  variant="outline"
                  className="border-yellow-500/20 bg-[#252525] hover:bg-yellow-500/10 text-yellow-500/60 hover:text-yellow-500 text-xs sm:text-sm gap-2"
                >
                  <Crown className="w-4 h-4" />
                  .txt (Premium)
                </Button>
              )}
            </div>

            {/* APERÇU DE LA LISTE avec badges */}
            <details className="bg-[#252525] border border-[#333] rounded-xl overflow-hidden mb-6" open>
              <summary className="cursor-pointer p-4 sm:p-6 font-black uppercase text-sm sm:text-lg hover:bg-[#2d2d2d] transition-colors flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Music className="w-4 h-4 sm:w-5 sm:h-5" /> Aperçu de la liste
                </span>
                <span className="text-[#666] text-xs sm:text-sm">{songs.length} titres</span>
              </summary>
              <div className="p-4 sm:p-6 pt-0 max-h-96 overflow-y-auto space-y-2 relative">
                {visibleSongs.map((song, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 sm:p-3 rounded bg-[#1a1a1a] hover:bg-[#2d2d2d] transition-colors"
                  >
                    <span className="text-[#666] font-mono text-xs sm:text-sm min-w-[2rem]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white truncate text-sm sm:text-base">{song.name}</p>
                        <SourceBadge source={song.source} />
                      </div>
                      <p className="text-xs sm:text-sm text-[#a0a0a0] truncate">{song.artist}</p>
                    </div>
                  </div>
                ))}

                {!canViewFullList && songs.length > 3 && (
                  <div className="relative mt-2 overflow-hidden rounded bg-[#1a1a1a] p-3 pointer-events-none select-none">
                    <div className="blur-[3px] opacity-40 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-[#666] font-mono text-sm min-w-[2rem]">04</span>
                        <div>
                          <p className="font-bold text-white">••••••••••••••</p>
                          <p className="text-sm text-[#a0a0a0]">••••••••</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-[#666] font-mono text-sm min-w-[2rem]">05</span>
                        <div>
                          <p className="font-bold text-white">••••••••</p>
                          <p className="text-sm text-[#a0a0a0]">••••••••••••</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#252525] via-[#252525]/80 to-[#252525]/20 pointer-events-auto">
                      <Button
                        onClick={() => (!user ? navigate('/auth') : navigate('/subscription'))}
                        className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold shadow-lg shadow-yellow-500/20"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Débloquer les {songs.length} titres
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </details>

            {!isPremium && mainArtist && (
              <div className="mt-10 sm:mt-20 pt-8 border-t border-[#333]">
                <SmartAd artistName={mainArtist} index={0} />
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
