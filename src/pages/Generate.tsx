import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // Assurez-vous d'avoir ce composant ou utilisez une div simple
import { Music, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Configuration
const BATCH_SIZE = 4; // On traite 4 groupes à la fois pour être sûr de ne pas timeout
const DELAY_BETWEEN_BATCHES = 500; // Petite pause pour ne pas spammer Spotify

const GeneratePlaylist = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { user } = useAuth(); // Supposant que vous avez un hook d'auth qui donne le token provider
  
  const [status, setStatus] = useState<'idle' | 'creating' | 'processing' | 'finished' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentArtist, setCurrentArtist] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [totalTracksAdded, setTotalTracksAdded] = useState(0);

  useEffect(() => {
    if (status === 'idle') {
      startGeneration();
    }
  }, []);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

  const startGeneration = async () => {
    try {
      // 1. Récupérer les données du localStorage
      const storageKey = mode === 'upcoming' ? 'selected_upcoming' : 'selected_concerts';
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        setStatus('error');
        addLog("Aucune donnée trouvée. Retournez à la sélection.");
        return;
      }

      const artistsToProcess = JSON.parse(storedData);
      const totalArtists = artistsToProcess.length;
      
      setStatus('creating');
      addLog(`Démarrage pour ${totalArtists} groupes...`);

      // 2. Créer la Playlist vide (On le fait depuis le front pour avoir l'ID tout de suite)
      // Note: Cela nécessite que votre système d'auth expose le token Spotify. 
      // Si ce n'est pas le cas, vous devrez peut-être faire un appel API dédié '/api/create-playlist'
      
      // SOLUTION SIMPLE: On demande à votre API existante de créer la playlist
      // On va supposer que vous avez une route pour ça, sinon on utilise 'top-tracks' astucieusement
      
      // Pour cet exemple, je vais simuler la création via votre API existante ou une nouvelle.
      // Le mieux est de traiter par paquets et d'envoyer à votre API backend existante.
      
      processBatches(artistsToProcess);

    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const processBatches = async (allArtists: any[]) => {
    setStatus('processing');
    let processedCount = 0;
    let playlistId = null;
    let tracksCount = 0;

    // On découpe en petits paquets
    for (let i = 0; i < allArtists.length; i += BATCH_SIZE) {
      const batch = allArtists.slice(i, i + BATCH_SIZE);
      const artistNames = batch.map((a: any) => a.artist || a.name); // Adapté à vos données
      
      setCurrentArtist(artistNames[0]); // Affiche le groupe en cours
      
      try {
        // Appel à votre API existante 'top-tracks'
        const response = await fetch('/api/top-tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            artists: artistNames,
            // Astuce: on envoie l'ID playlist si on l'a déjà pour que le backend ajoute les titres
            playlistId: playlistId, 
            isFirstBatch: i === 0,
            playlistName: "Hellfest 2026 - Official Selection" // Nom de la playlist
          }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Erreur API");

        // Le premier appel nous donne l'ID de la playlist créée
        if (data.playlistId) {
          playlistId = data.playlistId;
          setPlaylistUrl(data.playlistUrl);
        }
        
        // Mise à jour des stats
        if (data.tracksAdded) tracksCount += data.tracksAdded;
        
        // Progression
        processedCount += batch.length;
        const percent = Math.round((processedCount / allArtists.length) * 100);
        setProgress(percent);
        setTotalTracksAdded(tracksCount);
        addLog(`✅ Ajouté : ${artistNames.join(', ')}`);

      } catch (err) {
        console.error("Erreur sur le paquet :", err);
        addLog(`❌ Erreur sur ${artistNames[0]}... on continue.`);
      }

      // Petite pause pour respirer
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }

    setStatus('finished');
  };

  return (
    <div className="min-h-screen bg-background noise flex flex-col items-center justify-center p-4">
      <Header />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-card border border-border rounded-xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === 'processing' ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : status === 'finished' ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <Music className="w-10 h-10 text-primary" />
            )}
          </div>
          
          <h2 className="text-2xl font-display font-bold mb-2">
            {status === 'processing' ? 'Génération en cours...' : 
             status === 'finished' ? 'Playlist Prête !' : 
             'Préparation...'}
          </h2>
          
          {status === 'processing' && (
            <p className="text-muted-foreground animate-pulse">
              Recherche des titres pour <span className="text-primary font-bold">{currentArtist}</span>...
            </p>
          )}
        </div>

        {/* Barre de progression */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          {/* Si vous n'avez pas le composant Progress, utilisez une div grise avec une div colorée dedans */}
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Logs */}
        <div className="bg-black/20 rounded-lg p-4 mb-6 h-32 overflow-hidden text-xs font-mono text-muted-foreground space-y-1">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

        <div className="text-center">
          {status === 'finished' && (
            <div className="space-y-4">
              <p className="text-lg font-bold text-green-500">
                🎉 {totalTracksAdded} titres ajoutés avec succès !
              </p>
              <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold">
                  <Music className="w-4 h-4" />
                  Ouvrir dans Spotify
                </Button>
              </a>
              <Button variant="ghost" onClick={() => navigate('/')}>
                Retour à l'accueil
              </Button>
            </div>
          )}

          {status === 'error' && (
            <Button variant="destructive" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GeneratePlaylist;
