import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Connexion à Spotify...');
  const [playlistUrl, setPlaylistUrl] = useState('');

  useEffect(() => {
    const processPlaylist = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      const pendingSongs = JSON.parse(localStorage.getItem('pending_songs') || '[]');

      if (code) {
        try {
          setStatus('Récupération de l\'accès...');
          const tokenRes = await fetch('/api/spotify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'token', code })
          });
          const { access_token } = await tokenRes.json();

          setStatus('Recherche des titres sur Spotify...');
          // On cherche les URIs Spotify pour chaque chanson
          const uris = [];
          for (const s of pendingSongs.slice(0, 50)) { // Limite à 50 pour le test
            const searchRes = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(s.title)} artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
              headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const searchData = await searchRes.json();
            if (searchData.tracks?.items?.[0]) uris.push(searchData.tracks.items[0].uri);
          }

          setStatus('Création de la playlist...');
          const createRes = await fetch('/api/spotify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'create', 
              accessToken: access_token, 
              playlistName: "Ma Time Capsule Live",
              uris 
            })
          });
          const finalData = await createRes.json();
          setPlaylistUrl(finalData.url);
          setStatus('Terminé !');
        } catch (e) {
          setStatus('Erreur lors de la création.');
        }
      }
    };
    processPlaylist();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      {!playlistUrl ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-xl font-medium">{status}</p>
        </>
      ) : (
        <div className="bg-zinc-900 p-10 rounded-3xl border border-primary/30 max-w-sm">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">C'est prêt !</h1>
          <p className="text-zinc-400 mb-8">Ta playlist a été ajoutée à ton compte Spotify.</p>
          <Button variant="fire" className="w-full h-14" onClick={() => window.open(playlistUrl, '_blank')}>
            Ouvrir dans Spotify
          </Button>
        </div>
      )}
    </div>
  );
}
