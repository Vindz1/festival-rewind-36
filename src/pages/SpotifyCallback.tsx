import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SpotifyCallback() {
  const [status, setStatus] = useState('Chargement...');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const run = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      const songs = JSON.parse(localStorage.getItem('pending_songs') || '[]');
      if (!code) return;

      try {
        setStatus('Récupération du token...');
        const res = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'token', code })
        });
        const { access_token } = await res.json();

        setStatus('Recherche et Création...');
        const uris = [];
        for (const s of songs.slice(0, 20)) {
          const sRes = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(s.title)}%20artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          const sData = await sRes.json();
          if (sData.tracks?.items?.[0]) uris.push(sData.tracks.items[0].uri);
        }

        const cRes = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', accessToken: access_token, uris })
        });
        const cData = await cRes.json();
        setUrl(cData.url);
      } catch (e) { setStatus('Erreur.'); }
    };
    run();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      {!url ? <><Loader2 className="animate-spin h-12 w-12 text-primary mb-4" /><p>{status}</p></> : (
        <div className="bg-zinc-900 p-10 rounded-3xl border border-primary/20">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
          <Button variant="fire" className="w-full h-14" onClick={() => window.open(url, '_blank')}>Ouvrir Spotify</Button>
        </div>
      )}
    </div>
  );
}
