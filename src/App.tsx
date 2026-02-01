import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
import { useAuth } from "@/AuthContext"; // IMPORT CORRIGÉ

const Auth = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const handleSpotifyLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "spotify",
        options: {
          // Important : rediriger vers la page Callback qu'on vient de réparer
          redirectTo: `${window.location.origin}/spotify-callback`,
          scopes: "user-read-email playlist-modify-public playlist-modify-private user-top-read",
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 noise">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-display">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous pour générer vos playlists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSpotifyLogin}
            className="w-full h-12 text-lg font-bold gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black"
          >
            <Music className="w-5 h-5" />
            Continuer avec Spotify
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
