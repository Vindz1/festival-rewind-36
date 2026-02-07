import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription, UserSubscription } from '@/lib/subscription';
import { Music, Loader2, Play, ArrowRight, Lock, Crown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

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
  const [exportProgress, setExportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // NOUVEAU FLAG
  const [playlistName, setPlaylistName] = useState(
    isUpcomingMode 
      ? `Upcoming - ${new Date().getFullYear()}`
      : `Setlist Live - ${new Date().getFullYear()}`
  );

  // Charger les infos d'abonnement
  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then((sub) => {
        setSubscription(sub);
        setLoadingSubscription(false);
      });
    } else {
      setLoadingSubscription(false);
    }
  }, [user]);

  const canExport = user && (loadingSubscription || subscription?.can_export);

  // Étape 1 : Récupérer les chansons depuis setlist.fm OU top tracks Spotify
  useEffect(() => {
    // Ne pas charger si on est en train d'exporter
    if (isExporting) {
      console.log('⏸️ Export en cours, skip du chargement');
      return;
    }
    
    if (isUpcomingMode) {
      // Mode upcoming: charger les top tracks
      fetchTopTracks();
    } else {
      // Mode normal: charger les setlists depuis localStorage
      const fetchSongs = async () => {
        setLoading(true);
        
        // Charger directement depuis localStorage
        const savedConcerts = localStorage.getItem('selected_concerts');
        if (!savedConcerts) {
          toast.error('Aucun concert sélectionné');
          setLoading(false);
          return;
        }
        
        const selectedConcerts = JSON.parse(savedConcerts);
        console.log('📋 Concerts chargés depuis localStorage:', selectedConcerts);
        
        if (selectedConcerts.length === 0) {
          toast.error('Aucun concert sélectionné');
          setLoading(false);
          return;
        }
        
        const all: any[] = [];
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
        
        console.log('🎵 Total songs:', all.length);
        setSongs(all);
        setLoading(false);
      };
      
      fetchSongs();
    }
  }, [isUpcomingMode, isExporting]); // Ajouter isExporting

  // Fonction pour charger les top tracks (mode upcoming)
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

      console.log('Fetching top tracks for:', artistNames);

      const response = await fetch('/api/top-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artists: artistNames })
      });

      if (!response.ok) throw new Error('Erreur API');

      const data = await response.json();
      console.log('Top tracks received:', data);

      setArtistsWithTracks(data.artists || []);
      
      // Sélectionner tous les artistes par défaut
      const allArtistIds = (data.artists || []).map((a: ArtistWithTracks) => a.artistId);
      setSelectedArtists(new Set(allArtistIds));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      toast.error('Erreur lors du chargement des tracks');
      setLoading(false);
    }
  };

  // Étape 2 : Prévisualiser
  const fetchDetailedInfo = async () => {
    if (tracksWithInfo.length > 0) {
      setShowPreview(true);
      return;
    }

    setSearching(true);
    const detailedTracks: TrackInfo[] = [];

    try {
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        setExportProgress(Math.round(((i + 1) / songs.length) * 100));
        detailedTracks.push({
          title: song.title,
          artist: song.artist,
        });
      }
      setTracksWithInfo(detailedTracks);
      setShowPreview(true);
    } catch (err) {
      console.error('Erreur lors de la prévisualisation:', err);
    } finally {
      setSearching(false);
      setExportProgress(0);
    }
  };

  // Wrapper qui force l'exécution
  const forceExport = () => {
    console.log('🔥 FORCE EXPORT APPELÉ');
    
    // BLOQUER LES USEEFFECT
    setIsExporting(true);
    console.log('🔒 isExporting = true (bloque useEffect)');
    
    if (!user) {
      alert('Connectez-vous d\'abord !');
      setIsExporting(false);
      return;
    }
    
    const client_id = "927dd1fd048148d3b71cb0b9e109af6e";
    const redirectUri = "https://festivalrewind.vercel.app/spotify-callback";
    
    // Sauvegarder les songs
    if (isUpcomingMode) {
      const selectedTracks = artistsWithTracks
        .filter(artist => selectedArtists.has(artist.artistId))
        .flatMap(artist => artist.tracks)
        .map(track => ({ title: track.name, artist: '', uri: track.uri }));
      console.log('💾 Sauvegarde tracks:', selectedTracks.length);
      localStorage.setItem('pending_songs', JSON.stringify(selectedTracks));
    } else {
      console.log('💾 Sauvegarde songs:', songs.length);
      localStorage.setItem('pending_songs', JSON.stringify(songs));
    }
    
    localStorage.setItem('playlist_name', playlistName || 'Setlist Live');
    
    // Construction de l'URL
    const url = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=playlist-modify-public`;
    console.log('🚀 REDIRECTION VERS:', url);
    
    // TRIPLE MÉTHODE pour forcer la navigation
    // Méthode 1: Créer un lien et le cliquer
    const link = document.createElement('a');
    link.href = url;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Méthode 2: window.location (backup)
    setTimeout(() => {
      console.log('⚡ Backup: window.location.assign');
      window.location.assign(url);
    }, 50);
    
    // Méthode 3: window.open (dernier recours)
    setTimeout(() => {
      console.log('⚡ Last resort: window.open');
      window.open(url, '_self');
    }, 100);
  };

  // Étape 3 : Exporter vers Spotify
  const handleSpotifyExport = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('🚀 handleSpotifyExport appelé');
    
    // Vérification simple : utilisateur connecté
    if (!user) {
      toast.error('Veuillez vous connecter');
      return;
    }
    
    console.log('✅ User connecté, export en cours...');
    
    const client_id = "927dd1fd048148d3b71cb0b9e109af6e";
    const redirectUri = "https://festivalrewind.vercel.app/spotify-callback";
    
    if (isUpcomingMode) {
      // Mode upcoming: envoyer les URIs des tracks sélectionnées
      const selectedTracks = artistsWithTracks
        .filter(artist => selectedArtists.has(artist.artistId))
        .flatMap(artist => artist.tracks)
        .map(track => ({ title: track.name, artist: '', uri: track.uri }));
      
      console.log('📦 Tracks upcoming à envoyer:', selectedTracks.length);
      localStorage.setItem('pending_songs', JSON.stringify(selectedTracks));
    } else {
      // Mode normal: envoyer les songs depuis setlists
      console.log('📦 Songs setlist à envoyer:', songs.length);
      localStorage.setItem('pending_songs', JSON.stringify(songs));
    }
    
    localStorage.setItem('playlist_name', playlistName || `Setlist Live - ${new Date().getFullYear()}`);
    
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=playlist-modify-public`;
    console.log('🔗 Redirection vers:', spotifyAuthUrl);
    
    window.location.href = spotifyAuthUrl;
  };

  // Toggle artist selection (upcoming mode)
  const toggleArtist = (artistId: string) => {
    const newSelection = new Set(selectedArtists);
    if (newSelection.has(artistId)) {
      newSelection.delete(artistId);
    } else {
      newSelection.add(artistId);
    }
    setSelectedArtists(newSelection);
  };

  // Calculate total tracks (upcoming mode)
  const totalSelectedTracks = artistsWithTracks
    .filter(artist => selectedArtists.has(artist.artistId))
    .reduce((sum, artist) => sum + artist.tracks.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-[#4d94ff]" />
          <p className="text-xl">
            {isUpcomingMode ? 'Récupération des top tracks...' : 'Récupération des setlists...'}
          </p>
        </div>
      </div>
    );
  }

  // Mode upcoming: afficher l'interface différente
  if (isUpcomingMode) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white pt-20 px-4">
        <Header />
        
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 italic">
              <span className="text-gradient-fire">{totalSelectedTracks}</span> TITRES
            </h1>
            <p className="text-[#a0a0a0]">
              Top tracks de {selectedArtists.size} artiste{selectedArtists.size > 1 ? 's' : ''}
            </p>
          </div>

          {/* Auth warnings */}
          {!user && (
            <Alert className="max-w-xl mx-auto mb-6 bg-[#2d2d2d] border-primary/30">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Connectez-vous</strong> pour exporter votre playlist vers Spotify.
                <Link to="/auth" className="ml-2 underline text-[#4d94ff]">
                  Se connecter
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {user && subscription?.subscription_type === 'admin' && (
            <Alert className="max-w-xl mx-auto mb-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/50">
              <Crown className="h-4 w-4 text-purple-400" />
              <AlertDescription>
                <strong className="text-purple-400">✨ Admin</strong> : Exports illimités !
              </AlertDescription>
            </Alert>
          )}

          {/* Playlist name input */}
          <div className="max-w-xl mx-auto mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Nom de la playlist
            </label>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full px-4 py-3 bg-[#2d2d2d] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Upcoming Concerts 2026"
            />
          </div>

          {/* Artists list */}
          <div className="space-y-4 mb-8">
            {artistsWithTracks.map((artist) => {
              const isSelected = selectedArtists.has(artist.artistId);
              return (
                <div
                  key={artist.artistId}
                  onClick={() => toggleArtist(artist.artistId)}
                  className={`bg-[#2d2d2d] border rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-[#404040] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-gradient-fire' : 'bg-[#3d3d3d]'
                    }`}>
                      {artist.artistImage ? (
                        <img src={artist.artistImage} alt={artist.artistName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Music className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{artist.artistName}</h3>
                      <p className="text-sm text-[#a0a0a0]">{artist.tracks.length} morceaux</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-[#4d94ff]" />}
                  </div>

                  {/* Track list preview (if selected) */}
                  {isSelected && (
                    <div className="mt-4 space-y-2">
                      {artist.tracks.slice(0, 5).map((track, idx) => (
                        <div key={track.id} className="flex items-center gap-2 text-sm text-[#a0a0a0] pl-2">
                          <span className="text-gray-600">#{idx + 1}</span>
                          <span className="flex-1 truncate">{track.name}</span>
                        </div>
                      ))}
                      {artist.tracks.length > 5 && (
                        <p className="text-xs text-gray-500 pl-2">
                          +{artist.tracks.length - 5} autres morceaux
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Export button */}
          <div className="max-w-xl mx-auto">
            <Button 
              onClick={forceExport}
              disabled={selectedArtists.size === 0}
              variant="fire"
              className="w-full h-16 text-xl font-bold"
            >
              {!user && <Lock className="mr-3" />}
              <Music className="mr-3" />
              {!user ? 'Se connecter pour exporter' : `Créer la playlist (${totalSelectedTracks} titres)`}
              {user && <ArrowRight className="ml-3" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-20 px-4">
      <Header />
      
      <div className="max-w-4xl mx-auto">
        {/* Header avec stats */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 italic">
            <span className="text-gradient-fire">{songs.length}</span> TITRES
          </h1>
          <p className="text-[#a0a0a0]">
            Depuis {(() => {
              const saved = localStorage.getItem('selected_concerts');
              const count = saved ? JSON.parse(saved).length : 0;
              return `${count} concert${count > 1 ? 's' : ''}`;
            })()}
          </p>
        </div>

        {/* Auth warnings */}
        {!user && (
          <Alert className="max-w-xl mx-auto mb-6 bg-[#2d2d2d] border-primary/30">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Connectez-vous</strong> pour exporter votre playlist vers Spotify.
              <Link to="/auth" className="ml-2 underline text-[#4d94ff]">
                Se connecter
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {user && subscription?.subscription_type === 'admin' && (
          <Alert className="max-w-xl mx-auto mb-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/50">
            <Crown className="h-4 w-4 text-purple-400" />
            <AlertDescription>
              <strong className="text-purple-400">✨ Admin</strong> : Exports illimités !
            </AlertDescription>
          </Alert>
        )}

        {user && subscription?.subscription_type === 'free' && (
          <Alert className="max-w-xl mx-auto mb-6 bg-[#2d2d2d] border-yellow-500/30">
            <Crown className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <strong>Offre gratuite</strong> : {subscription.exports_this_year}/2 playlists utilisées cette année.
              {!subscription.can_export && (
                <span className="block mt-1 text-yellow-500">
                  Limite atteinte. Passez à Premium pour des exports illimités !
                </span>
              )}
              {subscription.can_export && subscription.remaining_exports !== undefined && (
                <span className="block mt-1 text-[#a0a0a0]">
                  Il vous reste {subscription.remaining_exports} export{subscription.remaining_exports > 1 ? 's' : ''}.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {user && subscription?.subscription_type === 'premium' && (
          <Alert className="max-w-xl mx-auto mb-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/50">
            <Crown className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <strong className="text-yellow-500">Premium</strong> : Exports illimités ! 🎉
            </AlertDescription>
          </Alert>
        )}

        {/* Playlist name input */}
        <div className="max-w-xl mx-auto mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Nom de la playlist
          </label>
          <input
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="w-full px-4 py-3 bg-[#2d2d2d] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ma Time Capsule Live"
          />
        </div>

        {/* Boutons d'action */}
        {!showPreview ? (
          <div className="max-w-xl mx-auto space-y-4">
            {/* Input nom de playlist */}
            <div className="bg-[#2d2d2d] rounded-xl p-4 border border-[#404040]">
              <label htmlFor="playlistName" className="block text-sm font-medium text-gray-300 mb-2">
                Nom de la playlist
              </label>
              <input
                id="playlistName"
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Ma Time Capsule Live"
                className="w-full bg-[#3d3d3d] border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ce nom apparaîtra sur votre Spotify
              </p>
            </div>

            <Button 
              onClick={fetchDetailedInfo} 
              disabled={searching}
              variant="outline"
              className="w-full h-16 text-xl font-bold"
            >
              {searching ? (
                <>
                  <Loader2 className="mr-3 animate-spin" />
                  Chargement... {exportProgress}%
                </>
              ) : (
                <>
                  <Play className="mr-3" />
                  Prévisualiser les morceaux
                </>
              )}
            </Button>

            {searching && (
              <Progress value={exportProgress} className="w-full" />
            )}

            <button
              onClick={forceExport}
              type="button"
              style={{
                width: '100%',
                height: '64px',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: '#ff6b35',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🎵 Exporter vers Spotify (TEST)
            </button>

            {user && subscription?.subscription_type === 'free' && !subscription.can_export && (
              <div className="text-center">
                <Button variant="outline" className="gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Passer à Premium
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Liste de prévisualisation */}
            <div className="bg-[#2d2d2d] rounded-3xl border border-[#404040] p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Music className="text-[#4d94ff]" />
                Prévisualisation ({tracksWithInfo.length} morceaux)
              </h2>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {tracksWithInfo.map((track, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-3 bg-[#3d3d3d]/50 rounded-lg hover:bg-[#3d3d3d] transition-colors"
                  >
                    <div className="w-12 h-12 bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center">
                      {track.albumArt ? (
                        <img 
                          src={track.albumArt} 
                          alt={track.album}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Music className="w-6 h-6 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{track.title}</p>
                      <p className="text-sm text-[#a0a0a0] truncate">
                        {track.artist}
                        {track.album && <> • {track.album}</>}
                        {track.year && <> ({track.year})</>}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton export */}
            <div className="max-w-xl mx-auto space-y-4">
              <Button 
                onClick={forceExport}
                variant="fire"
                className="w-full h-16 text-xl font-bold"
              >
                {!user && <Lock className="mr-3" />}
                <Music className="mr-3" />
                {!user ? 'Se connecter pour exporter' : 'Créer la playlist sur Spotify'}
                {user && <ArrowRight className="ml-3" />}
              </Button>

              {user && subscription?.subscription_type === 'free' && !subscription.can_export && (
                <div className="text-center">
                  <Button variant="outline" className="gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Passer à Premium pour plus d'exports
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
