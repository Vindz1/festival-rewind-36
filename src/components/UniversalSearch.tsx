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
      // On appelle notre tunnel Vercel au lieu de Setlist.fm directement
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.setlist) {
        const groupedResults = new Map();
        data.setlist.forEach((s: any) => {
          const year = s.eventDate.split('-')[2];
          const city = s.venue.city.name;
          const key = `${city}-${year}`;
          
          if (!groupedResults.has(key)) {
            groupedResults.set(key, {
              id: s.venue.id,
              name: `${query} ${year}`,
              city: city,
              country: s.venue.city.country.name,
              year: year
            });
          }
        });

        navigate('/search-results', { state: { results: Array.from(groupedResults.values()), query } });
      } else {
        toast.error("Aucun festival trouvé");
      }
    } catch (err) {
      toast.error("Erreur de connexion au tunnel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full">
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="Cherchez un festival (ex: Hellfest, Coachella...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 pr-32 bg-zinc-900/50 border-zinc-800 text-white rounded-2xl"
        />
        <Search className="absolute left-4 w-5 h-5 text-zinc-500" />
        <Button type="submit" disabled={loading} className="absolute right-2 h-10 bg-primary text-white px-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
        </Button>
      </div>
    </form>
  );
};
