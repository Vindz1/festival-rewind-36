import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2, AlertCircle, Music, Lock, Crown } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription, checkExportQuota, trackExport, type ExportQuota } from '@/lib/subscription';

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

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [mainArtist, setMainArtist] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  
  const [quota, setQuota] = useState<ExportQuota>({
    canExport: false,
    remaining: 0,
    isPremium: false,
    renewalDate: '',
    used: 0
  });

  useEffect(() => { processGeneration(); }, [location.state]);

  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then(sub => {
        setIsPremium(sub.subscription_type === 'premium');
      }).catch(() => setIsPremium(false));
      checkExportQuota(user.id).then(q => setQuota(q)).catch(() => {});
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
      let pName = "Ma Setlist";

      // 1. Essai de récupération via location.state (Ancien système)
      if (stateData?.artists && Array.isArray(stateData.artists)) {
        type = 'festival';
        dataToUse = stateData.artists.map((artistName: string) => ({ artist: artistName, isFuture: true, id: artistName.toLowerCase().replace(/\s+/g, '-') }));
        pName = stateData.eventName || "Festival Playlist";
      } 
      // 2. NOUVEAU SYSTÈME : Les festivals (Hellfest, Plane'R Fest, etc.)
      else if (localStorage.getItem('playlistData')) {
        const raw = localStorage.getItem('playlistData');
        if (raw) {
          const parsed = JSON.parse(raw);
          type = 'festival';
          // On s'assure que les données sont bien transformées pour iTunes
          dataToUse = parsed.songs.map((s: any) => ({ artist: s.artist, isFuture: true }));
          pName = parsed.playlistName || "Ma Sélection";
        }
      }
      // 3. Les concerts futurs
      else if (mode === 'upcoming') {
        type = 'future';
        const futureRaw = localStorage.getItem('selected_upcoming');
        if (futureRaw) {
          const parsed = JSON.parse(futureRaw);
          dataToUse = parsed.map((c: any) => ({ ...c, artist: c.artist?.name || c.artist, isFuture: true }));
          pName = parsed.length === 1 ? `${dataToUse[0].artist} - Warmup` : "Ma Sélection Future";
        }
      } 
      // 4. Les concerts passés (Setlist.fm)
      else {
        type = 'past';
        const pastRaw = localStorage.getItem('selected_concerts');
        if (pastRaw) {
          const parsed = JSON.parse(pastRaw);
          dataToUse = parsed.map((c: any) => ({ ...c, artist: c.artist?.name || c.artist, isFuture: false }));
          pName = parsed.length === 1 ? `${dataToUse[0].artist} Live` : "Mes Concerts (Passés)";
        }
      }

      if (!type || dataToUse.length === 0) throw new Error("Aucun concert ou artiste sélectionné.");
      setPlaylistName(pName);

      const isFutureMode = type === 'festival' || type === 'future';
      setLoadingMessage(isFutureMode ? `Récupération du Top 10 pour ${dataToUse.length} artiste(s)...` : "Extraction des setlists réelles...");

      const finalTracks: Track[] = [];
      let processedCount = 0;
      const concertsWithoutSetlist: string[] = [];

      for (const item of dataToUse) {
        processedCount++;
        const currentArtist = typeof item.artist === 'string' ? item.artist : item.artist?.name || "Artiste Inconnu";
        setLoadingMessage(`${processedCount}/${dataToUse.length} - ${currentArtist}...`);
        try {
          if (item.isFuture) {
            finalTracks.push(...await fetchItunes(currentArtist, 10));
          } else {
            const tracks = await extractFromSetlist(item, currentArtist);
            if (tracks.length > 0) finalTracks.push(...tracks);
            else concertsWithoutSetlist.push(currentArtist);
          }
        } catch (err) { console.error(`Erreur pour ${currentArtist}:`, err); }
      }

      const uniqueTracks = deduplicateTracks(finalTracks);
      if (uniqueTracks.length === 0) {
        throw new Error(isFutureMode
          ? "Impossible de récupérer les morceaux."
          : concertsWithoutSetlist.length > 0
            ? `Aucune setlist sur Setlist.fm pour : ${concertsWithoutSetlist.join(', ')}`
            : "Aucune setlist trouvée.");
      }
      if (!isFutureMode && concertsWithoutSetlist.length > 0) {
        toast.warning(`${concertsWithoutSetlist.length} concert(s) sans setlist : ${concertsWithoutSetlist.join(', ')}`, { duration: 5000 });
      }

      setSongs(uniqueTracks);
      setMainArtist(uniqueTracks[0].artist);

      if (user) {
        try {
          await saveToHistory({ userId: user.id, playlistName: pName, tracks: uniqueTracks.map(t => ({ artist: t.artist })), sourceType: isFutureMode ? 'upcoming' : 'concert', platform: 'csv' });
        } catch (err) { console.error('Erreur historique:', err); }
      }

      // Nettoyage de tous les tiroirs possibles une fois terminé !
      localStorage.removeItem('playlistData');
      localStorage.removeItem('selected_concerts'); 
      localStorage.removeItem('selected_upcoming');

      toast.success(`${uniqueTracks.length} morceaux prêts !`);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue.");
      toast.error('Erreur de génération');
    } finally {
      setLoading(false);
    }
  };

  const extractFromSetlist = async (concert: ConcertData, defaultArtist: string): Promise<Track[]> => {
    const result: Track[] = [];
    if (concert.tracks && Array.isArray(concert.tracks)) {
      return concert.tracks.filter(t => t.name && t.name.trim() !== '' && !['titre inconnu', 'unknown'].includes(t.name.toLowerCase()));
    }
    if (concert.id && !concert.sets) {
      try {
        const response = await fetch(`/api/search?action=songs&setlistId=${concert.id}`);
        if (!response.ok) return [];
        const data = await response.json();
        if (data.sets?.set) concert.sets = data.sets;
        else return [];
      } catch { return []; }
    }
    if (concert.sets?.set) {
      const sets = Array.isArray(concert.sets.set) ? concert.sets.set : [concert.sets.set];
      sets.forEach((s: any) => {
        if (!s.song) return;
        const songs = Array.isArray(s.song) ? s.song : [s.song];
        songs.forEach((song: any) => {
          if (song.tape || !song.name || song.name.trim() === '' || song.name.toLowerCase().includes('unknown')) return;
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
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${Math.max(limit * 5, 50)}&country=${country}`);
        if (!response.ok) continue; 
        
        const data = await response.json();
        if (!data.results?.length) continue;

        const newTracks = data.results
          .map((item: any) => {
            const n = normalizeString(item.artistName || ''); 
            const score = n === normalizedSearchArtist ? 100 : n.includes(normalizedSearchArtist) ? 50 : 0;
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

  const normalizeString = (str: string) => str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

  const deduplicateTracks = (tracks: Track[]) => {
    const seen = new Set<string>();
    return tracks.filter(t => {
      const key = `${normalizeString(t.artist)}|||${normalizeString(t.name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleCopy = async () => {
    if (!user) { toast.error('Connectez-vous pour exporter'); navigate('/auth'); return; }
    if (!quota.canExport) {
      toast.error(`Quota épuisé ! 2 exports/an en version gratuite.`, { duration: 5000, action: { label: 'Passer Premium', onClick: () => navigate('/subscription') } });
      return;
    }
    try {
      await navigator.clipboard.writeText(songs.map(s => `${s.artist} - ${s.name}`).join('\n'));
      setCopied(true);
      const tracked = await trackExport(user.id, playlistName, songs.length);
      if (tracked) {
        setQuota(prev => ({ ...prev, remaining: Math.max(0, prev.remaining - 1), used: prev.used + 1 }));
        toast.success(quota.isPremium ? 'Liste copiée !' : `Liste copiée ! ${quota.remaining - 1} export(s) restant(s)`, { duration: 4000 });
      } else {
        toast.success('Liste copiée !');
      }
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Erreur lors de la copie'); }
  };

  const handleDownload = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlistName.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Fichier téléchargé !");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
        <p className="text-[#a0a0a0] font-mono uppercase tracking-widest text-xs">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-16 flex flex-col font-sans">
      <Header />

      <div className="flex-grow max-w-4xl mx-auto w-full px-3 sm:px-4 pb-16 sm:pb-20">
        {errorMsg ? (
          <div className="bg-[#252525] border border-red-500/30 p-8 rounded-3xl text-center shadow-2xl mt-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black italic uppercase mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-6 text-sm leading-relaxed">{errorMsg}</p>
            <Button onClick={() => navigate(-1)} className="bg-white text-black hover:bg-[#4d94ff] hover:text-white rounded-none px-6 font-black italic uppercase text-sm">
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

            <div className="mb-4 text-center">
              {!user ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs">
                  <Lock className="w-3 h-3 text-orange-400" />
                  <span className="text-orange-400 font-bold">Non connecté</span>
                  <span className="text-gray-400">•</span>
                  <button onClick={() => navigate('/auth')} className="text-blue-400 underline font-semibold">Connexion</button>
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
                    <button onClick={() => navigate('/subscription')} className="text-yellow-500 underline font-semibold">→ Premium</button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:hidden gap-3 mb-4">
              
              <button
                onClick={handleCopy}
                disabled={!!user && !quota.canExport}
                className={`w-full h-14 flex items-center justify-center gap-3 font-black italic uppercase text-base rounded-xl transition-all shadow-md ${
                  copied ? 'bg-[#00ff00] text-black'
                  : user && !quota.canExport ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-[#4d94ff] text-white active:scale-95'
                }`}
              >
                {copied ? <><Check className="w-5 h-5" /> Copié !</>
                : user && !quota.canExport ? <><Lock className="w-5 h-5" /> Quota épuisé</>
                : <><Copy className="w-5 h-5" /> 1. Copier la liste</>}
              </button>

              <a
                href="https://www.tunemymusic.com/fr/transfer"
                target="_blank"
                rel="noreferrer"
                className="w-full h-14 flex items-center justify-center gap-3 bg-white text-black font-black italic uppercase text-base rounded-xl active:scale-95 shadow-md"
              >
                <ExternalLink className="w-5 h-5" /> 2. Ouvrir TuneMyMusic
              </a>

              <div className="flex gap-2">
                <details className="flex-1 bg-[#252525] border border-[#333] rounded-xl overflow-hidden">
                  <summary className="cursor-pointer px-4 py-3 font-bold uppercase text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2"><Music className="w-4 h-4" /> Liste</span>
                    <span className="text-[#666] text-xs">{songs.length}</span>
                  </summary>
                  <div className="p-3 max-h-52 overflow-y-auto space-y-1.5">
                    {songs.map((song, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-[#1a1a1a]">
                        <span className="text-[#666] font-mono text-xs min-w-[1.5rem]">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate text-xs">{song.name}</p>
                          <p className="text-[10px] text-[#a0a0a0] truncate">{song.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>

                {isPremium ? (
                  <button onClick={handleDownload} className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-[#252525] border border-yellow-500/40 hover:border-yellow-500 rounded-xl transition-all">
                    <Download className="w-5 h-5 text-yellow-500" />
                    <span className="text-[10px] text-yellow-500 font-bold">.txt</span>
                  </button>
                ) : (
                  <button onClick={() => navigate('/subscription')} className="flex flex-col items-center justify-center gap-1 px-4 py-3 bg-[#252525] border border-[#333] hover:border-yellow-500/30 rounded-xl transition-all" title="Premium uniquement">
                    <Crown className="w-4 h-4 text-yellow-500/40" />
                    <span className="text-[10px] text-yellow-500/40 font-bold">.txt</span>
                    <Lock className="w-3 h-3 text-yellow-500/40" />
                  </button>
                )}
              </div>
            </div>

            <div className="hidden sm:grid md:grid-cols-2 gap-8 mb-10">
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-8 md:p-10 flex flex-col justify-between shadow-xl hover:border-[#4d94ff] transition-all">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#00ff00] text-black w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base not-italic">1</span>
                    Copier
                  </h3>
                  <p className="text-[#a0a0a0] mb-6 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Copiez la liste pour l'importer via TuneMyMusic.
                  </p>
                </div>
                <Button
                  onClick={handleCopy}
                  disabled={!!user && !quota.canExport}
                  className={`w-full h-20 md:h-24 text-xl md:text-2xl font-black italic uppercase rounded-none shadow-[8px_8px_0px_rgba(0,0,0,0.3)] transition-all ${
                    copied ? 'bg-[#00ff00] text-black'
                    : user && !quota.canExport ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'
                  }`}
                >
                  {copied ? <><Check className="mr-2 w-6 h-6" /> Copié !</>
                  : user && !quota.canExport ? <><Lock className="mr-2 w-6 h-6" /> Quota épuisé</>
                  : <><Copy className="mr-2 w-6 h-6" /> Copier</>}
                </Button>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 md:p-10 flex flex-col justify-between shadow-xl hover:border-white transition-all">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#4d94ff] text-white w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base not-italic">2</span>
                    Importer
                  </h3>
                  <p className="text-[#a0a0a0] mb-6 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Sur TuneMyMusic, choisissez "Texte" et collez.
                  </p>
                </div>
                <a
                  href="https://www.tunemymusic.com/fr/transfer"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-7 md:py-8 bg-white text-black font-black italic uppercase hover:bg-[#4d94ff] hover:text-white text-lg md:text-xl transition-all shadow-[8px_8px_0px_rgba(77,148,255,0.2)]"
                >
                  TuneMyMusic <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="hidden sm:block">
              <details className="bg-[#252525] border border-[#333] rounded-xl overflow-hidden mb-6">
                <summary className="cursor-pointer p-6 font-black uppercase text-lg hover:bg-[#2d2d2d] transition-colors flex items-center justify-between">
                  <span className="flex items-center gap-2"><Music className="w-5 h-5" /> Liste complète</span>
                  <span className="text-[#666] text-sm">{songs.length} titres</span>
                </summary>
                <div className="p-6 pt-0 max-h-96 overflow-y-auto space-y-2">
                  {songs.map((song, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded bg-[#1a1a1a] hover:bg-[#2d2d2d] transition-colors">
                      <span className="text-[#666] font-mono text-sm min-w-[2rem]">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{song.name}</p>
                        <p className="text-sm text-[#a0a0a0] truncate">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <div className="text-center">
                {isPremium ? (
                  <Button onClick={handleDownload} variant="outline" className="border-[#333] text-white hover:bg-[#2d2d2d]">
                    <Download className="mr-2 w-4 h-4" /> Télécharger (.txt)
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/subscription')} variant="outline" className="border-yellow-500/30 text-yellow-500/60 hover:bg-yellow-500/10 hover:text-yellow-500 gap-2">
                    <Crown className="w-4 h-4" /> Télécharger (.txt) — Premium uniquement
                  </Button>
                )}
              </div>
            </div>

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
