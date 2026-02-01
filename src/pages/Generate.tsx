import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Music, CheckCircle, AlertTriangle, Loader2, Home } from 'lucide-react';
import { AuthProvider, useAuth } from "@/AuthContext";
import { toast } from 'sonner';

// CONFIGURATION UNIVERSELLE
// 4 groupes par paquet = Bon compromis vitesse/sécurité
const BATCH_SIZE = 4; 
// 1 seconde de pause entre les paquets = Spotify reste calme
const DELAY_BETWEEN_BATCHES = 1000; 

const GeneratePlaylist = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 'upcoming' ou 'past' (par défaut)
  const { session } = useAuth();
  
  const [status, setStatus] = useState<'idle' | 'creating_playlist' | 'processing' | 'finished' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentArtist, setCurrentArtist] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [totalTracks, setTotalTracks] = useState(0);
  const [failedArtists, setFailedArtists] = useState<string[]>([]);

  // Démarrage automatique quand la session est prête
  useEffect(() => {
    if (status === 'idle' && session?.provider_token) {
      startGeneration();
    } else if (status === 'idle' && !session) {
      // Attente du chargement de la session ou redirection si pas connecté
      const timer = setTimeout(() => {
         if (!session) {
             setStatus('error');
             addLog("❌ Erreur : Vous devez être connecté à Spotify.");
         }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const startGeneration = async () => {
    try {
      const storageKey = mode === 'upcoming' ? 'selected_upcoming' : 'selected_concerts';
      const storedData = localStorage.getItem(storageKey);
      
      // SÉCURITÉ ANTI-CRASH
      if (!storedData) {
        setStatus('error');
        addLog("❌ Erreur : Aucune donnée trouvée à générer.");
        return;
      }

      let artistsToProcess;
      try {
        artistsToProcess = JSON.parse(storedData);
      } catch (e) {
        setStatus('error');
        addLog("❌ Erreur : Les données du navigateur sont corrompues.");
        return;
      }

      // Si la liste est vide, on arrête tout de suite
      if (!artistsToProcess || artistsToProcess.length === 0) {
         setStatus('error');
         addLog("❌ La liste des artistes est vide.");
         return;
      }

      // 2. CHOISIR LE NOM DE LA PLAYLIST
      // Si c'est le Hellfest, on force un nom, sinon on met une date
      const isHellfest = artistsToProcess.some((a: any) => 
        (a.eventDate && a.eventDate.includes('Hellfest')) || 
        (a.date && a.date.includes('Hellfest'))
      );
      
      const playlistName = isHellfest 
        ? "Hellfest 2026 - Official Selection" 
        : `My Concerts - ${new Date().toLocaleDateString('fr-FR')}`;

      // ÉTAPE 3 : CRÉATION DE LA PLAYLIST VIDE
      setStatus('creating_playlist');
      addLog(`🔨 Création de la playlist "${playlistName}"...`);

      const createRes = await fetch('/api/top-tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.provider_token}`
        },
        body: JSON.stringify({ 
          mode: 'create', // On active le mode séquentiel du backend
          playlistName: playlistName
        }),
      });

      if (!createRes.ok) throw new Error("Erreur lors de la création de la playlist");
      
      const createData = await createRes.json();
      const playlistId = createData.playlistId;
      setPlaylistUrl(createData.playlistUrl);
      
      addLog("✅ Playlist créée ! Remplissage en cours...");

      // ÉTAPE 4 : REMPLISSAGE PAR PAQUETS
      setStatus('processing');
      await processBatches(artistsToProcess, playlistId);

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      addLog(`❌ Erreur critique : ${error.message}`);
    }
  };

  const processBatches = async (allArtists: any[], playlistId: string) => {
    let processedCount = 0;
    let tracksCount = 0;

    // Boucle par paquets (Batching)
    for (let i = 0; i < allArtists.length; i += BATCH_SIZE) {
      const batch = allArtists.slice(i, i + BATCH_SIZE);
      
      // Extraction sécurisée du nom de l'artiste (gère les différents formats de données)
      const artistNames = batch.map((a: any) => {
          if (typeof a === 'string') return a;
          return a.artist || a.name || "Artiste Inconnu";
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
            mode: 'add', // On active le mode ajout du backend
            artists: artistNames,
            playlistId: playlistId
          }),
        });

        const data = await response.json();

        if (data.success) {
            tracksCount += data.tracksAdded;
            setTotalTracks(tracksCount);
            
            // Log intelligent : on n'affiche que le premier du groupe pour pas spammer
            if (data.found.length > 0) {
               addLog(`✅ ${data.found[0]} et ${data.found.length - 1} autres...`);
            }
            
            if (data.notFound && data.notFound.length > 0) {
                setFailedArtists(prev => [...prev, ...data.notFound]);
                // On ne loggue les erreurs que si c'est important
                addLog(`⚠️ ${data.notFound.length} introuvable(s) dans ce lot`);
            }
        } else {
            addLog(`⚠️ Erreur mineure sur un paquet : ${data.error}`);
        }

      } catch (err) {
        console.error("Erreur réseau", err);
        addLog(`❌ Erreur réseau temporaire. On continue...`);
      }

      // Mise à jour progression
      processedCount += batch.length;
      setProgress(Math.round((processedCount / allArtists.length) * 100));

      // PAUSE (pour éviter l'erreur 429 Too Many Requests)
      if (i + BATCH_SIZE < allArtists.length) {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
      }
    }

    setStatus('finished');
    addLog("✨ Génération terminée avec succès !");
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
            {status === 'processing' && `Traitement : ${currentArtist}`}
            {status === 'finished' && 'Playlist Prête !'}
            {status === 'error' && 'Oups !'}
            {status === 'idle' && 'Connexion...'}
          </h2>
          
          {status === 'processing' && (
            <p className="text-muted-foreground animate-pulse text-sm">
              Spotify analyse vos goûts musicaux...
            </p>
          )}
        </div>

        {/* Barre de progression */}
        {(status === 'processing' || status === 'finished') && (
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm font-medium">
              <span>{progress}%</span>
              <span>{totalTracks} titres ajoutés</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-black/40 rounded-lg p-4 mb-6 h-32 overflow-hidden text-xs font-mono text-muted-foreground space-y-1 border border-border/50">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('❌') ? 'text-destructive' : log.includes('⚠️') ? 'text-yellow-500' : 'text-green-500'}>
              {log}
            </div>
          ))}
        </div>

        {/* Résumé des échecs (si terminé) */}
        {status === 'finished' && failedArtists.length > 0 && (
             <div className="mb-6 p-3 bg-yellow-950/30 border border-yellow-600/30 rounded-lg max-h-24 overflow-y-auto">
                 <p className="text-yellow-500 text-xs font-bold mb-1 sticky top-0 bg-yellow-950/90 p-1">
                    Groupes non trouvés sur Spotify ({failedArtists.length}) :
                 </p>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {failedArtists.join(', ')}
                 </p>
             </div>
        )}

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
