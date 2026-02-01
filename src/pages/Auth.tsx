import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Mail, Lock, ArrowRight, Eye, EyeOff, Music } from 'lucide-react'; // Ajout Music
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from "../AuthContext";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth(); // On récupère la session du contexte

  // Redirection automatique si déjà connecté
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  // FONCTION INDISPENSABLE : Connexion Spotify
  const handleSpotifyLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          // L'URL de retour doit correspondre à votre config Spotify Dashboard et App.tsx
          redirectTo: `${window.location.origin}/spotify-callback`,
          scopes: 'user-read-email playlist-modify-public playlist-modify-private user-top-read',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error("Erreur Spotify : " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success('Vérifiez vos emails !');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-dark" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-fire shadow-fire mb-4">
              <Flame className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl text-foreground uppercase">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h1>
          </div>

          {/* BOUTON SPOTIFY - LE PLUS IMPORTANT */}
          <Button 
            onClick={handleSpotifyLogin}
            type="button"
            className="w-full h-12 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold gap-3 mb-6"
          >
            <Music className="w-5 h-5" />
            Continuer avec Spotify
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou avec email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="fire" className="w-full" disabled={isLoading}>
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-foreground">
              {isLogin ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
