import { useEffect, useState } from 'react';
import { useAuth } from '@/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Generate = () => {
  const { session, loading } = useAuth();
  const [status, setStatus] = useState('idle');

  const handleSpotifyConnect = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${window.location.origin}/spotify-callback`,
        scopes: 'playlist-modify-public playlist-modify-private',
      },
    });
  };

  if (loading) return <div>Chargement...</div>;

  // SI PAS DE TOKEN SPOTIFY : ON AFFICHE LE BOUTON ICI ET SEULEMENT ICI
  if (!session?.provider_token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl mb-4">Autorisation Spotify requise pour créer la playlist</h2>
        <Button onClick={handleSpotifyConnect} className="bg-[#1DB954] text-black font-bold">
          <Music className="mr-2" /> Connecter mon Spotify
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Ton code de génération qui fonctionnait avant */}
      <p>Prêt à générer !</p>
    </div>
  );
};

export default Generate;
