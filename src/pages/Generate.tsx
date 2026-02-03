import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Music, Loader2, AlertCircle } from 'lucide-react'; // Ajout d'icône d'erreur

export default function Generate() {
  const { concerts } = useUserConcerts();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Nouvel état pour gérer les erreurs

  useEffect(() => {
    if (!concerts || concerts.length === 0) return;

    const loadSongs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Optimisation : On lance tous les appels en parallèle avec Promise.all
        const promises = concerts.map(async (concert) => {
            try {
                const response = await fetch(`/api/search?action=songs&setlistId=${concert.id}`);
                if (!response.ok) throw new Error('API Error');
                const data = await response.json();
                
                if (data.songs && Array.isArray(data.songs)) {
                    return data.songs.map(songTitle => ({
                        artist: concert.artist,
                        title: songTitle
                    }));
                }
                return [];
            } catch (err) {
                console.warn(`Erreur lors de la récupération pour le concert ${concert.id}`, err);
                return []; // On retourne un tableau vide pour ne pas bloquer tout le processus
            }
        });

        const results = await Promise.all(promises);
        // Aplatir le tableau de tableaux en un seul tableau de chansons
        const allSongs = results.flat();

        setSongs(allSongs);
      } catch (err) {
        console.error("Erreur globale lors du chargement des chansons:", err);
        setError("Impossible de charger les titres. Veuillez réessayer.");
      } finally {
        // Le loading s'arrête toujours, même en cas d'erreur
        setLoading(false);
      }
    };

    loadSongs();
  }, [concerts]);

  const exportToSpotify = () => {
    // 1. Sauvegarde des chansons pour la page de callback
    localStorage.setItem('pending_songs', JSON.stringify(songs));
    
    // 2. Construction propre de l'URL avec URLSearchParams
    const clientId = '927dd1fd048148d3b71cb0b9e109af6e'; // Idéalement, mets ça dans une var d'environnement
    const redirectUri = 'https://festivalrewind.vercel.app/spotify-callback';
    const scopes = [
        'playlist-modify-public',
        'playlist-modify-private' // Souvent nécessaire aussi
    ];

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        show_dialog: 'true' // Force l'écran de connexion pour être sûr
    });
    
    // 3. Redirection vers la VRAIE url Spotify
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="ml-4 text-gray-400">Analyse de {concerts.length} concerts...</p>
      </div>
    );
  }

  // Affichage en cas d'erreur API
  if (error) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-xl">{error}</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <Header />
      
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-gradient-fire">{songs.length}</span> TITRES
        </h1>
        
        <p className="text-gray-400 mb-12">
          Depuis {concerts.length} concert{concerts.length > 1 ? 's' : ''}
        </p>

        <Button 
          onClick={exportToSpotify}
          variant="fire"
          className="w-full max-w-md h-16 text-xl font-bold hover:scale-105 transition-transform"
          disabled={songs.length === 0} // Désactiver si aucune chanson trouvée
        >
          <Music className="mr-3" />
          Exporter vers Spotify
        </Button>
      </div>
    </div>
  );
}
