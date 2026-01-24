import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Music, RefreshCw, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AffiliateLinks } from '@/components/AffiliateLinks';
import { supabase } from '@/integrations/supabase/client';

interface Concert {
  id: string;
  eventDate: string;
  venue: string;
  city: string;
  country: string;
  songCount: number;
}

const ArtistPage = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const [searchParams] = useSearchParams();
  const artistName = searchParams.get('name') || 'Artiste';

  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtistConcerts = async () => {
      if (!artistId && !artistName) return;
      
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching artist concerts:', { artistId, artistName });
        
        const { data, error: fnError } = await supabase.functions.invoke('setlist-fm', {
          body: { 
            action: 'getArtistConcerts',
            artistMbid: artistId !== artistName ? artistId : undefined,
            artistName: artistName,
          },
        });

        console.log('Artist concerts response:', data);

        if (fnError) throw fnError;
        
        if (data?.success) {
          setConcerts(data.concerts || []);
        } else {
          throw new Error(data?.error || 'Failed to fetch concerts');
        }
      } catch (err: any) {
        console.error('Error fetching artist concerts:', err);
        setError(err.message || 'Erreur lors du chargement des concerts');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistConcerts();
  }, [artistId, artistName]);

  return (
    <div className="min-h-screen bg-background noise">
      <Header />

      <main className="pt-24 pb-20">
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
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-fire flex items-center justify-center shadow-fire">
                <Music className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-4xl md:text-6xl text-foreground">
                  {artistName}
                </h1>
                <p className="text-muted-foreground">
                  Historique des concerts
                </p>
              </div>
            </div>
            
            {/* Affiliate links */}
            <AffiliateLinks artistName={artistName} />
          </motion.div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <span className="ml-3 text-muted-foreground">Chargement des concerts...</span>
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
                <Badge variant="outline">{concerts.length} concerts récents</Badge>
              </div>

              {concerts.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun concert trouvé pour cet artiste</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {concerts.map((concert, index) => (
                    <motion.div
                      key={concert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {concert.venue}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[concert.city, concert.country].filter(Boolean).join(', ')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {concert.eventDate}
                            </span>
                            {concert.songCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                {concert.songCount} titres
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={`https://www.setlist.fm/setlist/${concert.id}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ArtistPage;
