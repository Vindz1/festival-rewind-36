import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Music, Loader2 } from 'lucide-react';

export default function Generate() {
  const { concerts } = useUserConcerts();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (concerts.length === 0) return;

    const loadSongs = async () => {
      setLoading(true);
      const allSongs = [];
      
      for (const concert of concerts) {
        const response = await fetch(`/api/search?action=songs&setlistId=${concert.id}`);
        const data = await response.json();
        
        if (data.songs) {
          data.songs.forEach(songTitle => {
            allSongs.push({ 
              artist: concert.artist, 
              title: songTitle 
            });
          });
        }
      }
      
      setSongs(allSongs);
      setLoading(false);
    };

    loadSongs();
  }, [concerts]);

  const exportToSpotify = () => {
    localStorage.setItem('pending_songs', JSON.stringify(songs));
    
    const spotifyAuthUrl = 'https://accounts.spotify.com/authorize?' + 
      'client_id=927dd1fd048148d3b71cb0b9e109af6e' +
      '&response_type=code' +
      '&redirect_uri=https://festivalrewind.vercel.app/spotify-callback' +
      '&scope=playlist-modify-public';
    
    window.location.href = spotifyAuthUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <Header />
      
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-gradient-fire">{songs.length}</span> TITRES
        </h1>
        
        <p className="text-gray-400 mb-12">
          Depuis {concerts.length} concert{concerts.length > 1 ? 's' : ''}
        </p>

        <Button 
          onClick={exportToSpotify}
          variant="fire"
          className="w-full max-w-md h-16 text-xl font-bold"
        >
          <Music className="mr-3" />
          Exporter vers Spotify
        </Button>
      </div>
    </div>
  );
}
