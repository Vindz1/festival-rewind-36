import { useState } from 'react';
import { Music, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Index = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Veuillez entrer votre nom d\'utilisateur setlist.fm');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/search?action=user&username=${username}`);
      if (!response.ok) {
        toast.error('Utilisateur setlist.fm introuvable');
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem('setlistfm_username', username);
      toast.success('Compte setlist.fm connecté !');
      navigate('/my-concerts');
    } catch (error) {
      toast.error('Erreur de connexion à setlist.fm');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header stats - Style setlist.fm */}
      <div className="bg-[#2d2d2d] border-b border-[#404040]">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded bg-[#4d94ff] flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">setlistmemory</h1>
              <p className="text-sm text-[#a0a0a0]">Transformez vos concerts en playlists Spotify</p>
            </div>
          </div>

          {/* Stats - Style setlist.fm */}
          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-2xl font-bold text-white">9.6M</span>
              <span className="text-[#a0a0a0] ml-2">setlists</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">430k</span>
              <span className="text-[#a0a0a0] ml-2">artistes</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">∞</span>
              <span className="text-[#a0a0a0] ml-2">souvenirs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-12">
        {/* Quick start */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-xl font-semibold text-white mb-4">Commencer</h2>
          <form onSubmit={handleStart} className="bg-[#2d2d2d] border border-[#404040] rounded p-6">
            <label className="block text-sm text-[#a0a0a0] mb-2">
              Nom d'utilisateur setlist.fm
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="votre_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-[#3d3d3d] border-[#404040] text-white placeholder:text-[#606060] focus:border-[#4d94ff]"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white px-6"
              >
                {isLoading ? 'Chargement...' : 'Continuer'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <p className="text-xs text-[#a0a0a0] mt-2">
              Pas de compte ? <a href="https://www.setlist.fm/signup" target="_blank" rel="noopener noreferrer" className="text-[#4d94ff] hover:underline">Créez-en un gratuitement</a>
            </p>
          </form>
        </div>

        {/* Pricing - Style sobre setlist.fm */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-white mb-6">Formules</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Visiteur */}
            <div className="bg-[#2d2d2d] border border-[#404040] rounded p-6">
              <h3 className="text-base font-semibold text-white mb-1">Visiteur</h3>
              <div className="text-2xl font-bold text-white mb-4">Gratuit</div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                  <Check className="w-4 h-4 text-[#4d94ff] shrink-0 mt-0.5" />
                  Lier setlist.fm
                </li>
                <li className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                  <Check className="w-4 h-4 text-[#4d94ff] shrink-0 mt-0.5" />
                  Voir vos concerts
                </li>
                <li className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                  <Check className="w-4 h-4 text-[#4d94ff] shrink-0 mt-0.5" />
                  Prévisualiser playlists
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full border-[#404040] text-white hover:bg-[#3d3d3d]"
                onClick={() => document.querySelector('input')?.focus()}
              >
                Commencer
              </Button>
            </div>

            {/* Gratuit */}
            <div className="bg-[#2d2d2d] border-2 border-[#4d94ff] rounded p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4d94ff] px-3 py-1 rounded text-xs font-medium text-white">
                RECOMMANDÉ
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Gratuit</h3>
              <div className="text-2xl font-bold text-white mb-4">0€</div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                  <Check className="w-4 h-4 text-[#4d94ff] shrink-0 mt-0.5" />
                  Tout du Visiteur
                </li>
                <li className="flex items-start gap-2 text-sm text-white">
                  <Check className="w-4 h-4 text-[#4d94ff] shrink-0 mt-0.5" />
                  <strong>2 playlists / an</strong>
                </li>
                <li className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                  <Check className="w-4 h-4 text-[#4d94ff] shrink-0 mt-0.5" />
                  Export Spotify
                </li>
              </ul>
              <Button 
                className="w-full bg-[#4d94ff] hover:bg-[#6ba6ff] text-white"
                onClick={() => navigate('/auth')}
              >
                S'inscrire
              </Button>
            </div>

            {/* Premium */}
            <div className="bg-[#2d2d2d] border border-[#404040] rounded p-6">
              <h3 className="text-base font-semibold text-[#ffd700] mb-1">Premium</h3>
              <div className="text-2xl font-bold text-white mb-4">
                7,99€<span className="text-sm font-normal text-[#a0a0a0]">/an</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                  <Check className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
                  Tout du Gratuit
                </li>
                <li className="flex items-start gap-2 text-sm text-white">
                  <Check className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
                  <strong>Playlists illimitées</strong>
                </li>
                <li className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                  <Check className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
                  Statistiques détaillées
                </li>
                <li className="flex items-start gap-2 text-sm text-[#a0a0a0]">
                  <Check className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
                  Historique complet
                </li>
              </ul>
              <Button 
                variant="outline"
                className="w-full border-[#404040] text-white hover:bg-[#3d3d3d]"
                disabled
              >
                Bientôt disponible
              </Button>
            </div>
          </div>
        </div>

        {/* How it works - Style simple */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-xl font-semibold text-white mb-6">Comment ça fonctionne</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#2d2d2d] border border-[#404040] rounded p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-[#4d94ff] flex items-center justify-center text-lg font-bold mx-auto mb-3 text-white">
                1
              </div>
              <h3 className="font-medium text-white mb-2 text-sm">Connectez setlist.fm</h3>
              <p className="text-xs text-[#a0a0a0]">
                Liez votre compte pour accéder à vos concerts
              </p>
            </div>
            
            <div className="bg-[#2d2d2d] border border-[#404040] rounded p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-[#4d94ff] flex items-center justify-center text-lg font-bold mx-auto mb-3 text-white">
                2
              </div>
              <h3 className="font-medium text-white mb-2 text-sm">Sélectionnez vos concerts</h3>
              <p className="text-xs text-[#a0a0a0]">
                Choisissez les concerts à inclure
              </p>
            </div>
            
            <div className="bg-[#2d2d2d] border border-[#404040] rounded p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-[#4d94ff] flex items-center justify-center text-lg font-bold mx-auto mb-3 text-white">
                3
              </div>
              <h3 className="font-medium text-white mb-2 text-sm">Exportez vers Spotify</h3>
              <p className="text-xs text-[#a0a0a0]">
                Créez votre playlist et revivez vos souvenirs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
