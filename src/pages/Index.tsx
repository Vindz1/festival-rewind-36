import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles, Crown, Check, ArrowRight } from 'lucide-react';
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
    
    // Vérifier que l'utilisateur existe sur setlist.fm
    try {
      const response = await fetch(`/api/search?action=user&username=${username}`);
      if (!response.ok) {
        toast.error('Utilisateur setlist.fm introuvable');
        setIsLoading(false);
        return;
      }
      
      // Stocker l'username dans localStorage
      localStorage.setItem('setlistfm_username', username);
      toast.success('Compte setlist.fm connecté !');
      
      // Rediriger vers Mes Concerts
      navigate('/my-concerts');
    } catch (error) {
      toast.error('Erreur de connexion à setlist.fm');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-fire shadow-fire mb-6">
            <Music className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl text-foreground mb-6">
            REVIVEZ VOS <span className="text-gradient-fire">CONCERTS</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transformez vos concerts en playlists Spotify personnalisées. 
            Retrouvez chaque moment musical de vos festivals préférés.
          </p>

          {/* Username form */}
          <form onSubmit={handleStart} className="max-w-md mx-auto mb-16">
            <div className="bg-card border border-border rounded-xl p-6">
              <label className="block text-sm font-medium text-muted-foreground mb-3 text-left">
                Commencez avec votre nom d'utilisateur setlist.fm
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="votre_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  variant="fire" 
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? 'Chargement...' : 'Commencer'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-left">
                Pas encore de compte setlist.fm ? <a href="https://www.setlist.fm/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Créez-en un gratuitement</a>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-3xl font-display text-center mb-12">
            CHOISISSEZ VOTRE <span className="text-gradient-fire">FORMULE</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Visiteur */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
                <h3 className="text-xl font-display">VISITEUR</h3>
              </div>
              <div className="text-3xl font-bold mb-6">
                Gratuit
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Lier votre setlist.fm</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Voir tous vos concerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Prévisualiser les playlists</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => document.querySelector('input')?.focus()}>
                Commencer
              </Button>
            </div>

            {/* Gratuit */}
            <div className="bg-card border border-primary/50 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-xs font-medium">
                POPULAIRE
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-display">GRATUIT</h3>
              </div>
              <div className="text-3xl font-bold mb-6">
                0€
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Tout du Visiteur</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm"><strong>2 playlists / an</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Export vers Spotify</span>
                </li>
              </ul>
              <Button variant="fire" className="w-full" onClick={() => navigate('/auth')}>
                S'inscrire gratuitement
              </Button>
            </div>

            {/* Premium */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-display text-yellow-500">PREMIUM</h3>
              </div>
              <div className="text-3xl font-bold mb-6">
                7,99€<span className="text-base font-normal text-muted-foreground">/an</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="text-sm">Tout du Gratuit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="text-sm"><strong>Playlists illimitées</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="text-sm">Statistiques détaillées</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="text-sm">Historique complet</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full border-yellow-500/50 hover:bg-yellow-500/10">
                Bientôt disponible
              </Button>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto mt-24 text-center"
        >
          <h2 className="text-3xl font-display mb-12">
            COMMENT ÇA <span className="text-gradient-fire">FONCTIONNE</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 rounded-full bg-gradient-fire flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-medium mb-2">Connectez setlist.fm</h3>
              <p className="text-sm text-muted-foreground">
                Liez votre compte pour accéder à vos concerts
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 rounded-full bg-gradient-fire flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-medium mb-2">Sélectionnez vos concerts</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez les concerts à inclure dans votre playlist
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 rounded-full bg-gradient-fire flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-medium mb-2">Exportez vers Spotify</h3>
              <p className="text-sm text-muted-foreground">
                Créez votre playlist et revivez vos souvenirs
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
