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
  const [loadingMessage, setLoadingMessage] = useState('Analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        if (user) {
            getUserSubscription(user.id).then(sub => setIsPremium(sub.subscription_type === 'premium'));
        }

        const directState = location.state;
        
        // --- CAS 1 : HELLFEST / UPCOMING ---
        if (directState?.artists && Array.isArray(directState.artists)) {
            setPlaylistName(directState.eventName || "Festival Playlist");
            setMainArtist(directState.artists[0] || "Festival");
            await generateFromArtistList(directState.artists);
        }
        
        // --- CAS 2 : HISTORIQUE / CSV / MES CONCERTS ---
        else {
            const selectedConcertsStr = localStorage.getItem('selected_concerts');
            const selectedUpcomingStr = localStorage.getItem('selected_upcoming');

            // On essaie de récupérer les données
            let rawData = [];
            try {
                if (location.state?.songs) rawData = [{ tracks: location.state.songs }];
                else rawData = JSON.parse(selectedConcertsStr || selectedUpcomingStr || '[]');
            } catch (e) {
                console.error("Erreur parsing", e);
            }

            if (rawData.length > 0) {
                let artistName = "Various Artists";
                // Tentative de nommage intelligent
                if (rawData[0].artist) artistName = rawData[0].artist.name || rawData[0].artist;
                else if (rawData[0].tracks && rawData[0].tracks.length > 0) artistName = rawData[0].tracks[0].artist;
                
                setMainArtist(artistName);
                setPlaylistName(rawData.length > 1 ? "Mes Concerts" : `${artistName} Live`);

                // --- ANALYSE ET RÉPARATION ---
                setLoadingMessage("Réparation des titres manquants...");
                const allTracks: any[] = [];

                for (const concert of rawData) {
                    const cArtist = concert.artist?.name || concert.artist || "Inconnu";

                    // A. On a déjà des pistes ?
                    if (concert.tracks && concert.tracks.length > 0) {
                        // VÉRIFICATION CRITIQUE : Est-ce que c'est le mauvais CSV ("Titre inconnu") ?
                        const isBadData = concert.tracks.some((t: any) => 
                            t.name === "Titre inconnu" || t.name === "Unknown Track"
                        );

                        if (isBadData) {
                            // OUI -> On appelle iTunes pour réparer
                            const repaired = await fetchTopTracks(cArtist);
                            repaired.forEach((t: any) => allTracks.push(t));
                        } else {
                            // NON -> C'est bon, on garde
                            concert.tracks.forEach((t: any) => allTracks.push({
                                artist: t.artist || cArtist,
                                name: t.name
                            }));
                        }
                    }
                    // B. C'est du format Setlist.fm (Sets) ?
                    else if (concert.sets && concert.sets.set) {
                         const extracted = extractTracksFromSets(concert, cArtist);
                         if (extracted.length === 0) {
                             // Setlist vide ? -> Fallback iTunes
                             const fallback = await fetchTopTracks(cArtist);
                             fallback.forEach((t: any) => allTracks.push(t));
                         } else {
                             extracted.forEach(t => allTracks.push(t));
                         }
                    }
                    // C. Rien du tout ? -> iTunes direct
                    else {
                        const fallback = await fetchTopTracks(cArtist);
                        fallback.forEach((t: any) => allTracks.push(t));
                    }
                }

                finishLoading(allTracks, rawData.length > 1 ? "Mes Concerts" : `${artistName} Setlist`, artistName);

            } else {
                setErrorMsg("Aucune donnée trouvée. Retournez à l'accueil.");
                setLoading(false);
            }
        }
    };

    loadData();
  }, [location, user]);

  // --- API CALL ---
  const fetchTopTracks = async (artistName: string) => {
    if (!artistName || artistName === "Inconnu") return [];
    try {
        const res = await fetch(`/api/get-tracks?artist=${encodeURIComponent(artistName)}`);
        if (res.ok) {
            const data = await res.json();
            return data;
        }
    } catch (e) {
        console.error(`Erreur fetch ${artistName}`, e);
    }
    return [];
  };

  const generateFromArtistList = async (artists: string[]) => {
      setLoadingMessage(`Récupération des tubes pour ${artists.length} artistes...`);
      const allTracks: any[] = [];
      
      // Traitement par lots de 5 pour aller vite
      for (let i = 0; i < artists.length; i += 5) {
          const batch = artists.slice(i, i + 5);
          setLoadingMessage(`Analyse... ${Math.min(i + 5, artists.length)} / ${artists.length}`);
          
          const promises = batch.map(a => fetchTopTracks(a));
          const results = await Promise.all(promises);
          results.flat().forEach(t => allTracks.push(t));
      }

      if (allTracks.length > 0) {
          finishLoading(allTracks, "Festival Playlist", artists[0]);
      } else {
          setErrorMsg("Impossible de trouver des titres. Vérifiez votre connexion.");
          setLoading(false);
      }
  };

  const extractTracksFromSets = (data: any, defaultArtist: string) => {
    const tracks: any[] = [];
    if (data.sets && data.sets.set) {
        data.sets.set.forEach((set: any) => {
            if (set.song) {
                set.song.forEach((song: any) => {
                    if (song.name && !song.tape) {
                        tracks.push({
                            artist: song.cover ? song.cover.name : defaultArtist,
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
        setErrorMsg("Aucun titre trouvé. L'API ne répond pas.");
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
    
    // Save history (silencieux en cas d'erreur)
    if (user && uniqueTracks.length > 0) {
         saveToHistory(user.id, {
            playlist_name: listName,
            track_count: uniqueTracks.length,
            top_artists: [adArtist],
            platform_target: 'universal'
        }).catch(() => {});
    }
  };

  const handleCopyText = () => {
    const textList = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(textList);
    setCopied(true);
    toast.success("Copié !");
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
            <Wand2 className="w-4 h-4" /> Powered by iTunes
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
                    {/* GAUCHE : COPIER */}
                    <div className="bg-[#252525] border border-[#404040] rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-[#4d94ff] text-white text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">Étape 1</div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Récupérer la liste</h3>
                            <p className="text-[#a0a0a0] mb-8 text-sm">Copiez la liste pour TuneMyMusic.</p>
                        </div>
                        <div className="space-y-3">
                            <Button onClick={handleCopyText} className={`w-full h-16 font-bold text-lg uppercase tracking-widest transition-all ${copied ? 'bg-[#00ff00] text-black hover:bg-[#00ff00]' : 'bg-[#4d94ff] hover:bg-[#6ba6ff] text-white'}`}>
                                {copied ? <><Check className="mr-2 w-6 h-6"/> COPIÉ !</> : <><Copy className="mr-2 w-5 h-5"/> COPIER (TEXTE)</>}
                            </Button>
                            <button onClick={handleDownloadCSV} className="w-full text-xs text-[#a0a0a0] hover:text-white uppercase font-bold tracking-widest py-3 border border-[#404040] hover:border-white rounded transition-all flex items-center justify-center">
                                <Download className="mr-2 w-4 h-4"/> Ou télécharger en CSV
                            </button>
                        </div>
                    </div>

                    {/* DROITE : TUNEMYMUSIC */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 flex flex-col justify-between relative">
                        <div className="absolute top-0 right-0 bg-[#333] text-[#a0a0a0] text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">Étape 2</div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2 text-white">Importer</h3>
                            <p className="text-[#a0a0a0] mb-6 text-sm">Via <strong className="text-white">TuneMyMusic</strong> (Gratuit).</p>
                            <ol className="space-y-4 text-sm text-[#a0a0a0]">
                                <li className="flex gap-3"><span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span><span>Cliquez sur le bouton.</span></li>
                                <li className="flex gap-3"><span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span><span>Source <strong>"Texte libre"</strong>.</span></li>
                                <li className="flex gap-3"><span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span><span><strong>Collez</strong> la liste.</span></li>
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
