import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      navigate('/');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {/* Card */}
        <div className="bg-[#2d2d2d] border border-[#404040] rounded p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 justify-center mb-6">
            <Music className="w-6 h-6 text-[#4d94ff]" />
            <span className="text-xl font-semibold text-white">
              setlist<span className="text-[#4d94ff]">memory</span>
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-white text-center mb-6">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h1>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-[#a0a0a0] mb-1.5">
                Email
              </label>
              <Input 
                type="email" 
                placeholder="votre@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="bg-[#3d3d3d] border-[#404040] text-white placeholder:text-[#606060] focus:border-[#4d94ff]"
                required 
              />
            </div>

            <div>
              <label className="block text-sm text-[#a0a0a0] mb-1.5">
                Mot de passe
              </label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="bg-[#3d3d3d] border-[#404040] text-white placeholder:text-[#606060] focus:border-[#4d94ff]"
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#4d94ff] hover:bg-[#6ba6ff] text-white"
              disabled={loading}
            >
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#a0a0a0] hover:text-[#4d94ff] transition-colors"
            >
              {isLogin ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-[#606060] mt-6">
          En vous connectant, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  );
};

export default Auth;
