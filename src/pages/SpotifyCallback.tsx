import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Création de votre playlist...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const createPlaylist = async () => {
      console.log('🎯 SpotifyCallback démarré');
      
      try {
        const code = searchParams.get('code');
        console.log('📝 Code:', code);
        
        if (!code) {
          console.log('❌ Pas de code');
          setStatus("error");
          setMessage("Aucun code d'autorisation reçu");
          setTimeout(() => navigate('/generate'), 3000);
          return;
        }

        const pendingSongs = localStorage.getItem('pending_songs');
        const playlistName = localStorage.getItem('playlist_name');
        
        console.log('💾 Songs:', pendingSongs ? JSON.parse(pendingSongs).length : 0);
        console.log('📋 Name:', playlistName);
        
        setProgress(10);
        setMessage("Connexion à Spotify...");
        console.log('🚀 Appel API...');

        // Animer la barre pendant que l'API travaille
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 85) return prev + 5;
            return prev;
          });
        }, 2000);

        const response = await fetch('/api/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code,
            pendingSongs,
            playlistName
          })
        });

        clearInterval(progressInterval);
        setProgress(90);
        setMessage("Finalisation...");
        
        console.log('📨 Status:', response.status);
        const data = await response.json();
        console.log('📦 Data:', data);

        if (response.ok && data.playlistUrl) {
          setProgress(100);
          setStatus("success");
          setMessage(`Playlist créée avec ${data.tracksAdded || 0} morceaux !`);
          setTimeout(() => {
            window.location.href = data.playlistUrl;
          }, 2000);
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }

      } catch (error) {
        console.error('❌ Erreur:', error);
        setStatus("error");
        setMessage("Erreur lors de la création de la playlist");
        setTimeout(() => navigate('/generate'), 3000);
      }
    };

    createPlaylist();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-xl mb-4">{message}</p>
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-gray-400 mt-2">{progress}%</p>
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
