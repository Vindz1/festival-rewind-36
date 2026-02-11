import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';

// Interface pour définir clairement une piste propre
interface Track {
    artist: string;
    name: string;
}

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState('Ma Setlist');
  const [mainArtist, setMainArtist] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // 1. LE COEUR DU REACTEUR : CHARGEMENT ET NETTOYAGE DES DONNEES
  useEffect(() => {
    const loadData = async () => {
        if (user) {
            getUserSubscription(user.id).then(sub => setIsPremium(sub.subscription_type === 'premium'));
        }

        const directSongs = location.state?.songs;
        const directArtist = location.state?.artistName;
        const selectedConcertsStr = localStorage.getItem('selected_concerts');
        const selectedUpcomingStr = localStorage.getItem('selected_upcoming');

        let finalTracks: Track[] = [];
        let name = "Ma Setlist";
        let artistForAd = "Rock";

        // CAS 1 : On vient d'une recherche directe d'artiste (déjà propre)
        if (directSongs && directSongs.length > 0) {
            finalTracks = directSongs.map((s: any) => ({ artist: s.artist || directArtist, name: s.name }));
            if (directArtist) {
                name = `${directArtist} Setlist`;
                artistForAd = directArtist;
            }
        } 
        // CAS 2 : On vient de l'historique (données brutes Setlist.fm à nettoyer)
        else if (selectedConcertsStr || selectedUpcomingStr) {
             try {
                 const rawData = JSON.parse(selectedConcertsStr || selectedUpcomingStr || '[]');
                 
                 if (rawData.length > 0) {
                    artistForAd = rawData[0].artist?.name || rawData[0].artist || "Rock";
                    name = rawData.length > 1 ? "Mes Concerts" : `${artistForAd} Live`;

                    // --- NETTOYAGE DES DONNÉES BRUTES ---
                    rawData.forEach((concert: any) => {
                        const concertArtist = concert.artist?.name || concert.artist || 'Inconnu';
                        
                        // Si les pistes sont déjà là (format court)
                        if (concert.tracks && Array.isArray(concert.tracks)) {
                            concert.tracks.forEach((t: any) => {
                                finalTracks.push({ artist: t.artist || concertArtist, name: t.name });
                            });
                        }
                        // Si c'est le format brut de setlist.fm (sets > song)
                        else if (concert.sets && concert.sets.set) {
                             concert.sets.set.forEach((set: any) => {
                                if (set.song && Array.isArray(set.song)) {
                                    set.song.forEach((song: any) => {
                                        // On ignore les "tapes" (intro sur bande) si on veut
                                        if (song.name && !song.tape) {
                                            // Si c'est une cover, l'artiste change
                                            const trackArtist = song.cover ? song.cover.name : concertArtist;
                                            finalTracks.push({ artist: trackArtist, name: song.name });
                                        }
                                    });
                                }
                             });
                        }
                    });
                    // --- FIN DU NETTOYAGE ---
                 }
             } catch (e) {
                 console.error("Erreur parsing", e);
                 toast.error("Erreur lors de la lecture des données.");
             }
        }

        // DÉDOUBLONNAGE (Optionnel : pour éviter d'avoir 3 fois "Enter Sandman" si on a fait 3 concerts de Metallica)
        const uniqueTracks = finalTracks.filter((track, index, self) =>
            index === self.findIndex((t) => (
                t.name.toLowerCase() === track.name.toLowerCase() && t.artist.toLowerCase() === track.artist.toLowerCase()
            ))
        );

        if (uniqueTracks.length === 0) {
            toast.error("Aucun titre trouvé dans la sélection.");
            navigate('/'); // Sécurité
            setLoading(false);
            return;
        }

        setSongs(uniqueTracks);
        setPlaylistName(name);
        setMainArtist(artistForAd);
        setLoading(false);

        // SAUVEGARDE HISTORIQUE
        if (user && uniqueTracks.length > 0) {
            saveToHistory(user.id, {
                playlist_name: name,
                track_count: uniqueTracks.length,
                top_artists: [artistForAd],
                platform_target: 'universal'
            });
        }
    };

    loadData();
  }, [location, user, navigate]);

  // 2. FONCTION COPIER (Format : "Artiste - Titre")
  const handleCopyText = () => {
    const textList = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(textList);
    setCopied(true);
    toast.success("Liste copiée !");
    setTimeout(() => setCopied(false), 3000);
  };

  // 3. FONCTION CSV (Corrigée)
  const handleDownloadCSV = () => {
    // L'en-tête + chaque ligne entourée de guillemets pour gérer les virgules dans les titres
    const csvContent = "Artist,Track\n" + songs.map(s => `"${s.artist.replace(/"/g, '""')}","${s.name.replace(/"/g, '""')}"`).join("\n");
    
    // Création du fichier avec l'encodage UTF-8 BOM pour qu'Excel l'ouvre bien
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Lien de téléchargement unique (pas de boucle infinie)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${playlistName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}_Setlive.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Nettoyage de la mémoire
    toast.success("Fichier téléchargé");
  };

  if (loading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center"><Loader2 className="animate-spin text-[#4d94ff] w-12 h-12"/></div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-20">
        
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-[#a0a0a0] hover:text-white pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>

        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl md:text-5xl font-black italic uppercase mb-4 text-white">
                C'est prêt <span className="text-[#4d94ff]">!</span>
            </h1>
            <p className="text-xl text-[#a0a0a0]">
                Votre setlist contient <strong className="text-white">{songs.length} titres</strong>.
            </p>
            {songs.length > 0 && (
                <p className="text-sm text-[#666] mt-2">Ex: {songs[0].artist} - {songs[0].name}...</p>
            )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
            
            {/* GAUCHE : ACTIONS */}
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
                            copied 
                            ? 'bg-[#00ff00] text-black hover:bg-[#00ff00]' 
                            : 'bg-[#4d94ff] hover:bg-[#6ba6ff] text-white shadow-[0_0_20px_rgba(77,148,255,0.3)]'
                        }`}
                    >
                        {copied ? <><Check className="mr-2 w-6 h-6"/> COPIÉ !</> : <><Copy className="mr-2 w-5 h-5"/> COPIER (TEXTE)</>}
                    </Button>
                    
                    <button 
                        onClick={handleDownloadCSV}
                        className="w-full text-xs text-[#a0a0a0] hover:text-white uppercase font-bold tracking-widest py-3 border border-[#404040] hover:border-white rounded transition-all flex items-center justify-center"
                    >
                        <Download className="mr-2 w-4 h-4"/> Ou télécharger en CSV
                    </button>
                </div>
            </div>

            {/* DROITE : TUTO TUNEMYMUSIC */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-8 flex flex-col justify-between relative">
                <div className="absolute top-0 right-0 bg-[#333] text-[#a0a0a0] text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                    Étape 2
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Importer partout</h3>
                    <p className="text-[#a0a0a0] mb-6 text-sm">Utilisez l'outil gratuit <strong className="text-white">TuneMyMusic</strong>.</p>
                    
                    <ol className="space-y-4 text-sm text-[#a0a0a0]">
                        <li className="flex gap-3 items-start">
                            <span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                            <span>Cliquez sur le bouton ci-dessous.</span>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                            <span>Cliquez sur <strong>"Démarrer"</strong> puis source <strong>"Texte libre"</strong>.</span>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="bg-[#333] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                            <span><strong>Collez</strong> (Ctrl+V) et choisissez votre plateforme (Spotify, Deezer, Apple...).</span>
                        </li>
                    </ol>
                </div>

                <a 
                    href="https://www.tunemymusic.com/fr/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-8 flex items-center justify-center w-full h-14 bg-[#252525] border border-[#404040] hover:bg-[#333] hover:border-white text-white font-bold text-sm uppercase tracking-widest rounded-lg transition-all"
                >
                    Ouvrir TuneMyMusic <ExternalLink className="ml-2 w-4 h-4"/>
                </a>
            </div>
        </div>

        {/* PUBLICITÉ */}
        {!isPremium && mainArtist && (
             <div className="mt-16 pt-8 border-t border-[#333]">
                <p className="text-center text-xs text-[#666] uppercase font-bold tracking-widest mb-6">Sponsorisé</p>
                <SmartAd artistName={mainArtist} index={0} />
             </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
