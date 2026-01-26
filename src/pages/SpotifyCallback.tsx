import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SpotifyCallback() {
  const [status, setStatus] = useState('Connexion...');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const create = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      const songs = JSON.parse(localStorage.getItem('pending_songs') || '[]');

      if (code) {
        const res = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'token', code })
        });
        const { access_token } = await res.json();

        setStatus('Recherche et création...');
        const uris = [];
        for (const s of songs.slice(0, 50)) {
          const sRes = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(s.title)} artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          const sData = await sRes.json();
          if (sData.tracks?.items?.[0]) uris.push(sData.tracks.items[0].uri);
        }

        const cRes = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', accessToken: access_token, playlistName: "Ma Time Capsule Live", uris })
        });
        const cData = await cRes.json();
        setUrl(cData.url);
      }
    };
    create();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      {!url ? (
        <><Loader2 className="animate-spin h-10 w-10 text-primary mb-4" /><p>{status}</p></>
      ) : (
        <div className="text-center p-10 bg-zinc-900 rounded-3xl border border-primary/30">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-6">Playlist créée !</h2>
          <Button variant="fire" onClick={() => window.open(url, '_blank')}>Ouvrir Spotify</Button>
        </div>
      )}
    </div>
  );
}
