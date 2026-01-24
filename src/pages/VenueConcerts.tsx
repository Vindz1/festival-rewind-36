import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Music, RefreshCw, Plus, Check, MapPin } from 'lucide-react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { useSpotify } from '@/hooks/useSpotify';

interface SetlistArtist {
  mbid: string;
  name: string;
  eventDate: string;
  venueId: string;
  setlistId: string;
}

const VenueConcerts = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isConnected: spotifyConnected, connect: connectSpotify } = useSpotify();
  const { userConcerts, toggleConcert, isSelected } = useUserConcerts();
  
  const [artists, setArtists] = useState<SetlistArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(searchParams.get('year') || new Date().getFullYear().toString());

  const venueName = searchParams.get('name') || 'Lieu';
  const city = searchParams.get('city') || '';
  const country = searchParams.get('country') || '';

  useEffect(() => {
    const fetchArtists = async () => {
      if (!venueName) return;
      
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching venue artists:', { venueName, city, year: yearFilter });
        
        const { data, error: fnError } = await supabase.functions.invoke('setlist-fm', {
          body: { 
            action: 'getVenueArtists',
            venueName: venueName,
            cityName: city,
            year: parseInt(yearFilter),
          },
        });

        console.log('Venue artists response:', data);

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
  }, [venueName, city, yearFilter]);

  const selectedArtists = artists.filter(a => isSelected(a.name, venueId || venueName));
  const selectedCount = selectedArtists.length;

  const handleGeneratePlaylist = () => {
    if (!spotifyConnected) {
      connectSpotify();
      return;
    }
    
    const selectedArtistsData = selectedArtists.map(artist => ({
      name: artist.name,
      mbid: artist.mbid,
      setlistId: artist.setlistId,
    }));
    
    navigate(`/generate?festival=${venueName}-${yearFilter}&artists=${encodeURIComponent(JSON.stringify(selectedArtistsData))}`);
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background noise">
      <Header />

      <main className="pt-24 pb-32">
        <div className="container px-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-2">
              {venueName}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              <span>{[city, country].filter(Boolean).join(', ')}</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Sélectionnez les concerts auxquels vous avez assisté
            </p>
            
            {/* Year filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Année :</label>
              <Input
                type="number"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-24"
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
          </motion.div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Chargement des concerts depuis Setlist.fm...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="outline">{artists.length} concerts en {yearFilter}</Badge>
                {user && (
                  <span className="text-sm text-muted-foreground ml-auto">
                    {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {artists.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun concert trouvé pour cette année</p>
                  <p className="text-sm mt-2">Essayez une autre année</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {artists.map((artist, index) => {
                      const selected = user && isSelected(artist.name, venueId || venueName);
                      
                      return (
                        <motion.div
                          key={artist.setlistId || `${artist.name}-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.02 }}
                          className={`
                            relative overflow-hidden rounded-lg
                            transition-all duration-300 group p-4
                            ${selected
                              ? 'bg-primary/20 border-2 border-primary shadow-fire'
                              : 'bg-card border border-border'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className={`
                                font-display text-lg truncate transition-colors
                                ${selected ? 'text-primary' : 'text-foreground'}
                              `}>
                                {artist.name}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {artist.eventDate}
                              </span>
                              {selected && (
                                <span className="text-xs text-primary block">J'y étais ! 🤘</span>
                              )}
                            </div>
                            
                            {user ? (
                              <button
                                onClick={() => toggleConcert(
                                  artist.name, 
                                  venueId || venueName, 
                                  artist.mbid, 
                                  artist.eventDate,
                                  venueName
                                )}
                                className={`
                                  w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                  transition-all duration-300 cursor-pointer
                                  ${selected
                                    ? 'bg-gradient-fire shadow-fire hover:opacity-80'
                                    : 'bg-muted border border-border hover:border-primary hover:bg-primary/10'
                                  }
                                `}
                                title={selected ? 'Retirer de mon historique' : 'Ajouter à mon historique'}
                              >
                                {selected ? (
                                  <Check className="w-5 h-5 text-primary-foreground" />
                                ) : (
                                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                )}
                              </button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleLogin}
                                className="shrink-0"
                              >
                                Connexion
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom bar when concerts are selected */}
      {selectedCount > 0 && user && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 glass border-t border-border"
        >
          <div className="container px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-fire flex items-center justify-center shadow-fire">
                  <Music className="w-5 h-5 text-primary-foreground" />
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

export default VenueConcerts;
