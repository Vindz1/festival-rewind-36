import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Loader2, Music } from 'lucide-react';

export default function Generate() {
  const { concerts } = useUserConcerts();
  const [songs, setSongs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllSongs = async () => {
      setLoading(true);
      const all: string[] = [];
      for (const c of concerts) {
        const res = await fetch(`/api/search?action=songs&setlistId=${c.id}`);
        const data = await res.json();
        if (data.songs) all.push(...data.songs.map((s: string) => `${c.artist} - ${s}`));
      }
      setSongs(all);
      setLoading(false);
    };
    if (concerts.length > 0) fetchAllSongs();
  }, [concerts]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 px-4 pb-32 text-center">
      <Header />
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 italic">Ta Time Capsule</h1>
        
        {loading ? (
          <div className="py-20"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /><p className="mt-4">Extraction des morceaux...</p></div>
        ) : (
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <p className="text-2xl font-bold mb-2">{songs.length} TITRES</p>
            <p className="text-zinc-500 mb-8">Compilés depuis tes {concerts.length} concerts.</p>
            <Button variant="fire" className="w-full h-16 text-xl font-bold">
              <Music className="mr-2 h-6 w-6"/> GÉNÉRER SUR SPOTIFY
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
