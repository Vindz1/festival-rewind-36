import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [playlistName, setPlaylistName] = useState('Ma Setlist');
  const [mainArtist, setMainArtist] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Préparation...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        if (user) {
            getUserSubscription(user.id).then(sub => setIsPremium(sub.subscription_type === 'premium'));
        }

        const directState = location.state;
        
        // --- CAS 1 : MODE FESTIVAL / HELLFEST (Liste d'artistes seulement) ---
        if (directState?.artists && Array.isArray(directState.artists)) {
            setPlaylistName(directState.eventName || "Festival Playlist");
            setMainArtist(directState.artists[0] || "Festival");
            await generateFromArtistList(directState.artists);
        }
        
        // --- CAS 2 : RECHERCHE DIRECTE OU HISTORIQUE ---
        else {
            const directSongs = location.state?.songs;
            const directArtist = location.state?.artistName;
            const selectedConcertsStr = localStorage.getItem('selected_concerts');
            const selectedUpcomingStr = localStorage.getItem('selected_upcoming');

            let finalTracks: any[] = [];
            let name = "Ma Setlist";
            let artistForAd = "Rock";

            // A. Données directes (propres)
            if (directSongs && directSongs.length > 0) {
                finalTracks = directSongs.map((s: any) => ({ artist: s.artist, name: s.name }));
                if (directArtist) { name = `${directArtist} Setlist`; artistForAd = directArtist; }
                finishLoading(finalTracks, name, artistForAd);
            } 
            // B. Données Historique / Mes Concerts (potentiellement sales ou incomplètes)
            else if (selectedConcertsStr || selectedUpcomingStr) {
                 try {
                     const rawData = JSON.parse(selectedConcertsStr || selectedUpcomingStr || '[]');
                     if (rawData.length > 0) {
                        artistForAd = rawData[0].artist?.name || rawData[0].artist || "Rock";
                        name = rawData.length > 1 ? "Mes Concerts" : `${artistForAd} Live`;

                        // Analyse de chaque concert
                        const promises = rawData.map(async (concert: any) => {
                            const cArtist = concert.artist?.name || concert.artist;

                            // 1. Si setlist.fm a donné les titres
                            if (concert.sets && concert.sets.set) {
                                return extractTracksFromSets(concert, cArtist);
                            }
                            if (concert.tracks && concert.tracks.length > 0) {
                                // Vérification anti "Titre inconnu"
                                if (concert.tracks[0].name === "Titre inconnu") {
                                    // C'est un CSV cassé -> On répare avec iTunes
                                    return await fetchTopTracks(cArtist);
                                }
                                return concert.tracks;
                            }
                            // 2. Si c'est un concert futur ou sans setlist -> API iTunes
                            if (concert.eventDate || !concert.sets) {
                                 return await fetchTopTracks(cArtist);
                            }
                            // 3. Fallback ID
                            if (concert.id) {
                                try {
                                    const res = await fetch(`/api/setlist?id=${concert.id}`);
                                    if (res.ok) {
                                        const fullData = await res.json();
                                        return extractTracksFromSets(fullData, fullData.artist?.name);
                                    }
                                } catch (err) { console.error(err); }
                            }
                            return [];
                        });

                        const results = await Promise.all(promises);
                        finalTracks = results.flat();
                        finishLoading(finalTracks, name, artistForAd);
                     } else {
                        setErrorMsg("Aucune donnée sélectionnée.");
                        setLoading(false);
                     }
                 } catch (e) {
                     setErrorMsg("Erreur de lecture des données.");
                     setLoading(false);
                 }
            } else {
                setErrorMsg("Aucune donnée reçue.");
                setLoading(false);
            }
        }
    };

    loadData();
  }, [location, user]);

  // --- LOGIQUE API ITUNES ---
  const fetchTopTracks = async (artistName: string) => {
    try {
        const res = await fetch(`/api/get-tracks?artist=${encodeURIComponent(artistName)}`);
        if (res.ok) return await res.json();
    } catch (e) {
        console.error(`Erreur iTunes pour ${artistName}`, e);
    }
    return [];
  };

  const generateFromArtistList = async (artists: string[]) => {
      setLoadingMessage(`Génération de la playlist pour ${artists.length} artistes...`);
      const allTracks: any[] = [];
      const batchSize = 5; // iTunes est rapide, on peut en faire 5 à la fois

      for (let i = 0; i < artists.length; i += batchSize) {
          const batch = artists.slice(i, i + batchSize);
          setLoadingMessage(`Récupération des tubes... (${Math.min(i + batchSize, artists.length)}/${artists.length})`);
          
          const promises = batch.map(a => fetchTopTracks(a));
          const results = await Promise.all(promises);
          results.flat().forEach(t => allTracks.push(t));
      }

      if (allTracks.length > 0) {
          finishLoading(allTracks, "Festival Playlist", artists[0]);
      } else {
          setErrorMsg("Impossible de trouver des titres pour ces artistes.");
          setLoading(false);
      }
  };

  // --- HELPERS ---
  const extractTracksFromSets = (data: any, defaultArtist: string) => {
    const tracks: any[] = [];
    const artistName = defaultArtist || 'Inconnu';
    if (data.sets && data.sets.set) {
        data.sets.set.forEach((set: any) => {
            if (set.song) {
                set.song.forEach((song: any) => {
                    if (song.name && !song.tape) {
                        tracks.push({
                            artist: song.cover ? song.cover.name : artistName,
                            name: song.name
                        });
                    }
                });
            }
        });
    }
    return tracks;
  };

  const finishLoading = (tracks: any[], listName: string, adArtist: string) => {
    if (tracks.length === 0) {
        setErrorMsg("Aucune chanson trouvée.");
        setLoading(false);
        return;
    }
    // Dédoublonnage
    const uniqueTracks = tracks.filter((track, index, self) =>
        index === self.findIndex((t) => (
            t.name.toLowerCase() === track.name.toLowerCase() && t.artist.toLowerCase() === track.artist.toLowerCase()
        ))
    );
    setSongs(uniqueTracks);
    setPlaylistName(listName);
    setMainArtist(adArtist);
    setLoading(false);

    if (user && uniqueTracks.length > 0) {
        saveToHistory(user.id, {
            playlist_name: listName,
            track_count: uniqueTracks.length,
            top_artists: [adArtist],
            platform_target: 'universal'
        }).catch(e => console.error(e));
    }
  };

  const handleCopyText = () => {
    const textList = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(textList);
    setCopied(true);
    toast.success("Liste copiée !");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadCSV = () => {
    const csvContent = "Artist,Track\n" + songs.map(s => `"${s.artist.replace(/"/g, '""')}","${s.name.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${playlistName.replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4"/>
        <p className="animate-pulse text-[#a0a0a0] font-mono text-sm">{loadingMessage}</p>
        <div className="mt-4 flex gap-2 text-xs text-[#666]">
            <Wand2 className="w-4 h-4" /> Powered by iTunes API
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-20">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 text-[#a0a0a0] hover:text-white pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Accueil
        </Button>

        {errorMsg ? (
            <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl text-center animate-in fade-in">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                <h2 className="text-xl font-bold text-red-500 mb-2">Pas de chance...</h2>
                <p className="text-white mb-4">{errorMsg}</p>
                <Button onClick={() => navigate('/')} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">Retour</Button>
            </div>
        ) : (
            <>
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase mb-4 text-white">
                        C'est prêt <span className="text-[#4d94ff]">!</span>
                    </h1>
                    <p className="text-xl text-[#a0a0a0]">
                        <strong className="text-white">{songs.length} titres</strong> prêts à l'export.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Etape 1 : COPIER */}
                    <div className="bg-[#252525] border border-[#404040] rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-[#4d94ff] text-white text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                            Étape 1
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Récupérer la liste</h3>
                            <p className="text-[#a0a0a0] mb-8 text-sm">Copiez la liste propre pour l'import.</p>
                        </div>
                        <div className="space-y-3">
                            <Button 
                                onClick={handleCopyText} 
                                className={`w-full h-16 font-bold text-lg uppercase tracking-widest transition-all ${
                                    copied ? 'bg-[#00ff00] text-black hover:bg-[#00ff00]' : 'bg-[#4d94ff] hover:bg-[#6ba6ff] text-white'
                                }`}
                            >
                                {copied ? <><Check className="mr-2 w-6 h-6"/> COPIÉ !</> : <><Copy className="mr-2 w-5 h-5"/> COPIER (TEXTE)</>}
                            </Button>
                            <button onClick={handleDownloadCSV} className="w-full text-xs text-[#a0a0a0] hover:text-white uppercase font-bold tracking-widest py-3 border border-[#404040] hover:border-white rounded transition-all flex items-center justify-center">
                                <Download className="mr-2 w-4 h-4"/> Ou télécharger en CSV
                            </button>
                        </div>
                    </div>

                    {/* Etape 2 : TUNEMYMUSIC */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 flex flex-col justify-between relative">
                        <div className="absolute top-0 right-0 bg-[#333] text-[#a0a0a0] text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                            Étape 2
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2 text-white">Importer partout</h3>
                            <p className="text-[#a0a0a0] mb-6 text-sm">Via <strong className="text-white">TuneMyMusic</strong> (Gratuit).</p>
                            <ol className="space-y-4 text-sm text-[#a0a0a0]">
                                <li className="flex gap-3"><span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span><span>Cliquez sur le bouton ci-dessous.</span></li>
                                <li className="flex gap-3"><span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span><span>Source <strong>"Texte libre"</strong>.</span></li>
                                <li className="flex gap-3"><span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span><span><strong>Collez</strong> et choisissez Spotify/Deezer.</span></li>
                            </ol>
                        </div>
                        <a href="https://www.tunemymusic.com/fr/" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center justify-center w-full h-14 bg-[#252525] border border-[#404040] hover:bg-[#333] hover:border-white text-white font-bold text-sm uppercase tracking-widest rounded-lg transition-all">
                            Ouvrir TuneMyMusic <ExternalLink className="ml-2 w-4 h-4"/>
                        </a>
                    </div>
                </div>

                {!isPremium && mainArtist && (
                    <div className="mt-16 pt-8 border-t border-[#333]">
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
