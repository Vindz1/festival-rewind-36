import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// CORRECTION DE L'IMPORT :
import { useAuth } from "../AuthContext";

const SpotifyCallback = () => {
  const navigate = useNavigate();
  // On récupère la session pour vérifier si ça a marché
  const { session } = useAuth();

  useEffect(() => {
    // Supabase gère l'échange de code automatiquement via le hash de l'URL
    // On vérifie juste si la session est établie
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Erreur login Spotify:", error);
        navigate("/auth"); // Si échec, retour login
      } else {
        // Si succès, on attend un tout petit peu que le AuthContext se mette à jour
        setTimeout(() => {
            navigate("/"); // Retour à l'accueil
        }, 500);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-bold">Connexion avec Spotify...</h2>
      <p className="text-muted-foreground">Veuillez patienter un instant.</p>
    </div>
  );
};

export default SpotifyCallback;
