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
        try {
          const res = await fetch(`/api/search?action=songs&setlistId=${c.id}`);
          const data = await res.json();
          if (data.songs) {
            data.songs.forEach((s: string) => all.push({ artist: c.artist, title: s }));
          }
        } catch (e) { console.error("Erreur:", e); }
      }
      setSongs(all);
      setLoading(false);
    };
    if (concerts.length > 0) fetchSongs();
  }, [concerts]);

  const handleSpotify = () => {
    const client_id = "927dd1fd048148d3b71cb0b9e109af6e";
    // ATTENTION : Cette URL doit être IDENTIQUE à celle du Dashboard Spotify
    const redirect_uri = "https://festival-rewind-36.vercel.app/spotify-callback";
    const scope = "playlist-modify-public";
    
    localStorage.setItem('pending_songs', JSON.stringify(songs));
    
    // URL OFFICIELLE DE SPOTIFY (Pas de googleusercontent ici)
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = spotifyAuthUrl;
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 text-center">
      <Header />
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 italic text-primary">Ma Time Capsule</h1>
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-zinc-500">Préparation des morceaux...</p>
          </div>
        ) : (
          <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-2xl">
            <p className="text-6xl font-bold text-white mb-2">{songs.length}</p>
            <p className="text-zinc-500 uppercase tracking-widest mb-10 font-bold">Titres prêts</p>
            <Button onClick={handleSpotify} variant="fire" className="w-full h-16 text-xl font-bold rounded-2xl">
              <Music className="mr-3" /> RELIER À SPOTIFY
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
