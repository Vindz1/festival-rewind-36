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
  const [loadingMessage, setLoadingMessage] = useState('Purge et analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        // --- 1. PURGE ET ISOLEMENT DES DONNÉES ---
        const directState = location.state; 
        const storagePast = localStorage.getItem('selected_concerts');
        const storageUpcoming = localStorage.getItem('selected_upcoming');

        let rawData = [];
        
        // Priorité 1 : Navigation Directe (Hellfest / Page Artiste)
        if (directState?.artists) {
            // ON VIDE TOUT LE RESTE POUR ÉVITER LE MÉLANGE
            localStorage.removeItem('selected_concerts');
            localStorage.removeItem('selected_upcoming');
            
            rawData = directState.artists.map((a: string) => ({ artist: a, isFuture: true }));
            setPlaylistName(directState.eventName || "Festival Playlist");
        } 
        // Priorité 2 : Concerts Passés
        else if (storagePast && JSON.parse(storagePast).length > 0) {
            localStorage.removeItem('selected_upcoming'); // On purge le futur
            const past = JSON.parse(storagePast);
            rawData = past.map((c: any) => ({ ...c, isFuture: false }));
            setPlaylistName(rawData.length > 1 ? "Mes Concerts" : "Ma Setlist");
        }
        // Priorité 3 : Concerts Futurs (Panier)
        else if (storageUpcoming && JSON.parse(storageUpcoming).length > 0) {
            localStorage.removeItem('selected_concerts'); // On purge le passé
            const future = JSON.parse(storageUpcoming);
            rawData = future.map((c: any) => ({ ...c, isFuture: true }));
            setPlaylistName("Ma Sélection Future");
        }

        if (rawData.length === 0) {
            setErrorMsg("Aucune donnée à traiter. Votre sélection est vide.");
            setLoading(false);
            return;
        }

        // --- 2. EXTRACTION DES TITRES (Logique Réalité vs Découverte) ---
        setLoadingMessage("Génération des titres...");
        const allTracks: any[] = [];

        for (const item of rawData) {
            const artistName = item.artist?.name || item.artist || "Inconnu";
            if (artistName === "Inconnu") continue;

            let hasRealData = false;

            // CAS : CONCERT PASSÉ -> RECHERCHE SETLIST STRICTE
            if (!item.isFuture && item.sets) {
                const setsTracks = extractFromSets(item, artistName);
                if (setsTracks.length > 0) {
                    setsTracks.forEach(t => allTracks.push(t));
                    hasRealData = true;
                }
            }

            // CAS : CONCERT FUTUR OU SETLIST VIDE -> TOP 10 (Sauf si vous voulez rester vide pour le passé)
            // Pour coller à votre demande : si c'est passé et vide, on ne met rien.
            // Si c'est futur, on met le Top 10.
            if (item.isFuture) {
                const top = await fetchItunes(artistName, 10);
                top.forEach(t => allTracks.push(t));
            } 
            // Optionnel : si vous voulez un fallback pour le passé vide, décommentez la ligne suivante
            // else if (!hasRealData) { const fall = await fetchItunes(artistName, 15); fall.forEach(t => allTracks.push(t)); }
        }

        // --- 3. FINALISATION ---
        if (allTracks.length === 0) {
            setErrorMsg("Aucune setlist disponible pour cette sélection.");
        } else {
            // Dédoublonnage technique
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
  }, [location.state]); // Déclenchement sur changement d'état de navigation

  // Moteur Setlist.fm (Gestion Covers & Tape)
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
                // On ignore les bandes (intro/outro) et les noms vides
                if (song.tape || !song.name || song.name.toLowerCase().includes('unknown')) return;

                tracks.push({
                    artist: song.cover ? song.cover.name : defaultArtist, // On prend l'artiste original si c'est une reprise
                    name: song.name
                });
            });
        });
    } catch (e) { console.error("Erreur extraction", e); }
    return tracks;
  };

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
      <p className="text-[#a0a0a0] font-mono uppercase tracking-widest text-xs">{loadingMessage}</p>
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
              <h1 className="text-4xl md:text-7xl font-black italic uppercase mb-4 tracking-tighter">C'est prêt !</h1>
              <div className="inline-block bg-[#4d94ff] text-white px-6 py-2 text-xl font-black italic uppercase skew-x-[-12deg]">
                {songs.length} titres
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl group hover:border-[#4d94ff] transition-all">
                <div>
                  <h3 className="text-2xl font-bold mb-4 italic uppercase flex items-center gap-3">
                    <span className="bg-[#00ff00] text-black w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span> Copier
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed font-medium">
                    Copiez la liste des morceaux pour l'importer dans Spotify ou Deezer via TuneMyMusic.
                  </p>
                </div>
                <Button onClick={handleCopy} className={`w-full h-20 text-xl font-black italic uppercase transition-all rounded-none ${copied ? 'bg-[#00ff00] text-black hover:bg-[#00ff00]' : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'}`}>
                  {copied ? 'Copié !' : 'Copier la liste'}
                </Button>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 flex flex-col justify-between shadow-xl group hover:border-white transition-all">
                <div>
                  <h3 className="text-2xl font-bold mb-4 italic uppercase flex items-center gap-3">
                    <span className="bg-[#4d94ff] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span> Importer
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed font-medium">
                    Allez sur TuneMyMusic, choisissez "Texte" comme source, et collez votre liste.
                  </p>
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
