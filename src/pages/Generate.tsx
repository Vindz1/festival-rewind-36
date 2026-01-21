import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Music, Check, ExternalLink, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSpotify } from '@/hooks/useSpotify';
import { toast } from 'sonner';

interface Track {
  artistName: string;
  songName: string;
}

const Generate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isConnected: spotifyConnected, loading: spotifyLoading } = useSpotify();
  
  const artistNames = searchParams.get('artists')?.split(',').filter(Boolean) || [];
  const festivalId = searchParams.get('festival') || 'hellfest-2024';
  const year = festivalId.match(/\d{4}/)?.[0] || '2024';
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentArtist, setCurrentArtist] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [tracksAdded, setTracksAdded] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchSetlists = useCallback(async () => {
    if (artistNames.length === 0 || isGenerating) return;
    
    setIsGenerating(true);
    setProgress(0);
    const allTracks: Track[] = [];

    for (let i = 0; i < artistNames.length; i++) {
      const artistName = decodeURIComponent(artistNames[i]);
      setCurrentArtist(artistName);
      setProgress(Math.round(((i + 1) / artistNames.length) * 100));

      try {
        const { data, error } = await supabase.functions.invoke('setlist-fm', {
          body: { 
            action: 'getArtistSetlist',
            artistName,
          },
        });

        if (error) {
          console.error(`Error fetching setlist for ${artistName}:`, error);
          continue;
        }

        if (data?.success && data?.songs) {
          for (const songName of data.songs) {
            allTracks.push({ artistName, songName });
          }
        }
      } catch (err) {
        console.error(`Error fetching setlist for ${artistName}:`, err);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setTracks(allTracks);
    setIsGenerating(false);
    setCurrentArtist('');
  }, [artistNames, isGenerating]);

  useEffect(() => {
    if (artistNames.length > 0 && !isGenerating && tracks.length === 0) {
      fetchSetlists();
    }
  }, [artistNames, fetchSetlists, isGenerating, tracks.length]);

  const createPlaylist = async () => {
    if (!user || !spotifyConnected || tracks.length === 0) return;

    setIsCreatingPlaylist(true);

    try {
      const { data, error } = await supabase.functions.invoke('spotify-playlist', {
        body: {
          action: 'createPlaylist',
          userId: user.id,
          playlistName: `Mon Hellfest ${year}`,
          tracks,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setPlaylistUrl(data.playlistUrl);
        setTracksAdded(data.tracksAdded);
        toast.success(`Playlist créée avec ${data.tracksAdded} morceaux !`);
      } else {
        throw new Error(data?.error || 'Failed to create playlist');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création';
      console.error('Error creating playlist:', err);
      toast.error(errorMessage);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  if (authLoading || spotifyLoading) {
    return (
      <div className="min-h-screen bg-background noise flex items-center justify-center">
        <div className="animate-spin">
          <Flame className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background noise">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container px-4 max-w-3xl mx-auto">
          {/* Back link */}
          <Link 
            to="/festivals" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={isGenerating || isCreatingPlaylist ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isGenerating || isCreatingPlaylist ? Infinity : 0, ease: 'linear' }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-fire flex items-center justify-center shadow-glow">
                <Flame className="w-10 h-10 text-primary-foreground" />
              </div>
            </motion.div>

            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4">
              {isGenerating ? (
                <>RÉCUPÉRATION DES <span className="text-gradient-fire">SETLISTS</span></>
              ) : isCreatingPlaylist ? (
                <>CRÉATION DE LA <span className="text-gradient-fire">PLAYLIST</span></>
              ) : playlistUrl ? (
                <>PLAYLIST <span className="text-gradient-fire">CRÉÉE</span> !</>
              ) : (
                <>VOS <span className="text-gradient-fire">MORCEAUX</span></>
              )}
            </h1>

            {isGenerating && (
              <p className="text-muted-foreground">
                Recherche des morceaux joués par {currentArtist}...
              </p>
            )}
            {!isGenerating && !playlistUrl && tracks.length > 0 && (
              <p className="text-muted-foreground">
                {tracks.length} morceaux retrouvés depuis les setlists officielles
              </p>
            )}
            {playlistUrl && (
              <p className="text-muted-foreground">
                {tracksAdded} morceaux ajoutés sur Spotify
              </p>
            )}
          </motion.div>

          {/* Progress bar */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <ProgressBar progress={progress} label={`${currentArtist}`} />
            </motion.div>
          )}

          {/* Tracks list */}
          {!isGenerating && tracks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              {/* Track list */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Music className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl">Mon Hellfest {year}</h2>
                  <Badge variant="fire" className="ml-auto">{tracks.length} titres</Badge>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {tracks.slice(0, 50).map((track, index) => (
                    <motion.div
                      key={`${track.artistName}-${track.songName}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{track.songName}</div>
                        <div className="text-sm text-muted-foreground truncate">{track.artistName}</div>
                      </div>
                    </motion.div>
                  ))}
                  {tracks.length > 50 && (
                    <div className="p-4 text-center text-muted-foreground">
                      Et {tracks.length - 50} autres morceaux...
                    </div>
                  )}
                </div>
              </div>

              {/* Export section */}
              {!playlistUrl ? (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display text-xl text-foreground mb-4">
                    Créer la playlist sur Spotify
                  </h3>
                  
                  {!spotifyConnected ? (
                    <p className="text-muted-foreground mb-4">
                      Veuillez d'abord connecter votre compte Spotify depuis la page des festivals.
                    </p>
                  ) : (
                    <Button
                      variant="fire"
                      size="lg"
                      className="w-full"
                      disabled={isCreatingPlaylist}
                      onClick={createPlaylist}
                    >
                      {isCreatingPlaylist ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <Flame className="w-5 h-5" />
                          Créer "Mon Hellfest {year}" sur Spotify
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <Check className="w-6 h-6 text-green-500" />
                  <div>
                    <div className="font-medium text-green-400">Playlist créée avec succès !</div>
                    <div className="text-sm text-muted-foreground">
                      Ouvrez Spotify pour l'écouter
                    </div>
                  </div>
                  <a href={playlistUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="ml-auto gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir
                    </Button>
                  </a>
                </motion.div>
              )}

              {/* New playlist button */}
              <div className="text-center">
                <Link to="/festivals">
                  <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Créer une autre playlist
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* No tracks found */}
          {!isGenerating && tracks.length === 0 && artistNames.length > 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucun morceau trouvé. Réessayez.</p>
              <Button variant="outline" onClick={fetchSetlists}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Generate;
