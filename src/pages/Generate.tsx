import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription, UserSubscription } from '@/lib/subscription';
import { Music, Loader2, Play, ArrowRight, Lock, Crown, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  // Étape 1 : Récupérer les chansons
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

  // --- RENDU ---

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-[#4d94ff] selection:text-white">
      {/* Header en dehors du container avec padding */}
      <Header />

      {/* Container principal avec animation d'entrée */}
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* CORRECTION DU BOUTON RETOUR : Redirection explicite selon le mode */}
        <div className="mb-6">
            <Button 
                variant="ghost" 
                onClick={() => navigate(isUpcomingMode ? '/my-concerts?tab=future' : '/my-concerts?tab=past')}
                className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d2d] gap-2 pl-0"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour à la sélection
            </Button>
        </div>

        {/* --- LOADER --- */}
        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in zoom-in duration-500">
             <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#4d94ff]/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative bg-[#2d2d2d] p-6 rounded-full border border-[#4d94ff]/30 shadow-[0_0_30px_-5px_rgba(77,148,255,0.3)]">
                    <Loader2 className="w-12 h-12 text-[#4d94ff] animate-spin" />
                </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Chargement en cours</h2>
            <p className="text-[#a0a0a0]">
              {isUpcomingMode ? 'Récupération des top tracks...' : 'Récupération des setlists...'}
            </p>
          </div>
        ) : (
          
          /* --- CONTENU PRINCIPAL --- */
          <div className="space-y-8">
            
            {/* Titre et Stats */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold italic tracking-tight">
                    <span className="text-[#4d94ff] drop-shadow-[0_0_15px_rgba(77,148,255,0.5)]">
                        {isUpcomingMode ? totalSelectedTracks : songs.length}
                    </span> TITRES
                </h1>
                <p className="text-[#a0a0a0]">
                    {isUpcomingMode 
                        ? `Top tracks de ${selectedArtists.size} artiste${selectedArtists.size > 1 ? 's' : ''}`
                        : `Depuis ${(() => {
                            const saved = localStorage.getItem('selected_concerts');
                            const count = saved ? JSON.parse(saved).length : 0;
                            return `${count} concert${count > 1 ? 's' : ''}`;
                          })()}`
                    }
                </p>
            </div>

            {/* Auth Warnings */}
            {!user && (
                <Alert className="max-w-xl mx-auto bg-[#2d2d2d] border-[#404040]">
                <Lock className="h-4 w-4 text-[#a0a0a0]" />
                <AlertDescription className="text-gray-300">
                    <strong>Connectez-vous</strong> pour exporter votre playlist vers Spotify.
                    <Link to="/auth" className="ml-2 underline text-[#4d94ff]">
                    Se connecter
                    </Link>
                </AlertDescription>
                </Alert>
            )}

            {/* Input Nom Playlist */}
            <div className="max-w-xl mx-auto">
                <label className="block text-sm font-medium mb-2 text-gray-400">
                    Nom de la playlist
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        className="w-full pl-4 pr-10 py-4 bg-[#2d2d2d] border border-[#404040] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#4d94ff] focus:border-transparent placeholder-gray-600 transition-all shadow-lg"
                        placeholder={isUpcomingMode ? "Upcoming Concerts 2026" : "Ma Time Capsule Live"}
                    />
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4d94ff] w-5 h-5 opacity-50" />
                </div>
            </div>

            {/* --- CONTENU SPÉCIFIQUE AU MODE --- */}
            
            {/* MODE UPCOMING : LISTE ARTISTES */}
            {isUpcomingMode && (
                <div className="space-y-4">
                    {artistsWithTracks.map((artist) => {
                    const isSelected = selectedArtists.has(artist.artistId);
                    return (
                        <div
                        key={artist.artistId}
                        onClick={() => toggleArtist(artist.artistId)}
                        className={`group bg-[#2d2d2d] border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                            isSelected 
                            ? 'border-[#4d94ff] bg-[#4d94ff]/5 shadow-[0_0_20px_-10px_rgba(77,148,255,0.2)]' 
                            : 'border-[#404040] hover:border-zinc-500 hover:bg-[#333]'
                        }`}
                        >
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-[#4d94ff]' : 'bg-[#3d3d3d]'
                            }`}>
                            {artist.artistImage ? (
                                <img src={artist.artistImage} alt={artist.artistName} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <Music className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                            )}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-lg font-bold transition-colors ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                    {artist.artistName}
                                </h3>
                                <p className="text-sm text-[#a0a0a0]">{artist.tracks.length} morceaux</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'border-[#4d94ff] bg-[#4d94ff]' : 'border-[#505050]'
                            }`}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </div>
                        </div>

                        {/* Preview tracks */}
                        {isSelected && (
                            <div className="mt-4 space-y-2 border-t border-[#404040]/50 pt-3 animate-in slide-in-from-top-2">
                            {artist.tracks.slice(0, 5).map((track, idx) => (
                                <div key={track.id} className="flex items-center gap-3 text-sm text-[#a0a0a0] pl-2 py-1">
                                    <span className="text-[#4d94ff] font-mono w-4">#{idx + 1}</span>
                                    <span className="flex-1 truncate text-gray-400">{track.name}</span>
                                </div>
                            ))}
                            {artist.tracks.length > 5 && (
                                <p className="text-xs text-[#4d94ff] pl-2 pt-1 font-medium">
                                +{artist.tracks.length - 5} autres morceaux
                                </p>
                            )}
                            </div>
                        )}
                        </div>
                    );
                    })}
                </div>
            )}

            {/* MODE PAST : LISTE PREVIEW */}
            {!isUpcomingMode && showPreview && (
                <div className="bg-[#2d2d2d] rounded-3xl border border-[#404040] p-6 shadow-2xl animate-in slide-in-from-bottom-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white border-b border-[#404040] pb-4">
                        <div className="bg-[#4d94ff]/20 p-2 rounded-lg">
                            <Music className="text-[#4d94ff] w-5 h-5" />
                        </div>
                        Prévisualisation ({tracksWithInfo.length} titres)
                    </h2>
                    
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {tracksWithInfo.map((track, index) => (
                        <div 
                            key={index}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#3d3d3d] transition-colors group"
                        >
                            <div className="w-10 h-10 bg-[#252525] rounded flex-shrink-0 flex items-center justify-center border border-[#404040] overflow-hidden">
                            {track.albumArt ? (
                                <img src={track.albumArt} alt={track.album} className="w-full h-full object-cover" />
                            ) : (
                                <Music className="w-5 h-5 text-zinc-600" />
                            )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-200 truncate group-hover:text-white transition-colors">{track.title}</p>
                                <p className="text-xs text-[#a0a0a0] truncate">
                                    {track.artist}
                                    {track.album && <span className="hidden sm:inline"> • {track.album}</span>}
                                </p>
                            </div>
                            <div className="text-xs text-gray-600 font-mono w-6 text-right">
                                {index + 1}
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BOUTONS D'ACTION (Sticky Bottom) */}
            <div className="sticky bottom-6 z-10 max-w-xl mx-auto space-y-3 pb-4">
                
                {/* Bouton PREVIEW (Mode Past uniquement) */}
                {!isUpcomingMode && !showPreview && (
                    <>
                        <Button 
                            onClick={fetchDetailedInfo} 
                            disabled={searching}
                            variant="outline"
                            className="w-full h-16 text-lg font-bold border-[#4d94ff] text-[#4d94ff] hover:bg-[#4d94ff] hover:text-white transition-all bg-[#1a1a1a]/80 backdrop-blur"
                        >
                        {searching ? (
                            <>
                            <Loader2 className="mr-3 animate-spin" />
                            Analyse... {exportProgress}%
                            </>
                        ) : (
                            <>
                            <Play className="mr-3 fill-current w-5 h-5" />
                            Prévisualiser les morceaux
                            </>
                        )}
                        </Button>
                        {searching && (
                            <Progress value={exportProgress} className="w-full h-1.5 bg-[#2d2d2d] [&>div]:bg-[#4d94ff]" />
                        )}
                    </>
                )}

                {/* Bouton EXPORT FINAL */}
                {(isUpcomingMode || showPreview) && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#4d94ff]/20 blur-xl rounded-full animate-pulse"></div>
                        <Button 
                            onClick={forceExport}
                            disabled={isUpcomingMode && selectedArtists.size === 0}
                            className="relative w-full h-16 text-xl font-bold bg-[#4d94ff] hover:bg-[#6ba6ff] text-white shadow-xl rounded-xl transition-all hover:scale-[1.02] hover:-translate-y-1"
                        >
                            {!user && <Lock className="mr-3 w-5 h-5" />}
                            <div className="flex items-center gap-2">
                                <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" className="h-6 w-auto mr-1 opacity-90" />
                                <span>{!user ? 'Se connecter' : 'Créer la playlist'}</span>
                            </div>
                            {user && <ArrowRight className="ml-3 w-5 h-5" />}
                        </Button>
                    </div>
                )}

                {/* Upsell Premium */}
                {user && subscription?.subscription_type === 'free' && !subscription.can_export && (
                    <div className="text-center animate-in slide-in-from-bottom-2 fade-in">
                        <Button variant="ghost" size="sm" className="gap-2 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10">
                            <Crown className="w-4 h-4" />
                            Passer à Premium pour plus d'exports
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
