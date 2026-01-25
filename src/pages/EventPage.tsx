import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Loader2, ArrowLeft, Check, Plus, Music, ListMusic } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AffiliateLinks } from '@/components/AffiliateLinks';
import { supabase } from '@/integrations/supabase/client';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { toast } from 'sonner';

interface SetlistData {
  id: string;
  artistName: string;
  artistMbid?: string;
  venue: string;
  city?: string;
  country?: string;
  eventDate: string;
  isoDate: string;
  songs: string[];
}

interface Artist {
  mbid: string;
  name: string;
  eventDate: string;
  venueId: string;
  setlistId: string;
}

const EventPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const eventName = searchParams.get('name') || 'Événement';
  const eventCity = searchParams.get('city') || '';
  const eventCountry = searchParams.get('country') || '';
  const eventType = searchParams.get('type') || 'venue'; // 'venue', 'artist', or 'setlist'
  
  const [loading, setLoading] = useState(true);
  const [setlistData, setSetlistData] = useState<SetlistData | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [viewMode, setViewMode] = useState<'setlist' | 'artists'>('setlist');
  
  const { toggleConcert, isSelected, loading: concertsLoading } = useUserConcerts();

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // First, try to get the setlist directly (if eventId is a setlist ID)
        if (eventType === 'setlist' || eventId.length > 10) {
          const { data, error } = await supabase.functions.invoke('setlist-fm', {
            body: { 
              action: 'getSetlist',
              setlistId: eventId,
            },
          });

          if (!error && data?.success && data.setlist) {
            setSetlistData(data.setlist);
            setViewMode('setlist');
            setLoading(false);
            return;
          }
        }

        // If type is artist, fetch artist concerts
        if (eventType === 'artist') {
          const { data, error } = await supabase.functions.invoke('setlist-fm', {
            body: { 
              action: 'getArtistConcerts',
              artistMbid: eventId,
              artistName: eventName,
            },
          });

          if (error) throw error;
          
          if (data?.success && data.concerts) {
            setArtists(data.concerts.map((concert: any) => ({
              mbid: eventId,
              name: eventName,
              eventDate: concert.eventDate,
              venueId: concert.id,
              setlistId: concert.id,
              venue: concert.venue,
              city: concert.city,
            })));
            setViewMode('artists');
          }
        } else {
          // Fetch venue/festival artists
          const { data, error } = await supabase.functions.invoke('setlist-fm', {
            body: { 
              action: 'getVenueArtists',
              venueId: eventId,
              venueName: eventName,
              cityName: eventCity,
            },
          });

          if (error) throw error;
          
          if (data?.success && data.artists) {
            setArtists(data.artists);
            setViewMode('artists');
          }
        }
      } catch (err) {
        console.error('Error fetching event data:', err);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, eventName, eventCity, eventType]);

  const handleToggleConcert = async (artist: Artist | SetlistData) => {
    const setlistId = 'setlistId' in artist ? artist.setlistId : artist.id;
    const name = 'name' in artist ? artist.name : artist.artistName;
    const mbid = 'mbid' in artist ? artist.mbid : artist.artistMbid;
    const date = 'eventDate' in artist ? artist.eventDate : '';
    const venue = 'venue' in artist && typeof artist.venue === 'string' ? artist.venue : eventName;

    if (!setlistId) {
      toast.error('Impossible de sauvegarder: ID de l\'événement manquant');
      return;
    }
    if (!name) {
      toast.error('Impossible de sauvegarder: nom de l\'artiste manquant');
      return;
    }

    // Convert date to ISO format YYYY-MM-DD
    let isoDate: string | undefined;
    if ('isoDate' in artist && artist.isoDate) {
      isoDate = artist.isoDate;
    } else if (date) {
      const parts = date.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 2) {
          isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[0].length === 4) {
          isoDate = date;
        }
      }
    }

    await toggleConcert(name, setlistId, mbid, isoDate, venue);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Render Setlist View
  const renderSetlistView = () => {
    if (!setlistData) return null;

    const isChecked = isSelected(setlistData.artistName, setlistData.id);

    return (
      <div className="max-w-2xl mx-auto">
        {/* Setlist Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-fire flex items-center justify-center shadow-fire shrink-0">
              <Music className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl md:text-3xl text-foreground">
                {setlistData.artistName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(setlistData.eventDate)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {[setlistData.venue, setlistData.city, setlistData.country].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle Concert Button */}
          <div className="flex items-center gap-3">
            <Button
              variant={isChecked ? 'fire' : 'outline'}
              onClick={() => handleToggleConcert(setlistData)}
              disabled={concertsLoading}
              className="gap-2"
            >
              {isChecked ? (
                <>
                  <Check className="w-4 h-4" />
                  J'y étais !
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  J'y étais
                </>
              )}
            </Button>
            <AffiliateLinks artistName={setlistData.artistName} variant="compact" />
          </div>
        </motion.div>

        {/* Songs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            Setlist ({setlistData.songs.length} titres)
          </h3>

          {setlistData.songs.length > 0 ? (
            <ol className="space-y-2">
              {setlistData.songs.map((song, index) => (
                <motion.li
                  key={`${song}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </span>
                  <span className="text-foreground">{song}</span>
                </motion.li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aucun morceau enregistré pour ce concert
            </p>
          )}
        </motion.div>

        {/* Generate Playlist Button */}
        <div className="mt-8 text-center">
          <Button
            variant="fire"
            size="lg"
            onClick={() => navigate('/generate')}
            className="gap-2"
          >
            <Music className="w-5 h-5" />
            Générer ma playlist
          </Button>
        </div>
      </div>
    );
  };

  // Render Artists View
  const renderArtistsView = () => (
    <div className="space-y-4">
      <p className="text-muted-foreground mb-6">
        {artists.length} artiste{artists.length > 1 ? 's' : ''} trouvé{artists.length > 1 ? 's' : ''}
      </p>
      
      <div className="grid gap-3 max-w-2xl mx-auto">
        {artists.map((artist, index) => {
          const isChecked = isSelected(artist.name, artist.setlistId);
          const hasValidId = !!artist.setlistId;
          
          return (
            <motion.div
              key={`${artist.setlistId}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`
                bg-card border rounded-xl p-4 flex items-center gap-4 transition-all cursor-pointer
                ${isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}
              `}
              onClick={() => navigate(`/event/${artist.setlistId}?name=${encodeURIComponent(artist.name)}&type=setlist`)}
            >
              {/* Toggle Button */}
              {hasValidId && (
                <Button
                  variant={isChecked ? 'fire' : 'outline'}
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleConcert(artist);
                  }}
                  disabled={concertsLoading}
                  className="shrink-0"
                >
                  {isChecked ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </Button>
              )}
              
              {/* Artist Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg text-foreground truncate">
                  {artist.name}
                </h3>
                {artist.eventDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(artist.eventDate)}</span>
                  </div>
                )}
              </div>
              
              {/* Affiliate Links */}
              <div className="hidden md:block">
                <AffiliateLinks artistName={artist.name} variant="compact" />
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Generate Playlist Button */}
      <div className="mt-8 text-center">
        <Button
          variant="fire"
          size="lg"
          onClick={() => navigate('/generate')}
        >
          Générer ma playlist
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background noise">
      <Header />
      
      <main className="container px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              {setlistData ? setlistData.artistName : eventName}
            </h1>
            {!setlistData && (eventCity || eventCountry) && (
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <MapPin className="w-4 h-4" />
                <span>{[eventCity, eventCountry].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Chargement...</span>
          </div>
        ) : viewMode === 'setlist' && setlistData ? (
          renderSetlistView()
        ) : artists.length > 0 ? (
          renderArtistsView()
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="font-display text-2xl text-foreground mb-2">
              Aucune donnée trouvée
            </h2>
            <p className="text-muted-foreground mb-6">
              Nous n'avons pas trouvé d'informations pour cet événement
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventPage;
