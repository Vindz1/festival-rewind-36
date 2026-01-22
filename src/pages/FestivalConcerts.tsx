import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Flame, RefreshCw, Music } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { useSpotify } from '@/hooks/useSpotify';
import { toast } from 'sonner';

interface SetlistArtist {
  mbid: string;
  name: string;
  eventDate: string;
  venueId: string;
  setlistId: string;
}

const FestivalConcerts = () => {
  const { festivalId } = useParams<{ festivalId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isConnected: spotifyConnected, connect: connectSpotify } = useSpotify();
  const { userConcerts, toggleConcert, isSelected, loading: concertsLoading } = useUserConcerts(festivalId);
  
  const [artists, setArtists] = useState<SetlistArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse festival ID to get year
  const year = festivalId?.match(/\d{4}/)?.[0] || '2024';
  const festivalName = 'Hellfest';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!festivalId) return;
      
      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('setlist-fm', {
          body: { 
            action: 'getFestivalArtists',
            festivalName: 'Hellfest',
            year: parseInt(year),
          },
        });

        if (fnError) throw fnError;
        
        if (data?.success && data?.artists) {
          setArtists(data.artists);
        } else {
          throw new Error(data?.error || 'Failed to fetch artists');
        }
      } catch (err: any) {
        console.error('Error fetching artists:', err);
        setError(err.message || 'Erreur lors du chargement des artistes');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [festivalId, year]);

  const selectedCount = userConcerts.length;

  const handleGeneratePlaylist = () => {
    if (!spotifyConnected) {
      connectSpotify();
      return;
    }
    
    // Build artist data with setlistId for each selected concert
    const selectedArtistsData = userConcerts.map(concert => {
      const artist = artists.find(a => a.name === concert.artist_name);
      return {
        name: concert.artist_name,
        mbid: artist?.mbid || concert.artist_mbid,
        setlistId: artist?.setlistId,
      };
    });
    
    navigate(`/generate?festival=${festivalId}&artists=${encodeURIComponent(JSON.stringify(selectedArtistsData))}`);
  };

  if (authLoading) {
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

      <main className="pt-24 pb-32">
        <div className="container px-4">
          {/* Back link */}
          <Link 
            to="/festivals" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux festivals
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-2">
              {festivalName} <span className="text-gradient-fire">{year}</span>
            </h1>
            <p className="text-muted-foreground">
              Cochez les concerts auxquels vous avez assisté
            </p>
          </motion.div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Chargement des artistes depuis Setlist.fm...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          )}

          {/* Artists Grid */}
          {!loading && !error && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="fire">{artists.length} artistes</Badge>
                <span className="text-sm text-muted-foreground ml-auto">
                  {selectedCount} concert{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {artists.map((artist, index) => {
                    const selected = isSelected(artist.name, festivalId || '');
                    
                    return (
                      <motion.div
                        key={artist.mbid || artist.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => toggleConcert(artist.name, festivalId || '', artist.mbid, artist.eventDate)}
                        className={`
                          relative overflow-hidden rounded-lg cursor-pointer
                          transition-all duration-300 group p-4
                          ${selected
                            ? 'bg-primary/20 border-2 border-primary shadow-fire'
                            : 'bg-card border border-border hover:border-primary/50 hover:bg-card/80'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center shrink-0
                            transition-all duration-300
                            ${selected
                              ? 'bg-gradient-fire shadow-fire'
                              : 'bg-muted border border-border group-hover:border-primary/50'
                            }
                          `}>
                            {selected ? (
                              <Flame className="w-5 h-5 text-primary-foreground" />
                            ) : (
                              <Music className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`
                              font-display text-lg truncate transition-colors
                              ${selected ? 'text-primary' : 'text-foreground'}
                            `}>
                              {artist.name}
                            </h4>
                            {selected && (
                              <span className="text-xs text-primary">J'y étais ! 🤘</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom bar */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 glass border-t border-border"
        >
          <div className="container px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-fire flex items-center justify-center shadow-fire">
                  <Flame className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {selectedCount} concert{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {spotifyConnected ? 'Prêt à générer votre playlist' : 'Connectez Spotify pour générer'}
                  </div>
                </div>
              </div>
              <Button variant="fire" className="gap-2" onClick={handleGeneratePlaylist}>
                {spotifyConnected ? (
                  <>
                    Générer ma playlist
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Connecter Spotify
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FestivalConcerts;
