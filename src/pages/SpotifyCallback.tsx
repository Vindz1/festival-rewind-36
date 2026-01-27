import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SpotifyCallback() {
  const [status, setStatus] = useState('Traitement...');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const process = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      const songs = JSON.parse(localStorage.getItem('pending_songs') || '[]');

      if (code) {
        try {
          setStatus('Accès Spotify...');
          const res = await fetch('/api/spotify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'token', code })
          });
          const { access_token } = await res.json();

          setStatus('Synchronisation des morceaux...');
          const uris = [];
          for (const s of songs.slice(0, 25)) {
            const searchRes = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(s.title)}%20artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
              headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const sData = await searchRes.json();
            if (sData.tracks?.items?.[0]) uris.push(sData.tracks.items[0].uri);
          }

          setStatus('Création de la playlist...');
          const cRes = await fetch('/api/spotify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', accessToken: access_token, uris })
          });
          const cData = await cRes.json();
          setUrl(cData.url);
        } catch (e) { setStatus('Erreur de création.'); }
      }
    };
    process();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      {!url ? (
        <><Loader2 className="animate-spin h-12 w-12 text-primary mb-4" /><p>{status}</p></>
      ) : (
        <div className="bg-zinc-900 p-10 rounded-3xl border border-primary/20">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-8 italic">C'est prêt !</h2>
          <Button variant="fire" className="w-full h-14" onClick={() => window.open(url, '_blank')}>Ouvrir Spotify</Button>
        </div>
      )}
    </div>
  );
}
