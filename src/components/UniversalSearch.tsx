import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Music, Calendar, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
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

export const UniversalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setShowResults(true);
    setResults([]);
    
    try {
      console.log('Starting search for:', query.trim());
      
      const { data, error } = await supabase.functions.invoke('setlist-fm', {
        body: { 
          action: 'searchFestivalsAndArtists',
          query: query.trim(),
        },
      });

      console.log('Search response:', data, error);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }
      
      if (data?.success) {
        setResults(data.results || []);
      } else {
        console.error('Search failed:', data?.error);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    
    if (result.type === 'festival') {
      navigate(`/venue/${result.id}?name=${encodeURIComponent(result.name)}&city=${encodeURIComponent(result.city || '')}&country=${encodeURIComponent(result.country || '')}&year=${result.year || new Date().getFullYear()}`);
    } else {
      navigate(`/artist/${result.id}?name=${encodeURIComponent(result.name)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un festival, une salle ou un artiste..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-12 pr-10 h-14 text-lg bg-card border-border focus:border-primary"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <Button 
          variant="fire" 
          size="lg"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="h-14 px-6"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Rechercher'
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Recherche en cours...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-border">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center shrink-0
                      ${result.type === 'festival' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}
                    `}>
                      {result.type === 'festival' ? (
                        <Calendar className="w-6 h-6" />
                      ) : (
                        <Music className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-lg text-foreground truncate">
                        {result.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {result.type === 'festival' ? (
                          <>
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {[result.city, result.country].filter(Boolean).join(', ')}
                            </span>
                            {result.year && <span className="shrink-0">• {result.year}</span>}
                          </>
                        ) : (
                          <span>Artiste</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun résultat trouvé</p>
                <p className="text-sm">Essayez avec un autre terme</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};
