import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2, AlertCircle, Music } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';

interface Track {
  artist: string;
  name: string;
}

interface ConcertData {
  id?: string;
  artist: string | { name: string };
  venue?: string;
  eventDate?: string;
  isFuture?: boolean;
  sets?: any;
  tracks?: Track[];
}

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [mainArtist, setMainArtist] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    processGeneration();
  }, [location.state]); // Dépend de location.state pour relancer si navigation

  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then(sub => {
        setIsPremium(sub.subscription_type === 'premium');
      }).catch(err => {
        console.error('Erreur récupération subscription:', err);
      });
    }
  }, [user]);

  const processGeneration = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      // --- 1. RÉCUPÉRATION DES DONNÉES (sans suppression immédiate) ---
      const stateData = location.state;
      const mode = searchParams.get('mode'); // 'upcoming' ou null
      
      let dataToUse: ConcertData[] = [];
      let type: 'festival' | 'past' | 'future' | null = null;
      let pName = "Ma Setlist";

      console.log('🔍 State data:', stateData);
      console.log('🔍 Mode:', mode);

      // PRIORITÉ 1 : Données directes depuis HellfestPage (via state)
      if (stateData?.artists && Array.isArray(stateData.artists)) {
        console.log('✅ Mode: Hellfest/Festival');
        type = 'festival';
        dataToUse = stateData.artists.map((artistName: string) => ({
          artist: artistName,
          isFuture: true,
          id: artistName.toLowerCase().replace(/\s+/g, '-')
        }));
        pName = stateData.eventName || "Hellfest 2026";
      } 
      // PRIORITÉ 2 : Mode "upcoming" explicite via URL
      else if (mode === 'upcoming') {
        console.log('✅ Mode: Upcoming (I\'m Going)');
        type = 'future';
        const futureRaw = localStorage.getItem('selected_upcoming');
        if (futureRaw) {
          const parsed = JSON.parse(futureRaw);
          dataToUse = parsed.map((c: any) => ({
            ...c,
            artist: c.artist?.name || c.artist,
            isFuture: true
          }));
          pName = parsed.length === 1 
            ? `${dataToUse[0].artist} - Warmup` 
            : "Ma Sélection Future";
        }
      }
      // PRIORITÉ 3 : Mode "past" (par défaut si pas upcoming)
      else {
        console.log('✅ Mode: Past (I Was There)');
        type = 'past';
        const pastRaw = localStorage.getItem('selected_concerts');
        if (pastRaw) {
          const parsed = JSON.parse(pastRaw);
          dataToUse = parsed.map((c: any) => ({
            ...c,
            artist: c.artist?.name || c.artist,
            isFuture: false
          }));
          pName = parsed.length === 1 
            ? `${dataToUse[0].artist} Live` 
            : "Mes Concerts (Passés)";
        }
      }

      console.log('📊 Data to use:', dataToUse);
      console.log('📊 Type:', type);

      // Validation
      if (!type || dataToUse.length === 0) {
        throw new Error("Aucun concert ou artiste sélectionné. Veuillez retourner en arrière et sélectionner au moins un élément.");
      }

      setPlaylistName(pName);

      // --- 2. EXTRACTION DES MORCEAUX ---
      const isFutureMode = type === 'festival' || type === 'future';
      setLoadingMessage(
        isFutureMode 
          ? `Récupération du Top 10 pour ${dataToUse.length} artiste(s)...` 
          : "Extraction des setlists réelles..."
      );

      const finalTracks: Track[] = [];
      let processedCount = 0;

      for (const item of dataToUse) {
        processedCount++;
        const currentArtist = typeof item.artist === 'string' 
          ? item.artist 
          : item.artist?.name || "Artiste Inconnu";

        console.log(`🎵 Processing ${processedCount}/${dataToUse.length}: ${currentArtist}`);
        
        setLoadingMessage(`${processedCount}/${dataToUse.length} - ${currentArtist}...`);
        
        try {
          if (item.isFuture) {
            // FUTUR : Top 10 iTunes (avec recherche multi-pays si besoin)
            let top = await fetchItunes(currentArtist, 10);
            
            // Si on a moins de 7 résultats, chercher dans d'autres pays
            if (top.length < 7) {
              console.log(`  ⚠️ Seulement ${top.length} résultats US, recherche étendue...`);
              const additionalCountries = ['FR', 'GB', 'DE'];
              
              for (const country of additionalCountries) {
                if (top.length >= 10) break;
                
                const moreResults = await fetchItunesCountry(currentArtist, 10, country);
                // Ajouter seulement les nouveaux (éviter doublons)
                const existing = new Set(top.map(t => normalizeString(t.name)));
                const newTracks = moreResults.filter(t => !existing.has(normalizeString(t.name)));
                top = [...top, ...newTracks];
                
                if (newTracks.length > 0) {
                  console.log(`  ✅ +${newTracks.length} depuis ${country}`);
                }
              }
            }
            
            console.log(`  ✅ iTunes total: ${top.length} tracks`);
            finalTracks.push(...top);
          } else {
            // PASSÉ : Priorité Setlist.fm, fallback iTunes si vide
            const tracks = extractFromSetlist(item, currentArtist);
            console.log(`  ✅ Setlist: ${tracks.length} tracks`);
            
            if (tracks.length > 0) {
              finalTracks.push(...tracks);
            } else {
              // FALLBACK : Si pas de setlist, on récupère le Top 5 iTunes
              console.warn(`  ⚠️ Aucune setlist trouvée pour ${currentArtist}, fallback iTunes`);
              const fallback = await fetchItunes(currentArtist, 5);
              if (fallback.length > 0) {
                finalTracks.push(...fallback);
              }
            }
          }
        } catch (err) {
          console.error(`  ❌ Erreur pour ${currentArtist}:`, err);
          // Continue avec les autres artistes
        }
      }

      console.log('📝 Total tracks before dedup:', finalTracks.length);

      // --- 3. DÉDUPLICATION AMÉLIORÉE ---
      const uniqueTracks = deduplicateTracks(finalTracks);
      console.log('📝 Total tracks after dedup:', uniqueTracks.length);

      // --- 4. GESTION DU RÉSULTAT ---
      if (uniqueTracks.length === 0) {
        throw new Error(
          isFutureMode
            ? "Impossible de récupérer les morceaux pour cette sélection. Vérifiez les noms d'artistes."
            : "Aucune setlist complète n'a été trouvée. Essayez avec d'autres concerts ou utilisez le mode 'I'm Going' pour générer une playlist basée sur les titres populaires."
        );
      }

      setSongs(uniqueTracks);
      setMainArtist(uniqueTracks[0].artist);

      // Sauvegarder dans l'historique si utilisateur connecté
      if (user) {
        try {
          await saveToHistory(user.id, {
            name: pName,
            songs: uniqueTracks,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.error('Erreur sauvegarde historique:', err);
        }
      }

      // --- 5. NETTOYAGE DU LOCALSTORAGE (uniquement en cas de succès) ---
      if (type === 'festival') {
        localStorage.removeItem('selected_concerts');
        localStorage.removeItem('selected_upcoming');
      } else if (type === 'past') {
        localStorage.removeItem('selected_concerts');
      } else if (type === 'future') {
        localStorage.removeItem('selected_upcoming');
      }

      toast.success(`${uniqueTracks.length} morceaux prêts ! 🎉`);

    } catch (err: any) {
      console.error('❌ Erreur génération:', err);
      setErrorMsg(err.message || "Une erreur est survenue lors de la génération.");
      toast.error('Erreur de génération');
    } finally {
      setLoading(false);
    }
  };

  // --- FONCTIONS UTILITAIRES ---

  /**
   * Extraction robuste depuis les données Setlist.fm
   */
  const extractFromSetlist = (concert: ConcertData, defaultArtist: string): Track[] => {
    const result: Track[] = [];
    
    // Cas 1 : Tracks déjà formatées
    if (concert.tracks && Array.isArray(concert.tracks)) {
      return concert.tracks.filter(t => 
        t.name && 
        t.name.trim() !== '' && 
        t.name.toLowerCase() !== 'titre inconnu' &&
        t.name.toLowerCase() !== 'unknown'
      );
    }

    // Cas 2 : Structure brute de l'API Setlist.fm
    if (concert.sets?.set) {
      const sets = Array.isArray(concert.sets.set) 
        ? concert.sets.set 
        : [concert.sets.set];
      
      sets.forEach((s: any) => {
        if (!s.song) return;
        
        const songs = Array.isArray(s.song) ? s.song : [s.song];
        
        songs.forEach((song: any) => {
          // Filtrer les tapes, inconnus, etc.
          if (song.tape) return;
          if (!song.name || song.name.trim() === '') return;
          if (song.name.toLowerCase().includes('unknown')) return;
          
          result.push({
            artist: song.cover?.name || defaultArtist,
            name: song.name.trim()
          });
        });
      });
    }

    return result;
  };

  /**
   * Récupération depuis iTunes API avec filtrage strict
   */
  const fetchItunes = async (artist: string, limit: number = 10): Promise<Track[]> => {
    try {
      // On demande beaucoup plus de résultats pour les groupes moins connus
      const searchLimit = Math.max(limit * 5, 50);
      
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${searchLimit}&country=US`
      );
      
      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.warn(`Aucun résultat iTunes pour: ${artist}`);
        return [];
      }
      
      // Normalisation du nom d'artiste recherché
      const normalizedSearchArtist = normalizeString(artist);
      
      // Filtrage et scoring de pertinence
      const scoredResults = data.results
        .map((item: any) => {
          const normalizedArtistName = normalizeString(item.artistName);
          const normalizedTrackName = normalizeString(item.trackName);
          const normalizedCollectionName = normalizeString(item.collectionName || '');
          
          // Calcul du score de pertinence
          let score = 0;
          
          // CRITÈRE 1 : Match exact sur l'artiste (priorité maximale)
          if (normalizedArtistName === normalizedSearchArtist) {
            score += 100;
          }
          // CRITÈRE 2 : L'artiste recherché est dans le nom de l'artiste
          else if (normalizedArtistName.includes(normalizedSearchArtist)) {
            score += 50;
          }
          // CRITÈRE 3 : L'artiste recherché est au début du nom
          else if (normalizedArtistName.startsWith(normalizedSearchArtist)) {
            score += 40;
          }
          // CRITÈRE 4 (NOUVEAU) : Accepter si l'artiste est dans le nom mais avec une pénalité
          else if (normalizedSearchArtist.length > 4 && normalizedArtistName.includes(normalizedSearchArtist)) {
            score += 25; // Score plus faible mais accepté
          }
          // CRITÈRE BLOQUANT : Si l'artiste recherché n'est vraiment PAS dans artistName
          else {
            return { ...item, score: 0 };
          }
          
          // PÉNALITÉS MODÉRÉES : Réduire le score si l'artiste apparaît dans le titre/album
          // MAIS ne pas rejeter complètement (car parfois c'est légitime)
          if (normalizedTrackName.includes(normalizedSearchArtist) && 
              normalizedArtistName !== normalizedSearchArtist) {
            score -= 15; // Pénalité réduite de 20 à 15
          }
          
          if (normalizedCollectionName.includes(normalizedSearchArtist) && 
              !normalizedArtistName.includes(normalizedSearchArtist)) {
            score -= 10; // Pénalité réduite de 15 à 10
          }
          
          // BONUS : Préférer les morceaux avec un nom d'album
          if (item.collectionName && item.collectionName.length > 0) {
            score += 3;
          }
          
          // BONUS : Popularité (durée du morceau comme proxy)
          if (item.trackTimeMillis && item.trackTimeMillis > 60000) { // > 1 minute
            score += Math.min(item.trackTimeMillis / 100000, 5);
          }
          
          return { ...item, score };
        })
        // SEUIL AJUSTÉ : Au lieu de rejeter score = 0, on accepte score > 20
        // Cela permet d'avoir des résultats même pour les groupes moins connus
        .filter(item => item.score > 20)
        // Trier par score décroissant
        .sort((a, b) => b.score - a.score)
        // Prendre les meilleurs résultats
        .slice(0, limit);
      
      console.log(`  📊 iTunes ${artist}: ${data.results.length} bruts → ${scoredResults.length} filtrés (seuil: 20)`);
      
      // Si on a moins de 5 résultats, on réessaie avec un seuil encore plus bas
      if (scoredResults.length < 5 && data.results.length > limit) {
        console.log(`  ⚠️ Peu de résultats (${scoredResults.length}), assouplissement du filtre...`);
        
        const relaxedResults = data.results
          .map((item: any) => {
            const normalizedArtistName = normalizeString(item.artistName);
            let score = 0;
            
            // Critères encore plus souples
            if (normalizedArtistName.includes(normalizedSearchArtist)) {
              score += 50;
            } else if (normalizedSearchArtist.includes(normalizedArtistName)) {
              score += 30;
            } else {
              return { ...item, score: 0 };
            }
            
            return { ...item, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
        
        console.log(`  ✅ Assouplissement : ${relaxedResults.length} résultats trouvés`);
        
        return relaxedResults.map((item: any) => ({
          artist: item.artistName,
          name: item.trackName
        }));
      }
      
      if (scoredResults.length === 0) {
        console.warn(`  ⚠️ Aucun résultat pertinent après filtrage pour: ${artist}`);
      }
      
      return scoredResults.map((item: any) => ({
        artist: item.artistName,
        name: item.trackName
      }));
    } catch (err) {
      console.error(`Erreur iTunes pour ${artist}:`, err);
      return [];
    }
  };
  
  /**
   * Normalisation de chaîne pour comparaison
   */
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      // Supprimer les accents
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Supprimer les caractères spéciaux sauf espaces
      .replace(/[^\w\s]/g, '')
      // Réduire les espaces multiples
      .replace(/\s+/g, ' ');
  };

  /**
   * Recherche iTunes dans un pays spécifique
   */
  const fetchItunesCountry = async (
    artist: string, 
    limit: number = 10, 
    country: string = 'US'
  ): Promise<Track[]> => {
    try {
      const searchLimit = 30;
      
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${searchLimit}&country=${country}`
      );
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [];
      }
      
      const normalizedSearchArtist = normalizeString(artist);
      
      const scoredResults = data.results
        .map((item: any) => {
          const normalizedArtistName = normalizeString(item.artistName);
          let score = 0;
          
          if (normalizedArtistName === normalizedSearchArtist) {
            score += 100;
          } else if (normalizedArtistName.includes(normalizedSearchArtist)) {
            score += 50;
          } else {
            return { ...item, score: 0 };
          }
          
          return { ...item, score };
        })
        .filter(item => item.score > 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return scoredResults.map((item: any) => ({
        artist: item.artistName,
        name: item.trackName
      }));
    } catch (err) {
      console.error(`Erreur iTunes ${country} pour ${artist}:`, err);
      return [];
    }
  };

  /**
   * Déduplication intelligente (insensible à la casse, trim, normalisation)
   */
  const deduplicateTracks = (tracks: Track[]): Track[] => {
    const seen = new Set<string>();
    const unique: Track[] = [];

    tracks.forEach(track => {
      // Normalisation : lowercase + trim + suppression des caractères spéciaux
      const normalizedName = track.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, ''); // Supprime ponctuation
      
      const normalizedArtist = track.artist
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '');
      
      const key = `${normalizedArtist}|||${normalizedName}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(track);
      }
    });

    return unique;
  };

  /**
   * Copie dans le presse-papier
   */
  const handleCopy = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Liste copiée dans le presse-papier !");
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Erreur copie:', err);
      toast.error("Erreur lors de la copie");
    });
  };

  /**
   * Téléchargement en fichier texte
   */
  const handleDownload = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlistName.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Fichier téléchargé !");
  };

  // --- RENDU ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
        <p className="text-[#a0a0a0] font-mono uppercase tracking-widest text-xs">
          {loadingMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col font-sans">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-20">
        
        {errorMsg ? (
          <div className="bg-[#252525] border border-red-500/30 p-12 rounded-3xl text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black italic uppercase mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-8 font-medium leading-relaxed">{errorMsg}</p>
            <Button 
              onClick={() => navigate(-1)} 
              className="bg-white text-black hover:bg-[#4d94ff] hover:text-white rounded-none px-8 font-black italic uppercase transition-all shadow-[8px_8px_0px_rgba(255,255,255,0.1)]"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Retour à la sélection
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-8xl font-black italic uppercase mb-4 tracking-tighter leading-none">
                C'est prêt !
              </h1>
              <div className="inline-block bg-[#4d94ff] text-white px-6 py-2 text-xl md:text-2xl font-black italic uppercase skew-x-[-12deg] shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
                {songs.length} MORCEAUX
              </div>
              <p className="text-[#666] mt-6 font-bold uppercase tracking-widest text-sm">
                {playlistName}
              </p>
            </div>

            {/* ACTIONS */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Copier */}
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-10 flex flex-col justify-between shadow-xl group hover:border-[#4d94ff] transition-all">
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#00ff00] text-black w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic">
                      1
                    </span> 
                    Copier
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Copiez la liste pour l'importer dans Spotify ou Deezer via{' '}
                    <span className="text-white">TuneMyMusic</span>.
                  </p>
                </div>
                <Button 
                  onClick={handleCopy} 
                  className={`w-full h-24 text-2xl font-black italic uppercase transition-all rounded-none shadow-[8px_8px_0px_rgba(0,0,0,0.3)] ${
                    copied 
                      ? 'bg-[#00ff00] text-black' 
                      : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 w-6 h-6" /> Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 w-6 h-6" /> Copier la liste
                    </>
                  )}
                </Button>
              </div>

              {/* Importer */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-10 flex flex-col justify-between shadow-xl group hover:border-white transition-all">
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#4d94ff] text-white w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic">
                      2
                    </span> 
                    Importer
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Allez sur TuneMyMusic, choisissez{' '}
                    <span className="text-white">"Texte"</span> comme source, et collez votre liste.
                  </p>
                </div>
                <a 
                  href="https://www.tunemymusic.com/fr/transfer" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-2 w-full py-8 bg-white text-black font-black italic uppercase transition-all hover:bg-[#4d94ff] hover:text-white text-xl shadow-[8px_8px_0px_rgba(77,148,255,0.2)]"
                >
                  Ouvrir TuneMyMusic
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* LISTE DES MORCEAUX (optionnel - déplier) */}
            <details className="bg-[#252525] border border-[#333] rounded-xl overflow-hidden mb-8">
              <summary className="cursor-pointer p-6 font-black uppercase text-lg hover:bg-[#2d2d2d] transition-colors flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Music className="w-5 h-5" /> Voir la liste complète
                </span>
                <span className="text-[#666] text-sm">{songs.length} titres</span>
              </summary>
              <div className="p-6 pt-0 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {songs.map((song, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded bg-[#1a1a1a] hover:bg-[#2d2d2d] transition-colors"
                    >
                      <span className="text-[#666] font-mono text-sm min-w-[2rem]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{song.name}</p>
                        <p className="text-sm text-[#a0a0a0] truncate">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            {/* BOUTON TÉLÉCHARGER */}
            <div className="text-center">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-[#333] text-white hover:bg-[#2d2d2d]"
              >
                <Download className="mr-2 w-4 h-4" />
                Télécharger en .txt
              </Button>
            </div>

            {/* PUB (si pas premium) */}
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
