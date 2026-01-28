import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

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
            const trackUris: string[] = [];
            for (const song of songs) {
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
              // Rediriger vers Spotify
              window.location.href = playlist.url;
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-500 text-xl mb-4">{error}</p>
            <p className="text-gray-400">Redirection...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-xl">Connexion à Spotify en cours...</p>
          </>
        )}
      </div>
    </div>
  );
}
