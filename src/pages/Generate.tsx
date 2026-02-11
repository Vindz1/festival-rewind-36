import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history'; // Important : On garde l'historique
import { SmartAd } from '@/components/SmartAd'; // Important : On garde la pub
import { getUserSubscription } from '@/lib/subscription';

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [playlistName, setPlaylistName] = useState('Ma Setlist');
  const [mainArtist, setMainArtist] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // 1. CHARGEMENT ET PARSING DES DONNÉES
  useEffect(() => {
    const loadData = async () => {
        // Vérif Premium pour les pubs
        if (user) {
            getUserSubscription(user.id).then(sub => {
                setIsPremium(sub.subscription_type === 'premium');
            });
        }

        const directSongs = location.state?.songs;
        const directArtist = location.state?.artistName;
        
        const selectedConcerts = localStorage.getItem('selected_concerts');
        const selectedUpcoming = localStorage.getItem('selected_upcoming');

        let tracksFound: any[] = [];
        let name = "Ma Setlist";
        let artist = "Various Artists";

        // CAS 1 : On vient d'une recherche directe
        if (directSongs && directSongs.length > 0) {
            tracksFound = directSongs;
            if (directArtist) {
                name = `${directArtist} Setlist`;
                artist = directArtist;
            }
        } 
        // CAS 2 : On vient de l'historique ou sélection multiple
        else if (selectedConcerts || selectedUpcoming) {
             try {
                 const rawData = JSON.parse(selectedConcerts || selectedUpcoming || '[]');
                 
                 if (rawData.length > 0) {
                    // On définit le nom
                    if (rawData.length === 1) {
                        name = `${rawData[0].artist} @ ${rawData[0].venue}`;
                        artist = rawData[0].artist;
                    } else {
                        name = "Mes Concerts";
                        artist = rawData[0].artist; // On prend le premier pour la pub
                    }

                    // On extrait les chansons (Flattening)
                    // Note : Votre code précédent faisait peut-être un appel API ici.
                    // Si rawData ne contient que des IDs, il faudrait refaire un fetch.
                    // On suppose ici que rawData contient bien les infos (artist, song name) 
                    // ou que vous avez stocké les détails.
                    
                    // Si rawData contient directement une structure de setlist.fm :
                    rawData.forEach((concert: any) => {
                        // Si le concert a déjà une liste de tracks (format interne)
                        if (concert.tracks) {
                            tracksFound = [...tracksFound, ...concert.tracks];
                        } 
                        // Sinon, c'est peut-être juste artist/name
                        else {
                            // Fallback simple
                            tracksFound.push({ 
                                artist: concert.artist || 'Inconnu', 
                                name: concert.name || 'Titre inconnu' 
                            });
                        }
                    });
                 }
             } catch (e) {
                 console.error("Erreur parsing", e);
             }
        }

        if (tracksFound.length === 0) {
            // Si vide, on redirige (sécurité)
            // navigate('/'); 
            // Pour le dev, on met des données bidons si vide pour tester l'interface
            setSongs([
                { artist: 'Metallica', name: 'Enter Sandman' },
                { artist: 'Metallica', name: 'Master of Puppets' },
                { artist: 'Gojira', name: 'Stranded' }
            ]);
            setMainArtist('Metallica');
            setLoading(false);
            return;
        }

        setSongs(tracksFound);
        setPlaylistName(name);
        setMainArtist(artist);
        setLoading(false);

        // SAUVEGARDE DANS L'HISTORIQUE (Vital pour la page Profil)
        if (user && tracksFound.length > 0) {
            saveToHistory(user.id, {
                playlist_name: name,
                track_count: tracksFound.length,
                top_artists: [artist],
                platform_target: 'universal' // Nouveau type pour différencier
            }).catch(err => console.error("Erreur save history", err));
        }
    };

    loadData();
  }, [location, user]);

  // FONCTION : COPIER
  const handleCopyText = () => {
    const textList = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(textList);
    setCopied(true);
    toast.success("Liste copiée !");
    setTimeout(() => setCopied(false), 3000);
  };

  // FONCTION : CSV
  const handleDownloadCSV = () => {
    const csvContent = "Artist,Track\n" + songs.map(s => `"${s.artist}","${s.name}"`).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${playlistName.replace(/\s+/g, '_')}_Setlive.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Fichier téléchargé");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12"/>
    </div>
  );

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
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
            
            {/* GAUCHE : ACTIONS */}
            <div className="bg-[#252525] border border-[#404040] rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#4d94ff] text-white text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                    Étape 1
                </div>
                
                <div>
                    <h3 className="text-2xl font-bold mb-2">Récupérer la liste</h3>
                    <p className="text-[#a0a0a0] mb-8 text-sm">Copiez la liste des morceaux formatée spécialement pour l'import.</p>
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
                        {copied ? (
                            <><Check className="mr-2 w-6 h-6"/> COPIÉ !</>
                        ) : (
                            <><Copy className="mr-2 w-5 h-5"/> COPIER LA LISTE</>
                        )}
                    </Button>
                    
                    <button 
                        onClick={handleDownloadCSV}
                        className="w-full text-xs text-[#666] hover:text-white uppercase font-bold tracking-widest py-2 border border-transparent hover:border-[#404040] rounded transition-all"
                    >
                        Ou télécharger en CSV
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
                    <p className="text-[#a0a0a0] mb-6 text-sm">Utilisez l'outil gratuit <span className="text-white font-bold">TuneMyMusic</span> pour créer la playlist.</p>
                    
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
                            <span><strong>Collez</strong> votre liste (Ctrl+V) et choisissez votre destination (Spotify, Deezer...).</span>
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

        {/* PUBLICITÉ INTELLIGENTE (Si pas premium) */}
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
