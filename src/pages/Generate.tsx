import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';
import { Music, Loader2, Play, ArrowRight, Lock, Crown, CheckCircle2, ListMusic, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

// --- TYPES ---
interface TrackInfo {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  spotifyUri?: string;
  year?: string;
}

export default function Generate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode');
  const isUpcomingMode = mode === 'upcoming';
  
  const { user } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [tracksWithInfo, setTracksWithInfo] = useState<TrackInfo[]>([]);
  
  // États de chargement
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);

  // Simulation du chargement des données (Remplacer par votre vraie logique de récupération)
  useEffect(() => {
    const loadData = async () => {
        // Simuler la récupération du localStorage
        const storageKey = isUpcomingMode ? 'selected_upcoming' : 'selected_concerts';
        const storedData = localStorage.getItem(storageKey);
        
        if (!storedData) {
            toast.error("Aucune sélection trouvée");
            navigate('/my-concerts');
            return;
        }

        const parsedData = JSON.parse(storedData);
        setSongs(parsedData);

        // Récupération de l'abonnement
        if (user) {
            const sub = await getUserSubscription(user.id);
            setSubscription(sub);
        }

        // Démarrer la simulation de génération
        startGenerationProcess(parsedData);
    };

    loadData();
  }, [user, isUpcomingMode, navigate]);

  const startGenerationProcess = async (data: any[]) => {
      setLoading(true);
      
      // Étape 1: Analyse
      setCurrentStep(1);
      setProgress(20);
      await new Promise(r => setTimeout(r, 800));

      // Étape 2: Recherche Spotify
      setCurrentStep(2);
      
      // Simulation de la recherche des tracks (À remplacer par votre vraie logique API)
      const simulatedTracks: TrackInfo[] = data.map((item: any, index: number) => ({
          title: `Titre ${index + 1}`, // Ici, votre vraie logique mettrait le vrai titre
          artist: item.artist,
          album: item.venue || "Album inconnu",
          year: item.eventDate ? item.eventDate.split(' ').pop() : "2024",
          // albumArt: "..." // Optionnel
      }));

      // Animation de la barre de progression
      for (let i = 0; i <= 100; i += 10) {
          setProgress(20 + (i * 0.6));
          await new Promise(r => setTimeout(r, 100));
      }

      setTracksWithInfo(simulatedTracks);
      
      // Étape 3: Finalisation
      setCurrentStep(3);
      setProgress(100);
      setLoading(false);
  };

  const forceExport = () => {
      toast.success("Redirection vers Spotify...");
      // Votre logique d'export ici
  };

  // --- RENDU ---

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-[#4d94ff] selection:text-white">
      <Header />

      {/* Conteneur principal avec padding-top pour éviter la "bande noire" sous le header fixe */}
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        
        {/* En-tête de page */}
        <div className="text-center mb-12 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a0a0a0]">
                {loading ? 'Création de votre Playlist' : 'Votre Playlist est prête'}
            </h1>
            <p className="text-[#a0a0a0]">
                {isUpcomingMode 
                    ? "Préparez-vous pour vos futurs concerts" 
                    : "Revivez vos meilleurs souvenirs de concerts"}
            </p>
        </div>

        {/* --- SECTION CHARGEMENT / PROGRESSION --- */}
        {loading ? (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            
            {/* Indicateur circulaire central */}
            <div className="flex justify-center mb-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#4d94ff]/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="relative bg-[#2d2d2d] p-6 rounded-full border border-[#4d94ff]/30 shadow-[0_0_30px_-5px_rgba(77,148,255,0.3)]">
                        <Loader2 className="w-12 h-12 text-[#4d94ff] animate-spin" />
                    </div>
                </div>
            </div>

            {/* Étapes textuelles */}
            <div className="flex justify-between text-sm font-medium px-2">
              <div className={`flex flex-col items-center gap-2 transition-colors ${currentStep >= 1 ? 'text-[#4d94ff]' : 'text-[#606060]'}`}>
                <div className={`p-2 rounded-full border ${currentStep >= 1 ? 'bg-[#4d94ff]/10 border-[#4d94ff]' : 'bg-[#2d2d2d] border-[#404040]'}`}>
                    <ListMusic className="w-4 h-4" />
                </div>
                <span>Analyse</span>
              </div>
              
              <div className="flex-1 h-[2px] bg-[#333] mx-4 mt-5 relative">
                <div className="absolute top-0 left-0 h-full bg-[#4d94ff] transition-all duration-1000" style={{ width: currentStep >= 2 ? '100%' : '0%' }}></div>
              </div>

              <div className={`flex flex-col items-center gap-2 transition-colors ${currentStep >= 2 ? 'text-[#4d94ff]' : 'text-[#606060]'}`}>
                <div className={`p-2 rounded-full border ${currentStep >= 2 ? 'bg-[#4d94ff]/10 border-[#4d94ff]' : 'bg-[#2d2d2d] border-[#404040]'}`}>
                    <Sparkles className="w-4 h-4" />
                </div>
                <span>Recherche</span>
              </div>

              <div className="flex-1 h-[2px] bg-[#333] mx-4 mt-5 relative">
                <div className="absolute top-0 left-0 h-full bg-[#4d94ff] transition-all duration-1000" style={{ width: currentStep >= 3 ? '100%' : '0%' }}></div>
              </div>

              <div className={`flex flex-col items-center gap-2 transition-colors ${currentStep >= 3 ? 'text-[#4d94ff]' : 'text-[#606060]'}`}>
                 <div className={`p-2 rounded-full border ${currentStep >= 3 ? 'bg-[#4d94ff]/10 border-[#4d94ff]' : 'bg-[#2d2d2d] border-[#404040]'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Finalisation</span>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="space-y-2">
                <Progress value={progress} className="h-2 bg-[#2d2d2d]" />
                <p className="text-center text-xs text-[#a0a0a0] animate-pulse">
                    {progress < 40 && "Analyse de vos artistes..."}
                    {progress >= 40 && progress < 80 && "Recherche des setlists..."}
                    {progress >= 80 && "Organisation des titres..."}
                </p>
            </div>
          </div>

        ) : (
          
          /* --- SECTION RÉSULTATS --- */
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            
            {/* Résumé */}
            <div className="bg-[#2d2d2d] border border-[#404040] rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="bg-[#4d94ff]/10 p-3 rounded-lg text-[#4d94ff]">
                        <Music className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Playlist Générée !</h2>
                        <p className="text-[#a0a0a0] text-sm">{tracksWithInfo.length} titres trouvés pour {songs.length} concerts</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" onClick={() => navigate('/my-concerts')} className="flex-1 border-[#404040] text-[#a0a0a0] hover:text-white hover:bg-[#3d3d3d]">
                        Retour
                    </Button>
                </div>
            </div>

            {/* Liste des titres (Style Spotify Dark) */}
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl overflow-hidden shadow-2xl">
              {/* Header de liste */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 border-b border-[#333] bg-[#252525] text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                 <div className="w-8 text-center">#</div>
                 <div>Titre</div>
                 <div className="hidden md:block">Durée</div>
              </div>

              <div className="divide-y divide-[#2a2a2a] max-h-[500px] overflow-y-auto custom-scrollbar">
                {tracksWithInfo.map((track, index) => (
                  <div 
                    key={index}
                    className="group grid grid-cols-[auto_1fr_auto] gap-4 p-3 items-center hover:bg-[#2a2a2a] transition-colors cursor-default"
                  >
                    <div className="w-8 text-center text-[#606060] font-mono text-sm group-hover:text-white">
                        {index + 1}
                    </div>
                    
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Image Album (Placeholder si vide) */}
                      <div className="w-10 h-10 rounded bg-[#333] flex-shrink-0 flex items-center justify-center border border-[#404040]">
                        {track.albumArt ? (
                            <img src={track.albumArt} alt={track.album} className="w-full h-full object-cover rounded" />
                        ) : (
                            <Music className="w-4 h-4 text-[#606060]" />
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate group-hover:text-[#4d94ff] transition-colors">
                            {track.title}
                        </div>
                        <div className="text-xs text-[#a0a0a0] truncate flex items-center gap-1">
                            <span>{track.artist}</span>
                            {track.album && <span className="hidden md:inline">• {track.album}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-[#606060] font-mono pr-2">
                        --:--
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton Export Principal */}
            <div className="sticky bottom-4 z-20 mx-auto max-w-md">
              <div className="absolute inset-0 bg-[#4d94ff]/20 blur-2xl rounded-full"></div>
              <Button 
                onClick={forceExport}
                className="relative w-full h-14 text-lg font-bold bg-[#4d94ff] hover:bg-[#6ba6ff] text-white shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-full"
              >
                {!user && <Lock className="mr-2 w-4 h-4" />}
                <span className="flex items-center gap-2">
                    {user ? <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" className="h-5 w-auto mr-1" /> : null}
                    {user ? 'Exporter vers Spotify' : 'Se connecter pour exporter'}
                </span>
                {user && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>

              {user && subscription?.subscription_type === 'free' && !subscription.can_export && (
                <div className="mt-3 text-center animate-in fade-in slide-in-from-bottom-2">
                  <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 gap-2">
                    <Crown className="w-4 h-4" />
                    Passer Premium pour plus d'exports
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
