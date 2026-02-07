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
  const [isExporting, setIsExporting] = useState(false);
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
    if (isExporting) {
      console.log('⏸️ Export en cours, skip du chargement');
      return;
    }
    
    if (isUpcomingMode) {
      fetchTopTracks();
    } else {
      const fetchSongs = async () => {
        setLoading(true);
        
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
  }, [isUpcomingMode, isExporting]);

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
      
      const allArtistIds = (data.artists || []).map((a: ArtistWithTracks) => a.artistId);
      setSelectedArtists(new Set(allArtistIds));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      toast.error('Erreur lors du chargement des tracks');
      setLoading(false);
    }
  };

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

  const forceExport = () => {
    console.log('🔥 FORCE EXPORT APPELÉ');
    setIsExporting(true);
    console.log('🔒 isExporting = true (bloque useEffect)');
    
    if (!user) {
      alert('Connectez-vous d\'abord !');
      setIsExporting(false);
      return;
    }
    
    const client_id = "927dd1fd048148d3b71cb0b9e109af6e";
    const redirectUri = "https://festivalrewind.vercel.app/spotify-callback";
    
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
    
    const url = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=playlist-modify-public%20playlist-modify-private`;
    console.log('🚀 REDIRECTION VERS:', url);
    
    const link = document.createElement('a');
    link.href = url;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // --- RENDU : LOADER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-[#4d94ff]" />
          <p className="text-xl text-[#a0a0a0]">
            {isUpcomingMode ? 'Récupération des top tracks...' : 'Récupération des setlists...'}
          </p>
        </div>
      </div>
    );
  }

  // --- RENDU : MODE UPCOMING ---
  if (isUpcomingMode) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 px-4 pb-12">
        <Header />
        
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 italic">
              <span className="text-[#4d94ff]">{totalSelectedTracks}</span> TITRES
            </h1>
            <p className="text-[#a0a0a0]">
              Top tracks de {selectedArtists.size} artiste{selectedArtists.size > 1 ? 's' : ''}
            </p>
          </div>

          {/* Auth warnings */}
          {!user && (
            <Alert className="max-w-xl mx-auto mb-6 bg-[#2d2d2d] border-[#404040]">
              <Lock className="h-4 w-4 text-[#a0a0a0]" />
              <AlertDescription className="text-gray-300">
                <strong>Connectez-vous</strong> pour exporter votre playlist vers Spotify.
                <Link to="/auth" className="ml-2 underline text-[#4d94ff]">
                  Se connecter
                </Link>
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
              className="w-full px-4 py-3 bg-[#2d2d2d] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4d94ff] focus:border-transparent placeholder-gray-600"
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
                    isSelected ? 'border-[#4d94ff] bg-[#4d94ff]/10' : 'border-[#404040] hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#4d94ff]' : 'bg-[#3d3d3d]'
                    }`}>
                      {artist.artistImage ? (
                        <img src={artist.artistImage} alt={artist.artistName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Music className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{artist.artistName}</h3>
                      <p className="text-sm text-[#a0a0a0]">{artist.tracks.length} morceaux</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-[#4d94ff]" />}
                  </div>

                  {/* Track list preview */}
                  {isSelected && (
                    <div className="mt-4 space-y-2 border-t border-[#404040]/50 pt-3">
                      {artist.tracks.slice(0, 5).map((track, idx) => (
                        <div key={track.id} className="flex items-center gap-2 text-sm text-[#a0a0a0] pl-2">
                          <span className="text-gray-600 font-mono w-4">#{idx + 1}</span>
                          <span className="flex-1 truncate">{track.name}</span>
                        </div>
                      ))}
                      {artist.tracks.length > 5 && (
                        <p className="text-xs text-[#4d94ff] pl-2 pt-1">
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
          <div className="max-w-xl mx-auto sticky bottom-6 z-10">
            <div className="absolute inset-0 bg-[#4d94ff]/20 blur-xl rounded-full"></div>
            <Button 
              onClick={forceExport}
              disabled={selectedArtists.size === 0}
              className="relative w-full h-16 text-xl font-bold bg-[#4d94ff] hover:bg-[#6ba6ff] text-white shadow-xl rounded-xl transition-all hover:scale-[1.02]"
            >
              {!user && <Lock className="mr-3 w-5 h-5" />}
              <Music className="mr-3 w-5 h-5" />
              {!user ? 'Se connecter pour exporter' : `Créer la playlist (${totalSelectedTracks} titres)`}
              {user && <ArrowRight className="ml-3 w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDU : MODE SETLIST (NORMAL) ---
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 px-4 pb-12">
      <Header />
      
      <div className="max-w-4xl mx-auto">
        {/* Header avec stats */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 italic">
            <span className="text-[#4d94ff]">{songs.length}</span> TITRES
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
          <Alert className="max-w-xl mx-auto mb-6 bg-[#2d2d2d] border-[#404040]">
            <Lock className="h-4 w-4 text-[#a0a0a0]" />
            <AlertDescription className="text-gray-300">
              <strong>Connectez-vous</strong> pour exporter votre playlist vers Spotify.
              <Link to="/auth" className="ml-2 underline text-[#4d94ff]">
                Se connecter
              </Link>
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
            className="w-full px-4 py-3 bg-[#2d2d2d] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4d94ff] focus:border-transparent placeholder-gray-600"
            placeholder="Ma Time Capsule Live"
          />
        </div>

        {/* Boutons d'action */}
        {!showPreview ? (
          <div className="max-w-xl mx-auto space-y-4">
            {/* Input nom de playlist (Redondant mais gardé si vous le souhaitez, sinon on peut l'enlever) */}
            
            <Button 
              onClick={fetchDetailedInfo} 
              disabled={searching}
              variant="outline"
              className="w-full h-16 text-xl font-bold border-[#4d94ff] text-[#4d94ff] hover:bg-[#4d94ff] hover:text-white transition-all bg-transparent"
            >
              {searching ? (
                <>
                  <Loader2 className="mr-3 animate-spin" />
                  Chargement... {exportProgress}%
                </>
              ) : (
                <>
                  <Play className="mr-3 fill-current" />
                  Prévisualiser les morceaux
                </>
              )}
            </Button>

            {searching && (
              <Progress value={exportProgress} className="w-full h-2 bg-[#2d2d2d] [&>div]:bg-[#4d94ff]" />
            )}

            <Button
              onClick={forceExport}
              className="w-full h-16 text-xl font-bold bg-[#4d94ff] hover:bg-[#6ba6ff] text-white rounded-lg shadow-lg hover:scale-[1.02] transition-transform"
            >
              {!user && <Lock className="mr-2 w-5 h-5" />}
              🎵 Exporter vers Spotify
            </Button>

            {user && subscription?.subscription_type === 'free' && !subscription.can_export && (
              <div className="text-center mt-4">
                <Button variant="ghost" className="gap-2 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10">
                  <Crown className="w-4 h-4" />
                  Passer à Premium
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Liste de prévisualisation */}
            <div className="bg-[#2d2d2d] rounded-3xl border border-[#404040] p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                <Music className="text-[#4d94ff]" />
                Prévisualisation ({tracksWithInfo.length} morceaux)
              </h2>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {tracksWithInfo.map((track, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-3 bg-[#3d3d3d]/50 rounded-lg hover:bg-[#3d3d3d] transition-colors border border-transparent hover:border-[#404040]"
                  >
                    <div className="w-12 h-12 bg-[#252525] rounded flex-shrink-0 flex items-center justify-center border border-[#404040]">
                      {track.albumArt ? (
                        <img 
                          src={track.albumArt} 
                          alt={track.album}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Music className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{track.title}</p>
                      <p className="text-sm text-[#a0a0a0] truncate">
                        {track.artist}
                        {track.album && <span className="hidden sm:inline"> • {track.album}</span>}
                        {track.year && <span className="hidden sm:inline"> ({track.year})</span>}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 font-mono w-8 text-right">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton export final */}
            <div className="max-w-xl mx-auto space-y-4 sticky bottom-6 z-10">
              <div className="absolute inset-0 bg-[#4d94ff]/20 blur-xl rounded-full"></div>
              <Button 
                onClick={forceExport}
                className="relative w-full h-16 text-xl font-bold bg-[#4d94ff] hover:bg-[#6ba6ff] text-white shadow-xl rounded-xl transition-all hover:scale-[1.02]"
              >
                {!user && <Lock className="mr-3 w-5 h-5" />}
                <Music className="mr-3 w-5 h-5" />
                {!user ? 'Se connecter pour exporter' : 'Créer la playlist sur Spotify'}
                {user && <ArrowRight className="ml-3 w-5 h-5" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
