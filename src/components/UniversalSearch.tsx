import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Music, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const UniversalSearch = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', year: '' });
  const navigate = useNavigate();

  const handleSearch = async (mode: 'searchFestivals' | 'searchArtists') => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        action: mode, 
        name: form.name, 
        city: form.city, 
        year: form.year 
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      navigate(`/search-results?q=${encodeURIComponent(form.name)}`, { state: { results: data.results, query: form.name } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
      <Tabs defaultValue="festival" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40">
          <TabsTrigger value="festival">Rechercher un Festival</TabsTrigger>
          <TabsTrigger value="artist">Rechercher un Artiste</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1">
            <label className="text-xs text-zinc-500 ml-2 mb-1 block uppercase font-bold">Nom</label>
            <Input 
              placeholder="Hellfest, Gojira..." 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              className="bg-black/50 border-zinc-700 h-12"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 ml-2 mb-1 block uppercase font-bold">Ville (Optionnel)</label>
            <Input 
              placeholder="Clisson, Paris..." 
              value={form.city} 
              onChange={e => setForm({...form, city: e.target.value})}
              className="bg-black/50 border-zinc-700 h-12"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 ml-2 mb-1 block uppercase font-bold">Année (Optionnel)</label>
            <Input 
              placeholder="2016, 2024..." 
              value={form.year} 
              onChange={e => setForm({...form, year: e.target.value})}
              className="bg-black/50 border-zinc-700 h-12"
            />
          </div>
        </div>

        <TabsContent value="festival">
          <Button onClick={() => handleSearch('searchFestivals')} disabled={loading} className="w-full h-14 text-lg font-bold bg-primary">
            {loading ? <Loader2 className="animate-spin" /> : "Explorer les éditions"}
          </Button>
        </TabsContent>

        <TabsContent value="artist">
          <Button onClick={() => handleSearch('searchArtists')} disabled={loading} className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="animate-spin" /> : "Trouver les concerts"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
