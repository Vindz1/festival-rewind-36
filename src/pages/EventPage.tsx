import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Loader2, ArrowLeft, Check, Plus, ExternalLink } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AffiliateLinks } from '@/components/AffiliateLinks';
import { supabase } from '@/integrations/supabase/client';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { toast } from 'sonner';

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
  const eventType = searchParams.get('type') || 'venue'; // 'venue' or 'artist'
  
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  
  const { toggleConcert, isSelected, loading: concertsLoading } = useUserConcerts();

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        if (eventType === 'artist') {
          // Fetch artist concerts
          const { data, error } = await supabase.functions.invoke('setlist-fm', {
            body: { 
              action: 'getArtistConcerts',
              artistMbid: eventId,
              artistName: eventName,
            },
          });

          if (error) throw error;
          
          if (data?.success && data.concerts) {
            // Transform concerts to artist format for display
            setArtists(data.concerts.map((concert: any) => ({
              mbid: eventId,
              name: eventName,
              eventDate: concert.eventDate,
              venueId: concert.id,
              setlistId: concert.id,
              venue: concert.venue,
              city: concert.city,
            })));
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

  const handleToggleConcert = async (artist: Artist) => {
    // CRITICAL: Validate both IDs before saving
    if (!artist.setlistId) {
      toast.error('Impossible de sauvegarder: ID de l\'événement manquant');
      return;
    }
    if (!artist.name) {
      toast.error('Impossible de sauvegarder: nom de l\'artiste manquant');
      return;
    }

    // Convert date to ISO format YYYY-MM-DD
    let isoDate: string | undefined;
    if (artist.eventDate) {
      const parts = artist.eventDate.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 2) {
          // DD-MM-YYYY -> YYYY-MM-DD
          isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (parts[0].length === 4) {
          // Already YYYY-MM-DD
          isoDate = artist.eventDate;
        }
      }
    }

    await toggleConcert(
      artist.name,
      artist.setlistId,
      artist.mbid,
      isoDate,
      eventName
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    // If already in YYYY-MM-DD
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

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
              {eventName}
            </h1>
            {(eventCity || eventCountry) && (
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
            <span className="ml-3 text-muted-foreground">Chargement de la programmation...</span>
          </div>
        ) : artists.length > 0 ? (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              {artists.length} artiste{artists.length > 1 ? 's' : ''} trouvé{artists.length > 1 ? 's' : ''}
            </p>
            
            <div className="grid gap-3">
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
                      bg-card border rounded-xl p-4 flex items-center gap-4 transition-all
                      ${isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}
                    `}
                  >
                    {/* Toggle Button - only show if valid ID */}
                    {hasValidId && (
                      <Button
                        variant={isChecked ? 'fire' : 'outline'}
                        size="icon"
                        onClick={() => handleToggleConcert(artist)}
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
                    
                    {/* View on Setlist.fm */}
                    {artist.setlistId && (
                      <a
                        href={`https://www.setlist.fm/setlist/${artist.setlistId}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
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
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="font-display text-2xl text-foreground mb-2">
              Aucun artiste trouvé
            </h2>
            <p className="text-muted-foreground mb-6">
              Nous n'avons pas trouvé d'artistes pour cet événement
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
