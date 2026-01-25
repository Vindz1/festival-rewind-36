import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      // On ajoute ?q= dans l'URL pour permettre le rafraîchissement de page
      navigate(`/search-results?q=${encodeURIComponent(query)}`, { state: { results: data.results, query } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full px-4">
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="Hellfest, Wacken, Gojira..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 pr-32 bg-zinc-900 border-zinc-800 text-white rounded-2xl"
        />
        <Search className="absolute left-4 w-5 h-5 text-zinc-500" />
        <Button type="submit" disabled={loading} className="absolute right-2 bg-primary text-white px-6 rounded-xl font-bold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Trouver"}
        </Button>
      </div>
    </form>
  );
};
