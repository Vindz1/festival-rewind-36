import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Connexion à Spotify...');

  useEffect(() => {
    const handleCallback = async () => {
      // Récupérer le code depuis l'URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      if (errorParam) {
        setError('Vous avez refusé l\'autorisation Spotify');
        setTimeout(() => navigate('/generate'), 3000);
        return;
      }

      if (!code) {
        setError('Aucun code d\'autorisation reçu');
        setTimeout(() => navigate('/generate'), 3000);
        return;
      }

      try {
        // Échanger le code contre un access token
        const response = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'token',
            code: code
          })
        });

        const data = await response.json();
        
        // Afficher la réponse pour debug
        console.log('Réponse Spotify:', data);

        if (!response.ok || data.error) {
          throw new Error(data.error_description || data.error || 'Erreur lors de l\'échange du code');
        }

        if (data.access_token) {
          // Stocker le token
          localStorage.setItem('spotify_access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('spotify_refresh_token', data.refresh_token);
          }

          // Récupérer les chansons en attente
          const pendingSongs = localStorage.getItem('pending_songs');
          
          if (pendingSongs) {
            const songs = JSON.parse(pendingSongs);
            
            // Chercher chaque chanson sur Spotify pour obtenir son URI
            setStatusMessage('Recherche des morceaux sur Spotify...');
            const trackUris: string[] = [];
            for (let i = 0; i < songs.length; i++) {
              const song = songs[i];
              setProgress(Math.round(((i + 1) / songs.length) * 80)); // 80% pour la recherche
              
              try {
                const searchQuery = encodeURIComponent(`${song.title} ${song.artist}`);
                const searchRes = await fetch(
                  `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`,
                  {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                  }
                );
                const searchData = await searchRes.json();
                
                if (searchData.tracks?.items?.[0]) {
                  trackUris.push(searchData.tracks.items[0].uri);
                }
              } catch (err) {
                console.error(`Erreur recherche: ${song.title}`, err);
              }
            }
            
            // Créer la playlist
            setStatusMessage('Création de la playlist...');
            setProgress(90);
            const createResponse = await fetch('/api/spotify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create',
                accessToken: data.access_token,
                uris: trackUris
              })
            });

            const playlist = await createResponse.json();
            
            if (playlist.url) {
              // Nettoyer le localStorage
              localStorage.removeItem('pending_songs');
              setStatusMessage('Playlist créée avec succès !');
              setProgress(100);
              // Rediriger vers Spotify
              setTimeout(() => {
                window.location.href = playlist.url;
              }, 500);
            } else {
              navigate('/generate');
            }
          } else {
            navigate('/generate');
          }
        } else {
          throw new Error('Pas de token reçu');
        }
      } catch (err) {
        console.error('Erreur callback:', err);
        setError('Erreur lors de la connexion à Spotify');
        setTimeout(() => navigate('/generate'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {error ? (
          <>
            <p className="text-red-500 text-xl mb-4">{error}</p>
            <p className="text-gray-400">Redirection...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-xl mb-2">{statusMessage}</p>
            {progress > 0 && (
              <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {progress > 0 && <p className="text-sm text-gray-400">{progress}%</p>}
          </>
        )}
      </div>
    </div>
  );
}
