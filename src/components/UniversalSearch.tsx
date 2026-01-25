import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const UniversalSearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        // On envoie les résultats groupés par année à la page de résultats
        navigate('/search-results', { state: { results: data.results, query } });
      } else {
        toast.error("Aucune édition trouvée pour ce nom");
      }
    } catch (err) {
      toast.error("Le moteur de recherche est indisponible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full px-4">
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="Entrez le nom d'un festival (ex: Hellfest)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 pr-32 bg-zinc-900/80 border-zinc-700 text-white rounded-2xl focus:border-primary transition-all"
        />
        <Search className="absolute left-4 w-5 h-5 text-zinc-500" />
        <Button type="submit" disabled={loading} className="absolute right-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-bold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Trouver"}
        </Button>
      </div>
    </form>
  );
};
