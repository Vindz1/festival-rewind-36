import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Création de votre playlist...");

  useEffect(() => {
    const createPlaylist = async () => {
      try {
        // Récupérer le code Spotify
        const code = searchParams.get('code');
        
        if (!code) {
          setStatus("error");
          setMessage("Aucun code d'autorisation reçu");
          setTimeout(() => navigate('/generate'), 3000);
          return;
        }

        // Appeler l'API pour créer la playlist
        const response = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (response.ok && data.playlistUrl) {
          setStatus("success");
          setMessage("Playlist créée avec succès !");
          
          // Rediriger vers Spotify après 2 secondes
          setTimeout(() => {
            window.location.href = data.playlistUrl;
          }, 2000);
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }

      } catch (error) {
        console.error('Erreur:', error);
        setStatus("error");
        setMessage("Erreur lors de la création de la playlist");
        setTimeout(() => navigate('/generate'), 3000);
      }
    };

    createPlaylist();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-xl">{message}</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <p className="text-xl text-green-500">{message}</p>
            <p className="text-sm text-gray-400 mt-2">Redirection vers Spotify...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-xl text-red-500">{message}</p>
            <p className="text-sm text-gray-400 mt-2">Retour à la page précédente...</p>
          </>
        )}
      </div>
    </div>
  );
}
