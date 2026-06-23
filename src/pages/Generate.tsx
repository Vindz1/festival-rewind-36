import { useEffect, useState } from 'react';
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

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [songs, setSongs] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [mainArtist, setMainArtist] = useState('');
  const [exported, setExported] = useState(false); // remplace l'ancien "copied"
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  const [quota, setQuota] = useState<ExportQuota>({
    canExport: false,
    remaining: 0,
    isPremium: false,
    renewalDate: '',
    used: 0,
  });

  useEffect(() => {
    processGeneration();
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

  const processGeneration = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const stateData = location.state;
      const mode = searchParams.get('mode');
      let dataToUse: ConcertData[] = [];
      let type: 'festival' | 'past' | 'future' | null = null;
      let pName = 'Ma Setlist';

      if (stateData?.artists && Array.isArray(stateData.artists)) {
        type = 'festival';
        dataToUse = stateData.artists.map((artistName: string) => ({
          artist: artistName,
          isFuture: true,
          id: artistName.toLowerCase().replace(/\s+/g, '-'),
        }));
        pName = stateData.eventName || 'Festival Playlist';
      } else if (localStorage.getItem('playlistData')) {
        const raw = localStorage.getItem('playlistData');
        if (raw) {
          const parsed = JSON.parse(raw);
          type = 'festival';
          dataToUse = parsed.songs.map((s: any) => ({ artist: s.artist, isFuture: true }));
          pName = parsed.playlistName || 'Ma Sélection';
        }
      } else if (mode === 'upcoming') {
        type = 'future';
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
        type = 'past';
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

      if (!type || dataToUse.length === 0)
        throw new Error('Aucun concert ou artiste sélectionné.');
      setPlaylistName(pName);

      const isFutureMode = type === 'festival' || type === 'future';
      setLoadingMessage(
        isFutureMode
          ? `Récupération du Top 10 pour ${dataToUse.length} artiste(s)...`
          : 'Extraction des setlists réelles...'
      );

      const finalTracks: Track[] = [];
      let processedCount = 0;
      const concertsWithoutSetlist: string[] = [];

      for (const item of dataToUse) {
        processedCount++;
        const currentArtist =
          typeof item.artist === 'string'
            ? item.artist
            : item.artist?.name || 'Artiste Inconnu';
        setLoadingMessage(`${processedCount}/${dataToUse.length} - ${currentArtist}...`);
        try {
          if (item.isFuture) {
            finalTracks.push(...(await fetchItunes(currentArtist, 10)));
          } else {
            const tracks = await extractFromSetlist(item, currentArtist);
            if (tracks.length > 0) finalTracks.push(...tracks);
            else concertsWithoutSetlist.push(currentArtist);
          }
        } catch (err) {
          console.error(`Erreur pour ${currentArtist}:`, err);
        }
      }

      const uniqueTracks = deduplicateTracks(finalTracks);
      if (uniqueTracks.length === 0) {
        throw new Error(
          isFutureMode
            ? 'Impossible de récupérer les morceaux.'
            : concertsWithoutSetlist.length > 0
            ? `Aucune setlist sur Setlist.fm pour : ${concertsWithoutSetlist.join(', ')}`
            : 'Aucune setlist trouvée.'
        );
      }
      if (!isFutureMode && concertsWithoutSetlist.length > 0) {
        toast.warning(
          `${concertsWithoutSetlist.length} concert(s) sans setlist : ${concertsWithoutSetlist.join(
            ', '
          )}`,
          { duration: 5000 }
        );
      }

      setSongs(uniqueTracks);
      setMainArtist(uniqueTracks[0].artist);

      if (user) {
        try {
          await saveToHistory({
            userId: user.id,
            playlistName: pName,
            tracks: uniqueTracks.map((t) => ({ artist: t.artist })),
            sourceType: isFutureMode ? 'upcoming' : 'concert',
            platform: 'csv',
          });
        } catch (err) {
          console.error('Erreur historique:', err);
        }
      }

      localStorage.removeItem('playlistData');
      localStorage.removeItem('selected_concerts');
      localStorage.removeItem('selected_upcoming');

      toast.success(`${uniqueTracks.length} morceaux prêts !`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      toast.error('Erreur de génération');
    } finally {
      setLoading(false);
    }
  };

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

  const fetchItunes = async (artist: string, limit: number = 10): Promise<Track[]> => {
    const countries = ['US', 'GB', 'FR'];
    let allTracks: Track[] = [];
    const normalizedSearchArtist = normalizeString(artist);

    for (const country of countries) {
      try {
        const response = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            artist
          )}&entity=song&limit=${Math.max(limit * 5, 50)}&country=${country}`
        );
        if (!response.ok) continue;

        const data = await response.json();
        if (!data.results?.length) continue;

        const newTracks = data.results
          .map((item: any) => {
            const n = normalizeString(item.artistName || '');
            const score =
              n === normalizedSearchArtist ? 100 : n.includes(normalizedSearchArtist) ? 50 : 0;
            return { ...item, score };
          })
          .filter((item: any) => item.score > 20)
          .sort((a: any, b: any) => b.score - a.score)
          .map((item: any) => ({ artist: item.artistName, name: item.trackName }));

        allTracks = [...allTracks, ...newTracks];
        const uniqueTracks = deduplicateTracks(allTracks);

        if (uniqueTracks.length >= limit) {
          return uniqueTracks.slice(0, limit);
        }
      } catch (err) {
        console.error(`Erreur iTunes (${country}) pour ${artist}:`, err);
      }
    }

    return deduplicateTracks(allTracks).slice(0, limit);
  };

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

  /**
   * Copie la liste dans le presse-papier. Action interne réutilisée par
   * les deux boutons (export TMM principal + copie seule secondaire).
   * Retourne true si la copie a réussi.
   */
  const copyTracksToClipboard = async (): Promise<boolean> => {
    try {
      const text = songs.map((s) => `${s.artist} - ${s.name}`).join('\n');
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard error:', err);
      return false;
    }
  };

  /**
   * Vérifie connexion + quota, puis incrémente le compteur d'exports.
   * Retourne true si l'export est autorisé.
   */
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

  /**
   * Action principale : copie la liste ET ouvre TuneMyMusic dans un nouvel onglet
   * en une seule action utilisateur. Affiche un toast explicite avec les 2
   * dernières étapes à faire côté TMM (cliquer "Texte" puis Ctrl+V).
   */
  const handleExportToTMM = async () => {
    const allowed = await guardAndTrackExport();
    if (!allowed) return;

    const ok = await copyTracksToClipboard();
    if (!ok) {
      toast.error('Erreur lors de la copie. Réessayez.');
      return;
    }

    // Important : window.open doit être appelé de manière synchrone après
    // l'écriture du presse-papier pour ne pas être bloqué par le navigateur.
    window.open(TMM_URL, '_blank', 'noopener,noreferrer');

    setExported(true);
    toast.success('Liste copiée et TuneMyMusic ouvert !', {
      duration: 6000,
      description: 'Sur TuneMyMusic : 1. Cliquez sur "Texte" — 2. Collez (Ctrl+V)',
    });
    setTimeout(() => setExported(false), 4000);
  };

  /**
   * Action secondaire : copie seule (sans ouvrir TMM), au cas où l'utilisateur
   * a déjà l'onglet ouvert ou veut coller la liste ailleurs.
   */
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
    const text = songs.map((s) => `${s.artist} - ${s.name}`).join('\n');
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

  // --- LOGIQUE DE PROTECTION DE LA LISTE ---
  const canViewFullList = !!user && quota.canExport;
  const visibleSongs = canViewFullList ? songs : songs.slice(0, 3);

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
            {/* TITRE */}
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

            {/* BADGE QUOTA */}
            <div className="mb-4 text-center">
              {!user ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs">
                  <Lock className="w-3 h-3 text-orange-400" />
                  <span className="text-orange-400 font-bold">Non connecté</span>
                  <span className="text-gray-400">•</span>
                  <button
                    onClick={() => navigate('/auth')}
                    className="text-blue-400 underline font-semibold"
                  >
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
                  <span
                    className={`font-bold ${
                      quota.remaining === 0 ? 'text-red-400' : 'text-blue-400'
                    }`}
                  >
                    {quota.remaining}/2 exports restants
                  </span>
                  {quota.remaining === 0 && (
                    <button
                      onClick={() => navigate('/subscription')}
                      className="text-yellow-500 underline font-semibold"
                    >
                      → Premium
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ====================================================== */}
            {/* CTA PRINCIPAL : EXPORT TMM EN 1 CLIC (mobile + desktop) */}
            {/* ====================================================== */}
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

            {/* ====================================================== */}
            {/* MODE D'EMPLOI VISUEL DES 2 ÉTAPES RESTANTES SUR TMM    */}
            {/* ====================================================== */}
            <div className="mb-8 bg-[#252525] border border-[#333] rounded-2xl p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-[#a0a0a0] font-bold uppercase tracking-wider mb-4 text-center">
                Une fois sur TuneMyMusic, plus que 2 étapes :
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 sm:p-5 flex flex-col items-center text-center">
                  <div className="bg-[#4d94ff] text-white w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-sm sm:text-base mb-2 sm:mb-3">
                    1
                  </div>
                  <div className="mb-2 sm:mb-3">
                    <Music className="w-6 h-6 sm:w-8 sm:h-8 text-[#4d94ff] mx-auto" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Cliquez sur{' '}
                    <span className="bg-[#4d94ff]/20 text-[#4d94ff] px-1.5 py-0.5 rounded">
                      Texte
                    </span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#666] mt-1 sm:mt-2">
                    comme source de la playlist
                  </p>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 sm:p-5 flex flex-col items-center text-center">
                  <div className="bg-[#00ff00] text-black w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-sm sm:text-base mb-2 sm:mb-3">
                    2
                  </div>
                  <div className="mb-2 sm:mb-3">
                    <ClipboardPaste className="w-6 h-6 sm:w-8 sm:h-8 text-[#00ff00] mx-auto" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Collez avec{' '}
                    <span className="bg-[#00ff00]/20 text-[#00ff00] px-1.5 py-0.5 rounded font-mono">
                      Ctrl+V
                    </span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#666] mt-1 sm:mt-2">
                    (ou ⌘+V sur Mac)
                  </p>
                </div>
              </div>

              <p className="text-center text-[10px] sm:text-xs text-[#666] mt-4 leading-relaxed">
                Choisissez ensuite votre plateforme (Spotify, Deezer, Apple Music, Qobuz…) et c'est fini.
              </p>
            </div>

            {/* ====================================================== */}
            {/* ACTIONS SECONDAIRES                                    */}
            {/* ====================================================== */}
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

            {/* ====================================================== */}
            {/* APERÇU DE LA LISTE                                     */}
            {/* ====================================================== */}
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
                      <p className="font-bold text-white truncate text-sm sm:text-base">{song.name}</p>
                      <p className="text-xs sm:text-sm text-[#a0a0a0] truncate">{song.artist}</p>
                    </div>
                  </div>
                ))}

                {/* EFFET DE MASQUAGE */}
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
                        onClick={() =>
                          !user ? navigate('/auth') : navigate('/subscription')
                        }
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
