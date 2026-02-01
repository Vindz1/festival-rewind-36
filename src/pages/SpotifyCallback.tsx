import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ error }) => {
      if (error) navigate("/auth");
      else navigate("/generate"); // On renvoie l'utilisateur là où il voulait aller
    });
  }, [navigate]);

  return <div className="min-h-screen flex items-center justify-center">Finalisation de la connexion...</div>;
};

export default SpotifyCallback;
