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
    const loadData = async () => {
        setSongs([]);
        setErrorMsg('');
        
        if (user) {
            getUserSubscription(user.id).then(sub => setIsPremium(sub.subscription_type === 'premium'));
        }

        const directState = location.state; 
        const storagePast = localStorage.getItem('selected_concerts');
        const storageUpcoming = localStorage.getItem('selected_upcoming');

        // 1. DÉTERMINER LA SOURCE ET LE MODE
        let rawData = [];
        let isFestival = false;

        if (directState?.artists) {
            rawData = directState.artists.map((a: string) => ({ artist: a, isFuture: true }));
            setPlaylistName(directState.eventName || "Festival Playlist");
            isFestival = true;
        } else if (storagePast || storageUpcoming) {
            const past = JSON.parse(storagePast || '[]');
            const future = JSON.parse(storageUpcoming || '[]');
            rawData = [...past.map((c: any) => ({ ...c, isFuture: false })), ...future.map((c: any) => ({ ...c, isFuture: true }))];
            setPlaylistName(rawData.length > 1 ? "Ma Sélection" : "Ma Setlist");
        }

        if (rawData.length === 0) {
            setErrorMsg("Aucun concert sélectionné.");
            setLoading(false);
            return;
        }

        // 2. EXTRACTION DES TITRES
        setLoadingMessage("Récupération des morceaux...");
        const allTracks: any[] = [];

        for (const item of rawData) {
            const artistName = item.artist?.name || item.artist || "Inconnu";
            if (artistName === "Inconnu") continue;

            let foundInSetlist = false;

            // A. Si c'est un concert passé, on tente l'extraction STRICTE de Setlist.fm
            if (!item.isFuture && item.sets) {
                const extracted = extractFromSets(item, artistName);
                if (extracted.length > 0) {
                    extracted.forEach(t => allTracks.push(t));
                    foundInSetlist = true;
                }
            }

            // B. Si c'est un concert futur OU si la setlist passée était vide (Fallback)
            if (item.isFuture || !foundInSetlist) {
                // On demande 10 titres pour le futur, et 15 pour réparer un passé vide
                const limit = item.isFuture ? 10 : 15;
                const topTracks = await fetchItunes(artistName, limit);
                topTracks.forEach(t => allTracks.push(t));
            }
        }

        // 3. FINALISATION
        if (allTracks.length === 0) {
            setErrorMsg("Impossible de trouver des titres pour cette sélection.");
        } else {
            // Dédoublonnage simple
            const unique = allTracks.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.artist === v.artist)) === i);
            setSongs(unique);
            setMainArtist(allTracks[0].artist);
        }
        setLoading(false);
    };

    loadData();
  }, [location.state]);

  // Extraction propre des données Setlist.fm
  const extractFromSets = (concert: any, defaultArtist: string) => {
    const tracks: any[] = [];
    try {
        const setsData = concert.sets?.set;
        if (!setsData) return [];
        const setsArray = Array.isArray(setsData) ? setsData : [setsData];
        
        setsArray.forEach((s: any) => {
            if (!s.song) return;
            const songsArray = Array.isArray(s.song) ? s.song : [s.song];
            songsArray.forEach((song: any) => {
                if (!song.name || song.tape) return;
                tracks.push({
                    artist: song.cover ? song.cover.name : defaultArtist,
                    name: song.name
                });
            });
        });
    } catch (e) { console.error(e); }
    return tracks;
  };

  // Moteur de secours iTunes
  const fetchItunes = async (artist: string, limit: number) => {
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${limit}`);
        const data = await res.json();
        return data.results.map((item: any) => ({
            artist: item.artistName,
            name: item.trackName
        }));
    } catch (e) { return []; }
  };

  const finishLoading = (tracks: any[]) => {
      // (Logique intégrée au useEffect pour plus de simplicité)
  };

  // UI Handlers
  const handleCopy = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCSV = () => {
    const content = "Artist,Track\n" + songs.map(s => `"${s.artist}","${s.name}"`).join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Setlive_Export.csv`;
    link.click();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
      <p className="text-[#a0a0a0] font-mono">{loadingMessage}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-20">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-[#a0a0a0] hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>

        {errorMsg ? (
          <div className="bg-[#252525] border border-[#333] p-12 rounded-3xl text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 italic uppercase">Oups !</h2>
            <p className="text-[#a0a0a0] mb-8">{errorMsg}</p>
            <Button onClick={() => navigate('/')} className="bg-[#4d94ff] hover:bg-[#6ba6ff] rounded-none px-8 font-bold italic uppercase">Retour à l'accueil</Button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-black italic uppercase mb-4 tracking-tighter">C'est prêt !</h1>
              <div className="inline-block bg-[#4d94ff] text-white px-4 py-1 text-sm font-black italic uppercase skew-x-[-10deg]">
                {songs.length} titres trouvés
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl group hover:border-[#4d94ff] transition-all">
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 italic uppercase">
                    <Check className="text-[#00ff00] w-6 h-6" /> 1. Copier
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed">
                    Copiez la liste pour l'importer dans votre plateforme de streaming (Spotify, Deezer...) via TuneMyMusic.
                  </p>
                </div>
                <Button onClick={handleCopy} className={`w-full h-16 text-lg font-black italic uppercase transition-all rounded-none ${copied ? 'bg-[#00ff00] text-black' : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'}`}>
                  {copied ? 'Copié !' : 'Copier la liste'}
                </Button>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl group hover:border-white transition-all">
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 italic uppercase text-white">
                    <ExternalLink className="text-[#4d94ff] w-6 h-6" /> 2. Importer
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed">
                    Allez sur TuneMyMusic, choisissez "Texte" comme source, et collez votre liste.
                  </p>
                </div>
                <div className="space-y-4">
                  <a href="https://www.tunemymusic.com/fr/" target="_blank" rel="noreferrer" className="block w-full text-center py-4 bg-white text-black font-black italic uppercase transition-colors hover:bg-[#4d94ff] hover:text-white">
                    Ouvrir TuneMyMusic
                  </a>
                  <button onClick={handleCSV} className="w-full text-xs text-[#666] hover:text-[#4d94ff] uppercase font-bold tracking-widest transition-colors">
                    Ou télécharger le fichier CSV
                  </button>
                </div>
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
