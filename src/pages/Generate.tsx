import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription, UserSubscription } from '@/lib/subscription';
import { Music, Loader2, Play, ArrowRight, Lock, Crown, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// --- CONSTANTES ---
const SPOTIFY_CLIENT_ID = "927dd1fd048148d3b71cb0b9e109af6e";
const REDIRECT_URI = "https://festivalrewind.vercel.app/spotify-callback"; 
// Assurez-vous que cette URL exacte est whitelistée dans votre dashboard Spotify Developer

interface TrackInfo {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  spotifyUri?: string;
  year?: string;
}

interface ArtistWithTracks {
  artistName: string;
  artistId: string;
  artistImage?: string;
  tracks: {
    id: string;
    name: string;
    uri: string;
    album: string;
    albumImage?: string;
    duration: number;
    preview_url?: string;
  }[];
}

export default function Generate() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const isUpcomingMode = mode === 'upcoming';
  
  const { user } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [tracksWithInfo, setTracksWithInfo] = useState<TrackInfo[]>([]);
  
  // États pour le mode "upcoming"
  const [artistsWithTracks, setArtistsWithTracks] = useState<ArtistWithTracks[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  // On retire exportProgress car la boucle est trop rapide pour l'afficher ou doit être async
  const [showPreview, setShowPreview] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const [playlistName, setPlaylistName] = useState(
    isUpcomingMode 
      ? `Upcoming - ${new Date().getFullYear()}`
      : `Setlist Live - ${new Date().getFullYear()}`
  );

  // Charger les infos d'abonnement
  useEffect(() => {
    let mounted = true;
    if (user) {
      getUserSubscription(user.id).then((sub) => {
        if (mounted) {
          setSubscription(sub);
          setLoadingSubscription(false);
        }
      });
    } else {
      setLoadingSubscription(false);
    }
    return () => { mounted = false; };
  }, [user]);

  // Étape 1 : Récupérer les chansons
  useEffect(() => {
    // Si on exporte, on ne recharge pas les données
    if (isExporting) return;
    
    if (isUpcomingMode) {
      fetchTopTracks();
    } else {
      const fetchSongs = async () => {
        setLoading(true);
        
        const savedConcerts = localStorage.getItem('selected_concerts');
        if (!savedConcerts) {
          // Si pas de concerts, on ne fait rien ou on notifie
          setLoading(false);
          return;
        }
        
        const selectedConcerts = JSON.parse(savedConcerts);
        
        if (selectedConcerts.length === 0) {
          toast.error('Aucun concert sélectionné');
          setLoading(false);
          return;
        }
        
        const all: any[] = [];
        // Utilisation de Promise.all pour accélérer si possible, ou boucle séquentielle
        for (const c of selectedConcerts) {
          try {
            const res = await fetch(`/api/search?action=songs&setlistId=${c.id}`);
            const data = await res.json();
            if (data.songs) {
              data.songs.forEach((s: string) => all.push({ 
                artist: c.artist || data.artist, 
                title: s 
              }));
            }
          } catch (error) {
            console.error(`Erreur pour ${c.artist}:`, error);
          }
        }
        
        setSongs(all);
        setLoading(false);
      };
      
      fetchSongs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpcomingMode]); // On retire isExporting des dépendances pour éviter les boucles

  const fetchTopTracks = async () => {
    setLoading(true);
    try {
      const selected = localStorage.getItem('selected_upcoming');
      if (!selected) {
        toast.error('Aucun artiste sélectionné');
        setLoading(false);
        return;
      }

      const artists = JSON.parse(selected);
      const artistNames = artists.map((a: any) => a.artist);

      const response = await fetch('/api/top-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artists: artistNames })
      });

      if (!response.ok) throw new Error('Erreur API');

      const data = await response.json();
      setArtistsWithTracks(data.artists || []);
      
      const allArtistIds = (data.artists || []).map((a: ArtistWithTracks) => a.artistId);
      setSelectedArtists(new Set(allArtistIds));
      
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      toast.error('Erreur lors du chargement des tracks');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Prévisualiser (Correction du plantage de boucle)
  const fetchDetailedInfo = () => {
    if (tracksWithInfo.length > 0) {
      setShowPreview(true);
      return;
    }

    setSearching(true);

    // Faire le traitement de manière asynchrone pour ne pas bloquer l'UI
    setTimeout(() => {
      try {
        // Transformation simple sans appel API lourd ici (sinon utiliser Promise.all)
        const detailedTracks: TrackInfo[] = songs.map(song => ({
            title: song.title,
            artist: song.artist,
        }));
        
        setTracksWithInfo(detailedTracks);
        setShowPreview(true);
      } catch (err) {
        console.error('Erreur lors de la prévisualisation:', err);
        toast.error("Erreur lors de la préparation des titres");
      } finally {
        setSearching(false);
      }
    }, 100);
  };

  // Étape 3 : Export vers Spotify (Unifié et Corrigé)
  const handleSpotifyExport = () => {
    console.log('🚀 Export Spotify initié');
    
    if (!user) {
      toast.error('Veuillez vous connecter pour exporter');
      return;
    }
    
    // On verrouille l'état pour éviter les re-renders intempestifs
    setIsExporting(true);
    
    // Préparation des données à sauvegarder
    let tracksToExport: any[] = [];

    if (isUpcomingMode) {
      tracksToExport = artistsWithTracks
        .filter(artist => selectedArtists.has(artist.artistId))
        .flatMap(artist => artist.tracks)
        .map(track => ({ title: track.name, artist: '', uri: track.uri }));
    } else {
      tracksToExport = songs; // { artist, title }
    }

    if (tracksToExport.length === 0) {
      toast.error("Aucune chanson à exporter");
      setIsExporting(false);
      return;
    }

    // Sauvegarde dans localStorage
    try {
      localStorage.setItem('pending_songs', JSON.stringify(tracksToExport));
      localStorage.setItem('playlist_name', playlistName || 'Setlist Live');
    } catch (e) {
      console.error("Quota localStorage dépassé ?", e);
      toast.error("Trop de chansons pour le stockage local. Essayez moins de concerts.");
      setIsExporting(false);
      return;
    }
    
    // Construction propre de l'URL Spotify
    const scope = "playlist-modify-public playlist-modify-private";
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: scope,
      show_dialog: "true" // Force l'utilisateur à approuver si besoin
    });

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    
    console.log('🔗 Redirection vers:', spotifyAuthUrl);
    
    // Une seule méthode de redirection fiable
    window.location.href = spotifyAuthUrl;
  };

  const toggleArtist = (artistId: string) => {
    const newSelection = new Set(selectedArtists);
    if (newSelection.has(artistId)) {
      newSelection.delete(artistId);
    } else {
      newSelection.add(artistId);
    }
    setSelectedArtists(newSelection);
  };

  const totalSelectedTracks = artistsWithTracks
    .filter(artist => selectedArtists.has(artist.artistId))
    .reduce((sum, artist) => sum + artist.tracks.length, 0);

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl">
            {isUpcomingMode ? 'Récupération des top tracks...' : 'Récupération des setlists...'}
          </p>
        </div>
      </div>
    );
  }

  // VUE UPCOMING
  if (isUpcomingMode) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 px-4">
        <Header />
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 italic">
              <span className="text-gradient-fire">{totalSelectedTracks}</span> TITRES
            </h1>
            <p className="text-gray-400">
              Top tracks de {selectedArtists.size} artiste{selectedArtists.size > 1 ? 's' : ''}
            </p>
          </div>

          {!user && (
            <Alert className="max-w-xl mx-auto mb-6 bg-zinc-900 border-primary/30">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Connectez-vous</strong> pour exporter votre playlist vers Spotify.
                <Link to="/auth" className="ml-2 underline text-primary">Se connecter</Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="max-w-xl mx-auto mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">Nom de la playlist</label>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-4 mb-8">
            {artistsWithTracks.map((artist) => {
              const isSelected = selectedArtists.has(artist.artistId);
              return (
                <div
                  key={artist.artistId}
                  onClick={() => toggleArtist(artist.artistId)}
                  className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-gradient-fire' : 'bg-zinc-800'
                    }`}>
                      {artist.artistImage ? (
                        <img src={artist.artistImage} alt={artist.artistName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Music className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{artist.artistName}</h3>
                      <p className="text-sm text-gray-400">{artist.tracks.length} morceaux</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="max-w-xl mx-auto pb-10">
            <Button 
              onClick={handleSpotifyExport}
              disabled={selectedArtists.size === 0 || isExporting}
              variant="fire"
              className="w-full h-16 text-xl font-bold"
            >
              {!user && <Lock className="mr-3" />}
              {isExporting ? <Loader2 className="mr-3 animate-spin" /> : <Music className="mr-3" />}
              {!user ? 'Se connecter pour exporter' : (isExporting ? 'Redirection Spotify...' : `Créer la playlist`)}
              {user && !isExporting && <ArrowRight className="ml-3" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // VUE NORMALE (Setlist)
  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <Header />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 italic">
            <span className="text-gradient-fire">{songs.length}</span> TITRES
          </h1>
          <p className="text-gray-400">
            Généré depuis vos setlists sélectionnées
          </p>
        </div>

        {!user && (
          <Alert className="max-w-xl mx-auto mb-6 bg-zinc-900 border-primary/30">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Connectez-vous</strong> pour exporter votre playlist vers Spotify.
              <Link to="/auth" className="ml-2 underline text-primary">Se connecter</Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Input Nom */}
        <div className="max-w-xl mx-auto mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">Nom de la playlist</label>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
        </div>

        {!showPreview ? (
          <div className="max-w-xl mx-auto space-y-4">
            <Button 
              onClick={fetchDetailedInfo} 
              disabled={searching || songs.length === 0}
              variant="outline"
              className="w-full h-16 text-xl font-bold"
            >
              {searching ? (
                <>
                  <Loader2 className="mr-3 animate-spin" />
                  Préparation des titres...
                </>
              ) : (
                <>
                  <Play className="mr-3" />
                  Prévisualiser les morceaux
                </>
              )}
            </Button>

            {/* Suppression du bouton de test rouge qui était confus */}
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Music className="text-primary" />
                Prévisualisation ({tracksWithInfo.length} morceaux)
              </h2>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {tracksWithInfo.map((track, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{track.title}</p>
                      <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-xl mx-auto pb-10">
              <Button 
                onClick={handleSpotifyExport}
                disabled={isExporting}
                variant="fire"
                className="w-full h-16 text-xl font-bold"
              >
                {isExporting ? <Loader2 className="mr-3 animate-spin" /> : <Music className="mr-3" />}
                {isExporting ? 'Redirection Spotify...' : 'Exporter sur Spotify'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
