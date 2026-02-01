import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Music, CheckCircle, AlertTriangle, Loader2, Home } from 'lucide-react';
import { toast } from 'sonner';

// 1. CORRECTION DU CHEMIN D'IMPORT (Vers la racine src/)
import { useAuth } from '../../AuthContext'; 

// 2. RÉGLAGE DE SÉCURITÉ POUR ÉVITER LE BLOCAGE
const BATCH_SIZE = 4; 
const DELAY_BETWEEN_BATCHES = 2000; // Pause de 2 secondes : plus lent mais plus sûr !

const GeneratePlaylist = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { session } = useAuth();
  
  const [status, setStatus] = useState<'idle' | 'creating_playlist' | 'processing' | 'finished' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentArtist, setCurrentArtist] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [totalTracks, setTotalTracks] = useState(0);
  const [failedArtists, setFailedArtists] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'idle' && session?.provider_token) {
      startGeneration();
    } else if (status === 'idle' && !session) {
      const timer = setTimeout(() => {
         if (!session) {
             // On attend un peu avant de déclarer l'erreur, au cas où le chargement est lent
             setStatus('error');
             addLog("❌ Erreur : Connexion Spotify requise.");
         }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const startGeneration = async () => {
    try {
      const storageKey = mode === 'upcoming' ? 'selected_upcoming' : 'selected_concerts';
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        setStatus('error');
        addLog("❌ Aucune donnée trouvée.");
        return;
      }

      const artistsToProcess = JSON.parse(storedData);
      
      // Choix du nom
      const isHellfest = artistsToProcess.some((a: any) => 
        (a.eventDate && a.eventDate.includes('Hellfest')) || 
        (a.date && a.date.includes('Hellfest'))
      );
      const playlistName = isHellfest 
        ? "Hellfest 2026 - Official Selection" 
        : `My Concerts - ${new Date().toLocaleDateString('fr-FR')}`;

      // ÉTAPE A : CRÉATION
      setStatus('creating_playlist');
      addLog(`🔨 Création playlist : "${playlistName}"...`);

      const createRes = await fetch('/api/top-tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.provider_token}`
        },
        body: JSON.stringify({ 
          mode: 'create',
          playlistName: playlistName
        }),
      });

      if (!createRes.ok) throw new Error("Échec création playlist");
      const createData = await createRes.json();
      const playlistId = createData.playlistId;
      setPlaylistUrl(createData.playlistUrl);
      
      addLog("✅ Playlist créée ! Remplissage...");

      // ÉTAPE B : REMPLISSAGE
      setStatus('processing');
      await processBatches(artistsToProcess, playlistId);

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      addLog(`❌ Erreur : ${error.message}`);
    }
  };

  const processBatches = async (allArtists: any[], playlistId: string) => {
    let processedCount = 0;
    let tracksCount = 0;

    for (let i = 0; i < allArtists.length; i += BATCH_SIZE) {
      const batch = allArtists.slice(i, i + BATCH_SIZE);
      const artistNames = batch.map((a: any) => {
          if (typeof a === 'string') return a;
          return a.artist || a.name || "Inconnu";
      });
      
      setCurrentArtist(artistNames[0]);
      
      try {
        const response = await fetch('/api/top-tracks', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.provider_token}`
          },
          body: JSON.stringify({ 
            mode: 'add',
            artists: artistNames,
            playlistId: playlistId
          }),
        });

        const data = await response.json();

        if (data.success) {
            tracksCount += data.tracksAdded;
            setTotalTracks(tracksCount);
            if (data.found.length > 0) addLog(`✅ Ajouté : ${data.found[0]}...`);
            if (data.notFound && data.notFound.length > 0) {
                setFailedArtists(prev => [...prev, ...data.notFound]);
            }
        } 
      } catch (err) {
        console.error("Erreur réseau", err);
        addLog(`⚠️ Pause réseau... on continue.`);
      }

      processedCount += batch.length;
      setProgress(Math.round((processedCount / allArtists.length) * 100));

      // PAUSE DE SÉCURITÉ
      if (i + BATCH_SIZE < allArtists.length) {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
      }
    }

    setStatus('finished');
    addLog("✨ Terminé !");
  };

  return (
    <div className="min-h-screen bg-background noise flex flex-col items-center justify-center p-4">
      <Header />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-card border border-border rounded-xl p-8 shadow-2xl mt-16"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === 'processing' || status === 'creating_playlist' ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : status === 'finished' ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : status === 'error' ? (
              <AlertTriangle className="w-10 h-10 text-destructive" />
            ) : (
              <Music className="w-10 h-10 text-primary" />
            )}
          </div>
          
          <h2 className="text-2xl font-display font-bold mb-2">
            {status === 'creating_playlist' && 'Initialisation...'}
            {status === 'processing' && `Traitement en cours (${progress}%)`}
            {status === 'finished' && 'Playlist Prête !'}
            {status === 'error' && 'Une erreur est survenue'}
            {status === 'idle' && 'Connexion...'}
          </h2>
        </div>

        {(status === 'processing' || status === 'finished') && (
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm font-medium">
              <span>Progression</span>
              <span>{totalTracks} titres</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-black/40 rounded-lg p-4 mb-6 h-32 overflow-hidden text-xs font-mono text-muted-foreground space-y-1 border border-border/50">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('❌') ? 'text-destructive' : log.includes('⚠️') ? 'text-yellow-500' : 'text-green-500'}>
              {log}
            </div>
          ))}
        </div>

        <div className="text-center space-y-3">
          {status === 'finished' && (
            <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button className="w-full gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold h-12 text-lg">
                <Music className="w-5 h-5" />
                Ouvrir dans Spotify
              </Button>
            </a>
          )}
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full gap-2">
            <Home className="w-4 h-4"/> Retour à l'accueil
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default GeneratePlaylist;
