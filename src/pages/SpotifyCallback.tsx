import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';

export default function SpotifyCallback() {
  const [status, setStatus] = useState('Récupération de la clé Spotify...');
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const processPlaylist = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const pendingSongs = JSON.parse(localStorage.getItem('pending_songs') || '[]');

      if (!code) {
        setError(true);
        setStatus("Erreur : Aucun code reçu de Spotify.");
        return;
      }

      try {
        setStatus('Connexion au serveur...');
        const res = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'token', code })
        });
        const data = await res.json();

        if (!data.access_token) throw new Error("Token manquant");

        setStatus('Recherche des morceaux (Top 20)...');
        const uris = [];
        // On se limite à 20 pour être sûr que le serveur ne coupe pas la connexion (timeout)
        for (const s of pendingSongs.slice(0, 20)) {
          const searchRes = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(s.title)}%20artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
          });
          const searchData = await searchRes.json();
          if (searchData.tracks?.items?.[0]) uris.push(searchData.tracks.items[0].uri);
        }

        setStatus('Création de ta playlist...');
        const createRes = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'create', 
            accessToken: data.access_token, 
            playlistName: "Ma Time Capsule Live", 
            uris 
          })
        });
        const finalData = await createRes.json();
        setUrl(finalData.url);
      } catch (err) {
        console.error(err);
        setError(true);
        setStatus("Le serveur a mis trop de temps à répondre ou une erreur est survenue.");
      }
    };

    processPlaylist();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-sans">
      <Header />
      {!url ? (
        <div className="space-y-6">
          {error ? <AlertCircle className="h-16 w-16 text-red-500 mx-auto" /> : <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />}
          <p className="text-xl font-bold tracking-tight">{status}</p>
          {error && <Button onClick={() => window.location.href = '/'} variant="outline">Réessayer</Button>}
        </div>
      ) : (
        <div className="bg-zinc-900 p-12 rounded-[2rem] border border-primary/20 shadow-2xl max-w-sm animate-in fade-in zoom-in duration-500">
          <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4 italic">C'est prêt !</h2>
          <p className="text-zinc-400 mb-10 leading-relaxed">Ta Time Capsule est maintenant disponible sur ton compte Spotify.</p>
          <Button variant="fire" className="w-full h-16 text-xl font-bold rounded-2xl shadow-lg shadow-primary/20" onClick={() => window.open(url, '_blank')}>
            Ouvrir Spotify
          </Button>
        </div>
      )}
    </div>
  );
}
