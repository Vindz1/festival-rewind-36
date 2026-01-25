import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Music, MapPin, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  type: 'festival' | 'artist';
  id: string;
  name: string;
  venue?: string;
  city?: string;
  country?: string;
  year?: string;
  eventDate?: string;
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [festivals, setFestivals] = useState<SearchResult[]>([]);
  const [artists, setArtists] = useState<SearchResult[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('setlist-fm', {
          body: { 
            action: 'searchFestivalsAndArtists',
            query: query.trim(),
          },
        });

        if (error) throw error;
        
        if (data?.success && data.results) {
          // Results are already deduplicated by the Edge Function
          setResults(data.results);
          setFestivals(data.results.filter((r: SearchResult) => r.type === 'festival'));
          setArtists(data.results.filter((r: SearchResult) => r.type === 'artist'));
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleEventClick = (result: SearchResult) => {
    if (result.type === 'festival' && result.id) {
      navigate(`/event/${result.id}?name=${encodeURIComponent(result.name)}&city=${encodeURIComponent(result.city || '')}&country=${encodeURIComponent(result.country || '')}`);
    } else if (result.type === 'artist' && result.id) {
      navigate(`/event/${result.id}?type=artist&name=${encodeURIComponent(result.name)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background noise">
      <Header />
      
      <main className="container px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              Résultats pour "{query}"
            </h1>
            <p className="text-muted-foreground">
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Recherche en cours...</span>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Section Festivals */}
            {festivals.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  Festivals & Salles
                  <span className="text-sm font-normal text-muted-foreground">({festivals.length})</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {festivals.map((festival, index) => (
                    <motion.div
                      key={`festival-${festival.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => handleEventClick(festival)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Calendar className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors truncate">
                            {festival.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {[festival.city, festival.country].filter(Boolean).join(', ') || 'Lieu inconnu'}
                            </span>
                          </div>
                          {festival.year && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Année: {festival.year}
                            </div>
                          )}
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Section Artistes */}
            {artists.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-3">
                  <Music className="w-6 h-6 text-accent" />
                  Artistes
                  <span className="text-sm font-normal text-muted-foreground">({artists.length})</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {artists.map((artist, index) => (
                    <motion.div
                      key={`artist-${artist.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 transition-all cursor-pointer group"
                      onClick={() => handleEventClick(artist)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <Music className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-lg text-foreground group-hover:text-accent transition-colors truncate">
                            {artist.name}
                          </h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            Voir les concerts
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* No results */}
            {!loading && results.length === 0 && (
              <div className="text-center py-20">
                <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h2 className="font-display text-2xl text-foreground mb-2">
                  Aucun résultat trouvé
                </h2>
                <p className="text-muted-foreground mb-6">
                  Essayez avec un autre terme de recherche
                </p>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Retour à l'accueil
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
