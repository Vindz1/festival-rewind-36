import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Music, CheckCircle, AlertTriangle, Loader2, Home, LogIn } from 'lucide-react';

// C'EST ICI QUE TOUT SE JOUE : On importe depuis la racine
import { useAuth } from '@/AuthContext';

const BATCH_SIZE = 4; 
const DELAY_BETWEEN_BATCHES = 1500; 

const GeneratePlaylist = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  
  // On récupère tout ce qu'il faut du moteur d'authentification
  const { session, loading, signOut } = useAuth();
  
  const [status, setStatus] = useState<'idle' | 'creating_playlist' | 'processing' | 'finished' | 'error' | 'token_missing'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentArtist, setCurrentArtist] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [totalTracks, setTotalTracks] = useState(0);

  useEffect(() => {
    if (loading) return; // On attend que l'auth soit chargée

    // 1. Tout est bon : on lance
    if (status === 'idle' && session?.provider_token) {
      startGeneration();
    } 
    // 2. Connecté mais Token perdu (le bug du blocage)
    else if (status === 'idle' && session && !session.provider_token) {
      setStatus('token_missing');
    }
    // 3. Pas connecté
    else if (status === 'idle' && !session) {
      const timer = setTimeout(() => setStatus('error'), 2000);
      return () => clearTimeout(timer);
    }
  }, [session, loading, status]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const handleReLogin = async () => {
    await signOut();
    navigate('/auth');
  };

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
      
      // Choix du nom de la playlist
      const isHellfest = artistsToProcess.some((a: any) => 
        (a.eventDate && a.eventDate.includes('Hellfest')) || 
        (a.date && a.date.includes('Hellfest'))
      );
      const playlistName = isHellfest 
        ? "Hellfest 2026 - Official Selection" 
        : `My Concerts - ${new Date().toLocaleDateString('fr-FR')}`;

      setStatus('creating_playlist');
      addLog(`🔨 Création : "${playlistName}"...`);

      // ÉTAPE 1 : CRÉATION
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

      if (!createRes.ok) throw new Error("Erreur lors de la création");
      const createData = await createRes.json();
      
      if (!createData.playlistId) throw new Error("ID Playlist manquant");

      const playlistId = createData.playlistId;
      setPlaylistUrl(createData.playlistUrl);
      
      addLog("✅ Playlist créée ! Ajout des titres...");

      // ÉTAPE 2 : REMPLISSAGE
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
        } 
      } catch (err) {
        console.error("Erreur réseau", err);
      }

      processedCount += batch.length;
      setProgress(Math.round((processedCount / allArtists.length) * 100));

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
            ) : status === 'token_missing' ? (
              <AlertTriangle className="w-10 h-10 text-yellow-500" />
            ) : (
              <Music className="w-10 h-10 text-primary" />
            )}
          </div>
          
          <h2 className="text-2xl font-display font-bold mb-2">
            {status === 'creating_playlist' && 'Initialisation...'}
            {status === 'processing' && `Traitement... (${progress}%)`}
            {status === 'finished' && 'Playlist Prête !'}
            {status === 'token_missing' && 'Session Expirée'}
            {status === 'error' && 'Erreur'}
            {status === 'idle' && 'Connexion...'}
          </h2>

          {status === 'token_missing' && (
             <p className="text-sm text-muted-foreground mb-4">
               La connexion avec Spotify a été perdue.
             </p>
          )}
        </div>

        {(status === 'processing' || status === 'finished') && (
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm font-medium">
              <span>{progress}%</span>
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
            <div key={i} className={log.includes('❌') ? 'text-destructive' : 'text-green-500'}>
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
          
          {/* BOUTON SAUVETAGE */}
          {(status === 'token_missing' || status === 'error') && (
             <Button onClick={handleReLogin} variant="destructive" className="w-full gap-2">
               <LogIn className="w-4 h-4"/> Me reconnecter
             </Button>
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
