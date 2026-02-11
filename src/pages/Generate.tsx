import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2, AlertCircle, Trash2 } from 'lucide-react';
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
    const loadData = async () => {
        setSongs([]);
        setErrorMsg('');
        
        const directState = location.state; 
        const storagePast = localStorage.getItem('selected_concerts');
        const storageUpcoming = localStorage.getItem('selected_upcoming');

        let rawData = [];
        let isFutureProcessing = false;

        // --- 1. IDENTIFICATION DE LA SOURCE UNIQUE ---
        if (directState?.artists) {
            // MODE HELLFEST / DIRECT
            localStorage.removeItem('selected_concerts');
            localStorage.removeItem('selected_upcoming');
            rawData = directState.artists.map((a: string) => ({ artist: a, isFuture: true }));
            setPlaylistName(directState.eventName || "Festival Playlist");
            isFutureProcessing = true;
        } else if (storagePast && JSON.parse(storagePast).length > 0) {
            // MODE PASSÉ (I WAS THERE)
            localStorage.removeItem('selected_upcoming');
            rawData = JSON.parse(storagePast).map((c: any) => ({ ...c, isFuture: false }));
            setPlaylistName(rawData.length > 1 ? "Mes Concerts" : "Ma Setlist");
            isFutureProcessing = false;
        } else if (storageUpcoming && JSON.parse(storageUpcoming).length > 0) {
            // MODE FUTUR (I'M GOING)
            localStorage.removeItem('selected_concerts');
            rawData = JSON.parse(storageUpcoming).map((c: any) => ({ ...c, isFuture: true }));
            setPlaylistName("Ma Sélection Future");
            isFutureProcessing = true;
        }

        if (rawData.length === 0) {
            setErrorMsg("Aucune sélection trouvée.");
            setLoading(false);
            return;
        }

        // --- 2. EXTRACTION ---
        setLoadingMessage(isFutureProcessing ? "Génération du Best-Of..." : "Récupération de la setlist réelle...");
        const allTracks: any[] = [];

        for (const item of rawData) {
            const artistName = item.artist?.name || item.artist || "Inconnu";
            
            if (item.isFuture) {
                // Pour le FUTUR : On utilise iTunes pour 10 titres populaires
                const top = await fetchItunes(artistName, 10);
                top.forEach(t => allTracks.push(t));
            } else {
                // Pour le PASSÉ : STRICTEMENT Setlist.fm
                if (item.sets || item.tracks) {
                    const extracted = extractFromSets(item, artistName);
                    extracted.forEach(t => allTracks.push(t));
                }
                // Si rien n'est trouvé ici, allTracks reste vide pour cet artiste.
            }
        }

        // --- 3. FINALISATION ---
        if (allTracks.length === 0) {
            setErrorMsg(isFutureProcessing 
                ? "Impossible de trouver des titres pour ces artistes." 
                : "La setlist n'a pas encore été renseignée sur Setlist.fm pour ce concert."
            );
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

  const extractFromSets = (concert: any, defaultArtist: string) => {
    const tracks: any[] = [];
    try {
        // Cas des données déjà formatées
        if (concert.tracks && !concert.sets) {
            return concert.tracks.filter((t: any) => t.name && t.name !== "Titre inconnu");
        }
        // Cas des données brutes Setlist.fm
        const setsData = concert.sets?.set;
        if (!setsData) return [];
        const setsArray = Array.isArray(setsData) ? setsData : [setsData];
        
        setsArray.forEach((s: any) => {
            if (!s.song) return;
            const songsArray = Array.isArray(s.song) ? s.song : [s.song];
            songsArray.forEach((song: any) => {
                if (song.tape || !song.name || song.name.toLowerCase().includes('unknown')) return;
                tracks.push({
                    artist: song.cover ? song.cover.name : defaultArtist,
                    name: song.name
                });
            });
        });
    } catch (e) { console.error(e); }
    return tracks;
  };

  const fetchItunes = async (artist: string, limit: number) => {
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${limit}`);
        const data = await res.json();
        return data.results.map((item: any) => ({ artist: item.artistName, name: item.trackName }));
    } catch (e) { return []; }
  };

  const handleCopy = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white text-center px-4">
      <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
      <p className="text-[#a0a0a0] font-mono uppercase tracking-widest text-xs">{loadingMessage}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-20">
        
        {errorMsg ? (
          <div className="bg-[#252525] border border-red-500/30 p-12 rounded-3xl text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black italic uppercase mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-8 font-medium">{errorMsg}</p>
            <Button onClick={() => navigate(-1)} className="bg-white text-black hover:bg-[#4d94ff] hover:text-white rounded-none px-8 font-black italic uppercase transition-all">
               <ArrowLeft className="mr-2 w-4 h-4" /> Retour à la sélection
            </Button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-7xl font-black italic uppercase mb-4 tracking-tighter">C'est prêt !</h1>
              <div className="inline-block bg-[#4d94ff] text-white px-6 py-2 text-xl font-black italic uppercase skew-x-[-12deg]">
                {songs.length} titres extraits
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-2xl font-bold mb-4 italic uppercase">1. Copier</h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm">Récupérez la liste pour TuneMyMusic.</p>
                </div>
                <Button onClick={handleCopy} className={`w-full h-20 text-xl font-black italic uppercase transition-all rounded-none ${copied ? 'bg-[#00ff00] text-black' : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'}`}>
                  {copied ? 'Copié !' : 'Copier la liste'}
                </Button>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-2xl font-bold mb-4 italic uppercase">2. Importer</h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm">Collez la liste dans TuneMyMusic (Source: Texte).</p>
                </div>
                <a href="https://www.tunemymusic.com/fr/" target="_blank" rel="noreferrer" className="block w-full text-center py-6 bg-white text-black font-black italic uppercase transition-colors hover:bg-[#4d94ff] hover:text-white text-lg">
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
