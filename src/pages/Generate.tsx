import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2, AlertCircle, Music } from 'lucide-react';
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
  const [loadingMessage, setLoadingMessage] = useState('Analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const processGeneration = async () => {
        // --- 1. CAPTURE DES SOURCES (Avant toute suppression) ---
        const stateData = location.state;
        const pastRaw = localStorage.getItem('selected_concerts');
        const futureRaw = localStorage.getItem('selected_upcoming');

        let dataToUse: any[] = [];
        let type: 'festival' | 'past' | 'future' | null = null;
        let pName = "Ma Setlist";

        // --- 2. LOGIQUE DE PRIORITÉ ET NETTOYAGE ---
        if (stateData?.artists) {
            // MODE HELLFEST / DIRECT
            type = 'festival';
            dataToUse = stateData.artists.map((a: string) => ({ artist: a, isFuture: true }));
            pName = stateData.eventName || "Hellfest 2026";
            // On nettoie le reste pour éviter la pollution
            localStorage.removeItem('selected_concerts');
            localStorage.removeItem('selected_upcoming');
        } 
        else if (pastRaw && JSON.parse(pastRaw).length > 0) {
            // MODE PASSÉ
            type = 'past';
            const parsed = JSON.parse(pastRaw);
            dataToUse = parsed.map((c: any) => ({ ...c, isFuture: false }));
            pName = parsed.length > 1 ? "Mes Concerts (Passés)" : `${parsed[0].artist?.name || parsed[0].artist} Live`;
            localStorage.removeItem('selected_upcoming');
        } 
        else if (futureRaw && JSON.parse(futureRaw).length > 0) {
            // MODE FUTUR (I'm going)
            type = 'future';
            const parsed = JSON.parse(futureRaw);
            dataToUse = parsed.map((c: any) => ({ ...c, isFuture: true }));
            pName = "Ma Sélection Future";
            localStorage.removeItem('selected_concerts');
        }

        if (!type || dataToUse.length === 0) {
            setErrorMsg("Aucun concert ou artiste sélectionné.");
            setLoading(false);
            return;
        }

        setPlaylistName(pName);

        // --- 3. EXTRACTION DES MORCEAUX ---
        setLoadingMessage(type === 'past' ? "Extraction de la setlist réelle..." : "Génération du Top 10...");
        const finalTracks: any[] = [];

        for (const item of dataToUse) {
            const currentArtist = item.artist?.name || item.artist || "Artiste Inconnu";
            
            if (item.isFuture) {
                // FUTUR : Top 10 iTunes
                const top = await fetchItunes(currentArtist, 10);
                top.forEach(t => finalTracks.push(t));
            } else {
                // PASSÉ : Strictement Setlist.fm
                const tracks = extractFromSetlist(item, currentArtist);
                tracks.forEach(t => finalTracks.push(t));
            }
        }

        // --- 4. AFFICHAGE ---
        if (finalTracks.length === 0) {
            setErrorMsg(type === 'past' 
                ? "La setlist n'a pas été renseignée sur Setlist.fm pour ce concert." 
                : "Impossible de récupérer les titres pour cette sélection."
            );
        } else {
            // Dédoublonnage simple (Nom + Artiste)
            const unique = finalTracks.filter((v, i, a) => 
                a.findIndex(t => (t.name === v.name && t.artist === v.artist)) === i
            );
            setSongs(unique);
            setMainArtist(finalTracks[0].artist);
        }

        if (user) {
            getUserSubscription(user.id).then(sub => setIsPremium(sub.subscription_type === 'premium'));
        }
        setLoading(false);
    };

    processGeneration();
  }, []); // Exécution unique au montage

  // Moteur d'extraction Setlist.fm (Le plus robuste possible)
  const extractFromSetlist = (concert: any, defaultArtist: string) => {
    const result: any[] = [];
    
    // Cas 1 : Déjà formaté par le site
    if (concert.tracks && Array.isArray(concert.tracks)) {
        return concert.tracks.filter((t: any) => t.name && t.name !== "Titre inconnu");
    }

    // Cas 2 : Données brutes de l'API (sets.set.song)
    if (concert.sets?.set) {
        const sets = Array.isArray(concert.sets.set) ? concert.sets.set : [concert.sets.set];
        sets.forEach((s: any) => {
            if (!s.song) return;
            const songs = Array.isArray(s.song) ? s.song : [s.song];
            songs.forEach((song: any) => {
                // On exclut les bandes son (tape) et les inconnus
                if (song.tape || !song.name || song.name.toLowerCase().includes('unknown')) return;
                
                result.push({
                    artist: song.cover ? song.cover.name : defaultArtist, // On gère les reprises
                    name: song.name
                });
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

  const handleCopy = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Liste copiée !");
    setTimeout(() => setCopied(false), 2000);
  };

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
        
        {errorMsg ? (
          <div className="bg-[#252525] border border-red-500/30 p-12 rounded-3xl text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black italic uppercase mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-8 font-medium">{errorMsg}</p>
            <Button onClick={() => navigate(-1)} className="bg-white text-black hover:bg-[#4d94ff] hover:text-white rounded-none px-8 font-black italic uppercase transition-all shadow-[8px_8px_0px_rgba(255,255,255,0.1)]">
               <ArrowLeft className="mr-2 w-4 h-4" /> Retour à la sélection
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-8xl font-black italic uppercase mb-4 tracking-tighter leading-none">C'est prêt !</h1>
              <div className="inline-block bg-[#4d94ff] text-white px-6 py-2 text-xl md:text-2xl font-black italic uppercase skew-x-[-12deg] shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
                {songs.length} MORCEAUX
              </div>
              <p className="text-[#666] mt-6 font-bold uppercase tracking-widest text-sm">{playlistName}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-10 flex flex-col justify-between shadow-xl group hover:border-[#4d94ff] transition-all">
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#00ff00] text-black w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic">1</span> Copier
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Copiez la liste pour l'importer dans Spotify ou Deezer via <span className="text-white">TuneMyMusic</span>.
                  </p>
                </div>
                <Button onClick={handleCopy} className={`w-full h-24 text-2xl font-black italic uppercase transition-all rounded-none shadow-[8px_8px_0px_rgba(0,0,0,0.3)] ${copied ? 'bg-[#00ff00] text-black' : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'}`}>
                  {copied ? 'Copié !' : 'Copier la liste'}
                </Button>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-10 flex flex-col justify-between shadow-xl group hover:border-white transition-all">
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#4d94ff] text-white w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic">2</span> Importer
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Allez sur TuneMyMusic, choisissez <span className="text-white">"Texte"</span> comme source, et collez votre liste.
                  </p>
                </div>
                <a href="https://www.tunemymusic.com/fr/" target="_blank" rel="noreferrer" className="block w-full text-center py-8 bg-white text-black font-black italic uppercase transition-all hover:bg-[#4d94ff] hover:text-white text-xl shadow-[8px_8px_0px_rgba(77,148,255,0.2)]">
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
