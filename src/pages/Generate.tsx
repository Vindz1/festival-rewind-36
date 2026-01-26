import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Loader2, Music } from 'lucide-react';

export default function Generate() {
  const { concerts } = useUserConcerts();
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      const all: any[] = [];
      for (const c of concerts) {
        // On récupère les morceaux pour chaque concert coché
        const res = await fetch(`/api/search?action=songs&setlistId=${c.id}`);
        const data = await res.json();
        if (data.songs) data.songs.forEach((s: string) => all.push({ artist: c.artist, title: s }));
      }
      setSongs(all);
      setLoading(false);
    };
    if (concerts.length > 0) fetchSongs();
  }, [concerts]);

  const handleSpotify = () => {
    const client_id = "927dd1fd048148d3b71cb0b9e109af6e";
    // On utilise l'adresse officielle de ton projet
    const redirect_uri = "https://festival-rewind-36.vercel.app/spotify-callback";
    const scope = "playlist-modify-public";
    
    localStorage.setItem('pending_songs', JSON.stringify(songs));
    
    // LA VRAIE URL D'AUTHENTIFICATION SPOTIFY
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`;
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 text-center">
      <Header />
      <div className="max-w-xl mx-auto">
        {loading ? (
          <div className="py-20">
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-zinc-500 italic">Extraction des setlists...</p>
          </div>
        ) : (
          <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-2xl">
            <h1 className="text-5xl font-bold mb-4 italic text-primary tracking-tighter">{songs.length}</h1>
            <p className="text-xl font-medium mb-2 uppercase tracking-widest">Titres identifiés</p>
            <p className="text-zinc-500 mb-10">Prêts à être mixés dans ta Time Capsule Spotify.</p>
            <Button onClick={handleSpotify} variant="fire" className="w-full h-16 text-xl font-bold rounded-2xl shadow-lg shadow-primary/20">
              <Music className="mr-3 h-6 w-6" /> GÉNÉRER SUR SPOTIFY
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
