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
  const [loadingMessage, setLoadingMessage] = useState('Analyse des setlists...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        // Reset au chargement
        setSongs([]);
        setErrorMsg('');
        
        if (user) {
            getUserSubscription(user.id).then(sub => setIsPremium(sub.subscription_type === 'premium'));
        }

        const directState = location.state; 
        const storagePast = localStorage.getItem('selected_concerts');
        const storageUpcoming = localStorage.getItem('selected_upcoming');

        // --- SCÉNARIO 1 : HELLFEST / NAVIGATION DIRECTE ---
        if (directState?.artists && Array.isArray(directState.artists)) {
            setPlaylistName(directState.eventName || "Festival Playlist");
            setMainArtist(directState.artists[0] || "Festival");
            await generateBestOfList(directState.artists, 10);
        }

        // --- SCÉNARIO 2 : CONCERTS PASSÉS (Strict) ---
        else if (storagePast && JSON.parse(storagePast).length > 0) {
            const rawData = JSON.parse(storagePast);
            
            let artistName = "Various Artists";
            if (rawData[0].artist) artistName = rawData[0].artist.name || rawData[0].artist;
            setMainArtist(artistName);
            setPlaylistName(rawData.length > 1 ? "Mes Concerts" : `${artistName} Live`);

            const allTracks: any[] = [];

            for (const concert of rawData) {
                const cArtist = concert.artist?.name || concert.artist || "Inconnu";
                
                // On extrait les titres du format Setlist.fm
                if (concert.sets && concert.sets.set) {
                    const tracks = extractTracks(concert, cArtist);
                    tracks.forEach(t => allTracks.push(t));
                } 
                // Fallback si déjà formaté en tracks
                else if (concert.tracks && concert.tracks.length > 0) {
                    concert.tracks.forEach((t: any) => {
                        if (t.name && t.name !== "Titre inconnu") {
                            allTracks.push({ artist: t.artist || cArtist, name: t.name });
                        }
                    });
                }
            }
            finishLoading(allTracks, playlistName, artistName);
        }

        // --- SCÉNARIO 3 : CONCERTS FUTURS (Best Of) ---
        else if (storageUpcoming && JSON.parse(storageUpcoming).length > 0) {
            const rawData = JSON.parse(storageUpcoming);
            const artistNames = rawData.map((c: any) => c.artist?.name || c.artist);
            setPlaylistName("Mes Prochains Concerts");
            setMainArtist(artistNames[0]);
            await generateBestOfList(artistNames, 10);
        }

        else {
            setErrorMsg("Aucune sélection trouvée.");
            setLoading(false);
        }
    };

    loadData();
  }, [location.state]); // On ne dépend plus de 'user' ou 'location' entier pour éviter les boucles

  // Moteur d'extraction fidèle à Setlist.fm
  const extractTracks = (data: any, defaultArtist: string) => {
    const result: any[] = [];
    if (!data.sets || !data.sets.set) return result;

    const sets = Array.isArray(data.sets.set) ? data.sets.set : [data.sets.set];
    
    sets.forEach((set: any) => {
      if (!set.song) return;
      const songs = Array.isArray(set.song) ? set.song : [set.song];
      
      songs.forEach((song: any) => {
        if (song.tape) return; // On ignore les intros sur bande
        if (!song.name) return; // On ignore les lignes vides

        // Gestion de la reprise (Cover) : on prend l'artiste original si dispo
        const artist = song.cover ? song.cover.name : defaultArtist;
        result.push({ artist, name: song.name });
      });
    });
    return result;
  };

  // Moteur iTunes (uniquement pour le futur)
  const fetchItunes = async (artist: string, limit: number) => {
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${limit}`);
      const data = await res.json();
      return data.results.map((item: any) => ({ artist: item.artistName, name: item.trackName }));
    } catch (e) {
      return [];
    }
  };

  const generateBestOfList = async (artists: string[], limit: number) => {
    setLoadingMessage("Recherche des morceaux sur iTunes...");
    const all: any[] = [];
    for (const a of artists) {
      const t = await fetchItunes(a, limit);
      t.forEach(x => all.push(x));
    }
    finishLoading(all, playlistName, artists[0]);
  };

  const finishLoading = (tracks: any[], name: string, artist: string) => {
    if (tracks.length === 0) {
      setErrorMsg("La setlist semble vide sur Setlist.fm.");
      setLoading(false);
      return;
    }
    setSongs(tracks);
    setPlaylistName(name);
    setMainArtist(artist);
    setLoading(false);

    if (user) {
      saveToHistory(user.id, {
        playlist_name: name,
        track_count: tracks.length,
        top_artists: [artist],
        platform_target: 'universal'
      }).catch(() => {});
    }
  };

  // HANDLERS
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
    link.download = `Setlive_${playlistName.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
      <p className="text-[#a0a0a0]">{loadingMessage}</p>
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
          <div className="bg-[#252525] border border-[#333] p-12 rounded-3xl text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-8">{errorMsg}</p>
            <Button onClick={() => navigate('/')} className="bg-[#4d94ff] hover:bg-[#6ba6ff]">Retour à l'accueil</Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-black italic uppercase mb-4 italic">C'est prêt !</h1>
              <p className="text-xl text-[#a0a0a0] uppercase tracking-widest font-bold">
                <span className="text-[#4d94ff]">{songs.length}</span> TITRES EXTRAITS
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-[#00ff00] w-6 h-6" /> 1. COPIER
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed">
                    Copiez la liste des morceaux pour l'importer dans Spotify ou Deezer via TuneMyMusic.
                  </p>
                </div>
                <Button onClick={handleCopy} className={`w-full h-16 text-lg font-bold uppercase tracking-widest transition-all ${copied ? 'bg-[#00ff00] text-black hover:bg-[#00ff00]' : 'bg-[#4d94ff] hover:bg-[#6ba6ff]'}`}>
                  {copied ? 'Copié !' : 'Copier la liste'}
                </Button>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <ExternalLink className="text-[#4d94ff] w-6 h-6" /> 2. IMPORTER
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed">
                    Allez sur TuneMyMusic, choisissez "Texte" comme source, et collez votre liste.
                  </p>
                </div>
                <div className="space-y-4">
                  <a href="https://www.tunemymusic.com/fr/" target="_blank" rel="noreferrer" className="block w-full text-center py-4 bg-[#333] hover:bg-[#444] rounded-xl font-bold uppercase tracking-widest transition-colors">
                    Ouvrir TuneMyMusic
                  </a>
                  <button onClick={handleCSV} className="w-full text-xs text-[#666] hover:text-white uppercase font-bold tracking-widest">
                    Ou télécharger le CSV
                  </button>
                </div>
              </div>
            </div>

            {!isPremium && mainArtist && (
              <div className="mt-20 pt-10 border-t border-[#333]">
                <SmartAd artistName={mainArtist} index={0} />
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
