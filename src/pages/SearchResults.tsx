import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Music, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState(location.state?.results || []);
  const [loading, setLoading] = useState(!location.state?.results);
  
  const query = searchParams.get('q') || location.state?.query || '';

  // Si on rafraîchit la page, on relance la recherche pour éviter l'écran vide
  useEffect(() => {
    if (results.length === 0 && query) {
      setLoading(true);
      fetch(`/api/search?query=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-background pt-24 px-4 text-white">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 hover:bg-zinc-800">
          <ArrowLeft className="mr-2 h-4 w-4"/> Retour
        </Button>

        <h1 className="text-3xl font-display mb-2">Résultats pour "{query}"</h1>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mt-8">
            {results.map((item: any, index: number) => (
              <div 
                key={index} 
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl hover:border-primary cursor-pointer transition-all"
                onClick={() => navigate(`/event/${item.id}?type=venue&year=${item.year}&name=${encodeURIComponent(item.name)}`)}
              >
                <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                <div className="text-sm text-zinc-400 flex flex-col gap-1">
                  <span className="flex items-center gap-2"><MapPin className="h-3 w-3"/> {item.city}</span>
                  <span className="flex items-center gap-2"><Calendar className="h-3 w-3"/> Édition {item.year}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
            <Music className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500">Aucun festival trouvé pour cette recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
