import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';

export default function SpotifyCallback() {
  const [status, setStatus] = useState('Initialisation...');
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const createPlaylist = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      const songs = JSON.parse(localStorage.getItem('pending_songs') || '[]');

      if (!code) {
        setError(true);
        setStatus("Code d'autorisation Spotify manquant.");
        return;
      }

      try {
        setStatus('Connexion à Spotify...');
        const tokenRes = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'token', code })
        });
        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) throw new Error("Erreur Token");

        setStatus('Recherche des morceaux...');
        const uris = [];
        // On traite les 30 premiers pour éviter les timeouts
        for (const s of songs.slice(0, 30)) {
          const sRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(s.title)}%20artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
          });
          const sData = await sRes.json();
          if (sData.tracks?.items?.[0]) uris.push(sData.tracks.items[0].uri);
        }

        setStatus('Création de la playlist...');
        const cRes = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'create', 
            accessToken: tokenData.access_token, 
            playlistName: "Ma Time Capsule Live", 
            uris 
          })
        });
        const cData = await cRes.json();
        setUrl(cData.url);
      } catch (e) {
        console.error(e);
        setError(true);
        setStatus("Une erreur est survenue lors de la création.");
      }
    };
    createPlaylist();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <Header />
      {error ? (
        <div className="bg-red-900/20 border border-red-500/50 p-8 rounded-3xl max-w-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold mb-4">{status}</p>
          <Button onClick={() => window.location.href = '/'} variant="outline">Retour à l'accueil</Button>
        </div>
      ) : !url ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-12 w-12 text-primary" />
          <p className="text-xl font-medium animate-pulse">{status}</p>
        </div>
      ) : (
        <div className="bg-zinc-900 p-10 rounded-3xl border border-primary/30 max-w-sm shadow-2xl">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4 italic text-white">C'est prêt !</h2>
          <p className="text-zinc-400 mb-8 font-medium">Tes souvenirs sont maintenant dans Spotify.</p>
          <Button variant="fire" className="w-full h-14 text-lg font-bold" onClick={() => window.open(url, '_blank')}>
            Ouvrir Spotify
          </Button>
        </div>
      )}
    </div>
  );
}
