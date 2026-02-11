import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2, AlertCircle, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [mainArtist, setMainArtist] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  
  // État pour la modale de restriction
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const processGeneration = async () => {
        // --- LOGIQUE DE GÉNÉRATION (Identique à avant) ---
        // On récupère les sources
        const stateData = location.state;
        const pastRaw = localStorage.getItem('selected_concerts');
        const futureRaw = localStorage.getItem('selected_upcoming');

        let dataToUse: any[] = [];
        let type: 'festival' | 'past' | 'future' | null = null;
        let pName = "Ma Setlist";

        if (stateData?.artists) {
            type = 'festival';
            dataToUse = stateData.artists.map((a: string) => ({ artist: a, isFuture: true }));
            pName = stateData.eventName || "Festival Playlist";
            localStorage.removeItem('selected_concerts');
            localStorage.removeItem('selected_upcoming');
        } 
        else if (pastRaw && JSON.parse(pastRaw).length > 0) {
            type = 'past';
            const parsed = JSON.parse(pastRaw);
            dataToUse = parsed.map((c: any) => ({ ...c, isFuture: false }));
            pName = parsed.length > 1 ? "Mes Concerts (Passés)" : `${parsed[0].artist?.name || parsed[0].artist} Live`;
            localStorage.removeItem('selected_upcoming');
        } 
        else if (futureRaw && JSON.parse(futureRaw).length > 0) {
            type = 'future';
            const parsed = JSON.parse(futureRaw);
            dataToUse = parsed.map((c: any) => ({ ...c, isFuture: true }));
            pName = "Ma Sélection Future";
            localStorage.removeItem('selected_concerts');
        }

        if (!type || dataToUse.length === 0) {
            setErrorMsg("Aucune donnée disponible.");
            setLoading(false);
            return;
        }

        setPlaylistName(pName);
        setLoadingMessage(type === 'past' ? "Extraction de la setlist réelle..." : "Génération du Top 10...");
        
        const finalTracks: any[] = [];
        for (const item of dataToUse) {
            const currentArtist = item.artist?.name || item.artist || "Inconnu";
            if (item.isFuture) {
                const top = await fetchItunes(currentArtist, 10);
                top.forEach(t => finalTracks.push(t));
            } else {
                const tracks = extractFromSetlist(item, currentArtist);
                tracks.forEach(t => finalTracks.push(t));
            }
        }

        if (finalTracks.length === 0) {
            setErrorMsg("Aucune setlist trouvée.");
        } else {
            const unique = finalTracks.filter((v, i, a) => 
                a.findIndex(t => (t.name === v.name && t.artist === v.artist)) === i
            );
            setSongs(unique);
            setMainArtist(finalTracks[0].artist);
            
            // On sauvegarde dans l'historique SEULEMENT si connecté
            if (user) {
                saveToHistory(user.id, {
                    playlist_name: pName,
                    track_count: unique.length,
                    top_artists: [finalTracks[0].artist],
                    platform_target: 'universal'
                }).catch(() => {});
            }
        }
        
        // Vérification Premium
        if (user) {
            getUserSubscription(user.id).then(sub => setIsPremium(sub.subscription_type === 'premium'));
        }
        
        setLoading(false);
    };

    processGeneration();
  }, [user]); // On relance si l'user se connecte

  // --- HELPER FUNCTIONS (Identiques) ---
  const extractFromSetlist = (concert: any, defaultArtist: string) => {
    const result: any[] = [];
    if (concert.tracks && Array.isArray(concert.tracks)) return concert.tracks.filter((t: any) => t.name && t.name !== "Titre inconnu");
    if (concert.sets?.set) {
        const sets = Array.isArray(concert.sets.set) ? concert.sets.set : [concert.sets.set];
        sets.forEach((s: any) => {
            if (!s.song) return;
            const songs = Array.isArray(s.song) ? s.song : [s.song];
            songs.forEach((song: any) => {
                if (song.tape || !song.name || song.name.toLowerCase().includes('unknown')) return;
                result.push({ artist: song.cover ? song.cover.name : defaultArtist, name: song.name });
            });
        });
    }
    return result;
  };

  const fetchItunes = async (artist: string, limit: number) => {
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${limit}`);
        const data = await res.json();
        return data.results.map((item: any) => ({ artist: item.artistName, name: item.trackName }));
    } catch { return []; }
  };

  // --- LE GARDIEN (Nouveau !) ---
  const handleRestrictedAction = (action: () => void) => {
    if (!user) {
        // Si pas connecté -> Modale
        setShowAuthModal(true);
    } else {
        // Si connecté -> Action autorisée
        action();
    }
  };

  const handleCopy = () => {
    handleRestrictedAction(() => {
        const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Liste copiée dans le presse-papier !");
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCSV = () => {
    handleRestrictedAction(() => {
        const content = "Artist,Track\n" + songs.map(s => `"${s.artist}","${s.name}"`).join("\n");
        const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Setlive_${playlistName.replace(/[^a-z0-9]/gi, '_')}.csv`;
        link.click();
    });
  };

  // --- UI ---
  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
      <p className="text-[#a0a0a0] font-mono uppercase tracking-widest text-xs">{loadingMessage}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col font-sans">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-20">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-[#a0a0a0] hover:text-white pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>

        {errorMsg ? (
          <div className="bg-[#252525] border border-red-500/30 p-12 rounded-3xl text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black italic uppercase mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-8">{errorMsg}</p>
            <Button onClick={() => navigate('/')} className="bg-white text-black hover:bg-[#4d94ff] hover:text-white rounded-none px-8 font-black italic uppercase transition-all">
               Retour à l'accueil
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-8xl font-black italic uppercase mb-4 tracking-tighter leading-none">C'est prêt !</h1>
              <div className="inline-block bg-[#4d94ff] text-white px-6 py-2 text-xl font-black italic uppercase skew-x-[-12deg] shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
                {songs.length} TITRES
              </div>
              <p className="text-[#666] mt-6 font-bold uppercase tracking-widest text-sm">{playlistName}</p>
            </div>

            {/* MESSAGE NON CONNECTÉ (In-situ) */}
            {!user && (
                <div className="mb-8 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-xl flex items-center gap-4 text-yellow-200 text-sm">
                    <Lock className="w-5 h-5" />
                    <p>Connectez-vous pour récupérer votre playlist.</p>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* COPIER */}
              <div className={`bg-[#252525] border border-[#333] rounded-3xl p-10 flex flex-col justify-between shadow-xl transition-all ${!user ? 'opacity-75' : 'hover:border-[#4d94ff]'}`}>
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#00ff00] text-black w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic">1</span> Copier
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Copier la liste brute pour TuneMyMusic.
                  </p>
                </div>
                <Button onClick={handleCopy} className={`w-full h-24 text-2xl font-black italic uppercase transition-all rounded-none ${copied ? 'bg-[#00ff00] text-black' : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'} ${!user && 'cursor-not-allowed grayscale'}`}>
                  {user ? (copied ? 'Copié !' : 'Copier la liste') : <span className="flex items-center gap-2"><Lock size={20}/> Bloqué</span>}
                </Button>
              </div>

              {/* IMPORTER */}
              <div className={`bg-[#1a1a1a] border border-[#333] rounded-3xl p-10 flex flex-col justify-between shadow-xl transition-all ${!user ? 'opacity-75' : 'hover:border-white'}`}>
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#4d94ff] text-white w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic">2</span> Importer
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Coller sur TuneMyMusic (Source "Texte").
                  </p>
                </div>
                <div className="space-y-3">
                    <Button onClick={() => handleRestrictedAction(() => window.open("https://www.tunemymusic.com/fr/", "_blank"))} variant="outline" className={`w-full h-14 text-lg font-bold uppercase border-0 bg-white text-black hover:bg-[#4d94ff] hover:text-white ${!user && 'grayscale'}`}>
                        {user ? 'Ouvrir TuneMyMusic' : <span className="flex items-center gap-2"><Lock size={16}/> Ouvrir TuneMyMusic</span>}
                    </Button>
                    <Button onClick={handleCSV} variant="ghost" className="w-full text-xs text-[#666] hover:text-[#4d94ff] uppercase tracking-widest">
                        Ou télécharger CSV
                    </Button>
                </div>
              </div>
            </div>

            {/* PUB POUR LES NON PREMIUMS */}
            {!isPremium && user && mainArtist && (
              <div className="mt-20 pt-10 border-t border-[#333]">
                <p className="text-center text-[#444] text-[10px] uppercase font-bold tracking-widest mb-4">Publicité (Passer Premium pour masquer)</p>
                <SmartAd artistName={mainArtist} index={0} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALE DE BLOCAGE */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-[#252525] border-[#444] text-white sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase flex items-center gap-2">
                    <Lock className="text-[#4d94ff]" /> Accès Réservé
                </DialogTitle>
                <DialogDescription className="text-[#a0a0a0] text-lg pt-4">
                    Créez un compte <strong>gratuit</strong> pour copier votre playlist et la sauvegarder dans votre historique.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-3 sm:justify-center mt-6">
                <Button onClick={() => navigate('/auth')} className="w-full h-12 bg-[#00ff00] text-black font-bold uppercase hover:bg-[#33ff33]">
                    <UserPlus className="mr-2 h-5 w-5" /> Créer mon compte gratuit
                </Button>
                <Button onClick={() => navigate('/auth')} variant="ghost" className="w-full text-[#a0a0a0] hover:text-white">
                    J'ai déjà un compte
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
