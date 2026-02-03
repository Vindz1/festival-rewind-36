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
      <div className="text-center max-w-md">

        
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
