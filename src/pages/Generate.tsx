import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Loader2, Music, CheckCircle2 } from 'lucide-react';

export default function Generate() {
  const { concerts } = useUserConcerts();
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'searching' | 'done'>('idle');

  useEffect(() => {
    const fetchAllSongs = async () => {
      setLoading(true);
      const all: any[] = [];
      for (const c of concerts) {
        const res = await fetch(`/api/search?action=songs&setlistId=${c.id}`);
        const data = await res.json();
        if (data.songs) {
          data.songs.forEach((s: string) => all.push({ artist: c.artist, title: s }));
        }
      }
      setSongs(all);
      setLoading(false);
    };
    if (concerts.length > 0) fetchAllSongs();
  }, [concerts]);

  const handleSpotifyAuth = () => {
    const client_id = "927dd1fd048148d3b71cb0b9e109af6e"; // Remplace par ton ID réel
    const redirect_uri = "https://festivalrewind-mcecz1qjn-vindz1s-projects.vercel.app/spotify-callback";
    const scope = "playlist-modify-public";
    
    const url = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`;
    
    // On sauvegarde les chansons localement avant de partir vers Spotify
    localStorage.setItem('pending_songs', JSON.stringify(songs));
    window.location.href = url;
  };

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
            <Button onClick={handleSpotifyAuth} variant="fire" className="w-full h-16 text-xl font-bold">
              <Music className="mr-2 h-6 w-6"/> GÉNÉRER SUR SPOTIFY
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
