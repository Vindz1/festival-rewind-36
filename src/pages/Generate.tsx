import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2, AlertCircle, Music, Trash2 } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [mainArtist, setMainArtist] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Chargement...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        // 1. CAPTURE IMMÉDIATE DES DONNÉES (Mémoire flash)
        const directState = location.state; 
        const storagePast = localStorage.getItem('selected_concerts');
        const storageUpcoming = localStorage.getItem('selected_upcoming');

        let dataToProcess = [];
        let currentMode = ""; // 'festival', 'past', ou 'upcoming'

        // Logique de priorité pour éviter les mélanges
        if (directState?.artists) {
            dataToProcess = directState.artists.map((a: string) => ({ artist: a, isFuture: true }));
            setPlaylistName(directState.eventName || "Festival Playlist");
            currentMode = "festival";
        } else if (storagePast && JSON.parse(storagePast).length > 0) {
            dataToProcess = JSON.parse(storagePast).map((c: any) => ({ ...c, isFuture: false }));
            setPlaylistName(dataToProcess.length > 1 ? "Mes Concerts" : "Ma Setlist");
            currentMode = "past";
        } else if (storageUpcoming && JSON.parse(storageUpcoming).length > 0) {
            dataToProcess = JSON.parse(storageUpcoming).map((c: any) => ({ ...c, isFuture: true }));
            setPlaylistName("Ma Sélection");
            currentMode = "upcoming";
        }

        if (dataToProcess.length === 0) {
            setErrorMsg("Aucune sélection détectée.");
            setLoading(false);
            return;
        }

        // 2. NETTOYAGE RÉSIDUEL (On vide l'autre mode pour la prochaine fois)
        if (currentMode === "festival" || currentMode === "upcoming") localStorage.removeItem('selected_concerts');
        if (currentMode === "past") localStorage.removeItem('selected_upcoming');

        // 3. EXTRACTION
        setLoadingMessage("Récupération des titres...");
        const allTracks: any[] = [];

        for (const item of dataToProcess) {
            const artistName = item.artist?.name || item.artist || "Inconnu";
            if (artistName === "Inconnu") continue;

            let found = false;

            // A. TENTATIVE SETLIST (Si Passé ou si données présentes)
            if (item.sets || item.tracks) {
                const extracted = extractTracks(item, artistName);
                if (extracted.length > 0) {
                    extracted.forEach(t => allTracks.push(t));
                    found = true;
                }
            }

            // B. FALLBACK ITUNES (Si Futur OU si Setlist vide pour ne pas avoir d'erreur)
            if (item.isFuture || !found) {
                const limit = item.isFuture ? 10 : 15;
                const top = await fetchItunes(artistName, limit);
                top.forEach(t => allTracks.push(t));
            }
        }

        // 4. VALIDATION FINALE
        if (allTracks.length === 0) {
            setErrorMsg("La setlist est indisponible. Vérifiez sur setlist.fm.");
        } else {
            const unique = allTracks.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.artist === v.artist)) === i);
            setSongs(unique);
            setMainArtist(allTracks[0].artist);
        }

        if (user) {
            getUserSubscription(user.id).then(sub => setIsPremium(sub.subscription_type === 'premium'));
        }
        setLoading(false);
    };

    loadData();
  }, []);

  // Helper d'extraction (Setlist.fm)
  const extractTracks = (data: any, artist: string) => {
    const res: any[] = [];
    // Si c'est déjà plat (tracks)
    if (data.tracks && Array.isArray(data.tracks)) {
        return data.tracks.filter((t: any) => t.name && t.name !== "Titre inconnu");
    }
    // Si c'est le format brut Sets
    if (data.sets?.set) {
        const sets = Array.isArray(data.sets.set) ? data.sets.set : [data.sets.set];
        sets.forEach((s: any) => {
            const songs = Array.isArray(s.song) ? s.song : [s.song];
            songs.forEach((song: any) => {
                if (!song.tape && song.name && !song.name.toLowerCase().includes('unknown')) {
                    res.push({ artist: song.cover ? song.cover.name : artist, name: song.name });
                }
            });
        });
    }
    return res;
  };

  const fetchItunes = async (artist: string, limit: number) => {
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${limit}`);
        const data = await res.json();
        return data.results.map((item: any) => ({ artist: item.artistName, name: item.trackName }));
    } catch { return []; }
  };

  const handleCopy = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
      <p className="text-[#a0a0a0] font-mono italic uppercase tracking-widest text-xs animate-pulse">{loadingMessage}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col font-sans">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-20">
        
        {errorMsg ? (
          <div className="bg-[#252525] border border-red-500/30 p-12 rounded-3xl text-center shadow-2xl animate-in fade-in zoom-in">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black italic uppercase mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-8 font-medium">{errorMsg}</p>
            <Button onClick={() => navigate(-1)} className="bg-white text-black hover:bg-[#4d94ff] hover:text-white rounded-none px-8 font-black italic uppercase transition-all">
               <ArrowLeft className="mr-2 w-4 h-4" /> Retour à la sélection
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-8xl font-black italic uppercase mb-4 tracking-tighter">C'est prêt !</h1>
              <div className="inline-block bg-[#4d94ff] text-white px-6 py-2 text-xl md:text-2xl font-black italic uppercase skew-x-[-12deg] shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
                {songs.length} TITRES EXTRAITS
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl group hover:border-[#4d94ff] transition-all relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Music size={120} />
                </div>
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#00ff00] text-black w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic shadow-lg">1</span> Copier
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed font-bold uppercase tracking-tight">
                    Récupérez la liste pour l'importer dans Spotify ou Deezer via <span className="text-white">TuneMyMusic</span>.
                  </p>
                </div>
                <Button onClick={handleCopy} className={`w-full h-24 text-2xl font-black italic uppercase transition-all rounded-none shadow-[8px_8px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-1 active:translate-y-1 ${copied ? 'bg-[#00ff00] text-black' : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'}`}>
                  {copied ? 'Copié !' : 'Copier la liste'}
                </Button>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl group hover:border-white transition-all relative overflow-hidden">
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#4d94ff] text-white w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic shadow-lg">2</span> Importer
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed font-bold uppercase tracking-tight">
                    Allez sur TuneMyMusic, choisissez <span className="text-white">"Texte"</span> comme source, et collez votre liste.
                  </p>
                </div>
                <a href="https://www.tunemymusic.com/fr/" target="_blank" rel="noreferrer" className="block w-full text-center py-8 bg-white text-black font-black italic uppercase transition-all hover:bg-[#4d94ff] hover:text-white text-xl shadow-[8px_8px_0px_rgba(77,148,255,0.2)] active:shadow-none">
                  Ouvrir TuneMyMusic
                </a>
              </div>
            </div>

            {!isPremium && mainArtist && (
              <div className="mt-20 pt-10 border-t border-[#333]">
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
