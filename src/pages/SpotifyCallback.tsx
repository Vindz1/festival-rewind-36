import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Music } from "lucide-react";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [currentTrack, setCurrentTrack] = useState("");
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [playlistUrl, setPlaylistUrl] = useState("");

  useEffect(() => {
    const createPlaylist = async () => {
      try {
        const code = searchParams.get('code');
        
        if (!code) {
          setStatus("error");
          setTimeout(() => navigate('/generate'), 3000);
          return;
        }

        const pendingSongs = JSON.parse(localStorage.getItem('pending_songs') || '[]');
        const playlistName = localStorage.getItem('playlist_name');
        
        setTotal(pendingSongs.length);
        setCurrentTrack('Création de la playlist...');

        // 1. Créer la playlist et récupérer le token
        const response = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, playlistName })
        });

        const data = await response.json();

        if (!response.ok || !data.accessToken) {
          throw new Error(data.error || 'Erreur création playlist');
        }

        const { accessToken, playlistId, playlistUrl: url } = data;
        setPlaylistUrl(url);

        // 2. Rechercher et ajouter les tracks côté client
        const trackUris = [];

        for (let i = 0; i < pendingSongs.length; i++) {
          const song = pendingSongs[i];
          setCurrentTrack(`${song.title} - ${song.artist}`);
          setProcessed(i + 1);

          try {
            // Si URI déjà présent
            if (song.uri) {
              trackUris.push(song.uri);
              continue;
            }

            // Chercher sur Spotify
            const searchQuery = encodeURIComponent(`${song.title} ${song.artist}`);
            const searchResponse = await fetch(
              `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            const searchData = await searchResponse.json();

            if (searchData.tracks?.items?.[0]) {
              trackUris.push(searchData.tracks.items[0].uri);
            }

            // Ajouter par batch de 100 toutes les 100 chansons
            if (trackUris.length === 100 || i === pendingSongs.length - 1) {
              if (trackUris.length > 0) {
                await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ uris: trackUris })
                });
                trackUris.length = 0; // Vider pour le prochain batch
              }
            }

          } catch (err) {
            console.error(`Erreur ${song.title}:`, err);
          }
        }

        // 3. Terminé !
        setStatus("success");
        setCurrentTrack(`${processed} morceaux ajoutés !`);

        setTimeout(() => {
          window.open(url, '_blank');
          navigate('/generate');
        }, 2000);

      } catch (error) {
        console.error('Erreur:', error);
        setStatus("error");
        setCurrentTrack("Erreur lors de la création");
        setTimeout(() => navigate('/generate'), 3000);
      }
    };

    createPlaylist();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-2xl w-full">
        {status === "loading" && (
          <>
            <Music className="w-16 h-16 mx-auto mb-6 text-primary animate-pulse" />
            
            <div className="mb-6">
              <div className="text-6xl font-bold mb-2">
                <span className="text-gradient-fire">{processed}</span>
                <span className="text-gray-600"> / {total}</span>
              </div>
              <p className="text-sm text-gray-500">morceaux traités</p>
            </div>

            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <p className="text-sm text-gray-400 mb-2">En cours :</p>
              <p className="text-lg font-medium truncate">{currentTrack}</p>
            </div>

            <p className="text-xs text-gray-600 mt-6">
              Cela peut prendre quelques minutes...
            </p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <p className="text-2xl text-green-500 mb-2">Playlist créée !</p>
            <p className="text-gray-400">{currentTrack}</p>
            <p className="text-sm text-gray-500 mt-4">Ouverture de Spotify...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-xl text-red-500">{currentTrack}</p>
            <p className="text-sm text-gray-400 mt-2">Retour...</p>
          </>
        )}
      </div>
    </div>
  );
}
