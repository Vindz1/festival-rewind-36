import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Music, Loader2, Play, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TrackInfo {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  spotifyUri?: string;
  year?: string;
}

export default function Generate() {
  const { concerts } = useUserConcerts();
  const [songs, setSongs] = useState<any[]>([]);
  const [tracksWithInfo, setTracksWithInfo] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Étape 1 : Récupérer les chansons depuis setlist.fm
  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      const all: any[] = [];
      for (const c of concerts) {
        const res = await fetch(`/api/search?action=songs&setlistId=${c.id}`);
        const data = await res.json();
        if (data.songs) {
          data.songs.forEach((s: string) => all.push({ artist: c.artist, title: s }));
        }
      }
      setSongs(all);
      setLoading(false);
    };
    if (concerts.length > 0) fetchSongs();
  }, [concerts]);

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

  // Étape 3 : Exporter vers Spotify
  const handleSpotifyExport = () => {
    const client_id = "927dd1fd048148d3b71cb0b9e109af6e";
    const redirectUri = "https://festivalrewind.vercel.app/spotify-callback";
    localStorage.setItem('pending_songs', JSON.stringify(songs));
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=playlist-modify-public`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl">Récupération des setlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <Header />
      
      <div className="max-w-4xl mx-auto">
        {/* Header avec stats */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 italic">
            <span className="text-gradient-fire">{songs.length}</span> TITRES
          </h1>
          <p className="text-gray-400">
            Depuis {concerts.length} concert{concerts.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Boutons d'action */}
        {!showPreview ? (
          <div className="max-w-xl mx-auto space-y-4">
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

            <Button 
              onClick={handleSpotifyExport}
              variant="fire"
              className="w-full h-16 text-xl font-bold"
            >
              <Music className="mr-3" />
              Exporter vers Spotify
            </Button>
          </div>
        ) : (
          <>
            {/* Liste de prévisualisation */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Music className="text-primary" />
                Prévisualisation ({tracksWithInfo.length} morceaux)
              </h2>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {tracksWithInfo.map((track, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
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
                      <p className="text-sm text-gray-400 truncate">
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
            <div className="max-w-xl mx-auto">
              <Button 
                onClick={handleSpotifyExport}
                variant="fire"
                className="w-full h-16 text-xl font-bold"
              >
                <Music className="mr-3" />
                Créer la playlist sur Spotify
                <ArrowRight className="ml-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
