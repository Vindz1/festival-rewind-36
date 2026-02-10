import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Music, CheckCircle2, Globe, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';

export default function Index() {
  const [query, setQuery] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'search' | 'profile'>('search'); // 'search' ou 'profile'
  const navigate = useNavigate();

  // Au chargement, on regarde si on connaît déjà l'utilisateur
  useEffect(() => {
    const savedUser = localStorage.getItem('setlistfm_username');
    if (savedUser) setUsername(savedUser);
  }, []);

  // 1. RECHERCHE D'ARTISTE
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // 2. CONNEXION SETLIST.FM (Juste le pseudo)
  const handleProfileConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      // On sauvegarde le pseudo pour la page "Mes Concerts"
      localStorage.setItem('setlistfm_username', username.trim());
      toast.success(`Profil ${username} connecté !`);
      // On redirige vers la page "Mes Concerts" qui va charger l'historique
      navigate('/my-concerts');
    } else {
        toast.error("Veuillez entrer un pseudo Setlist.fm");
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Header />

      {/* HERO SECTION */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-32 pb-16 text-center relative overflow-hidden">
        
        {/* Fond animé */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        <div className="animate-in fade-in zoom-in duration-700 slide-in-from-bottom-8 max-w-4xl mx-auto w-full">
          
          {/* Badge "Universel" */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#333] border border-[#404040] text-xs font-bold uppercase tracking-widest text-[#a0a0a0] mb-8">
            <Globe className="w-3 h-3 text-[#4d94ff]" />
            Compatible Spotify • Deezer • Apple Music
          </div>

          <h1 className="text-4xl md:text-7xl font-black italic text-white leading-[0.9] tracking-tighter mb-6">
            VOS CONCERTS.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#a361ff] to-[#ff4d94]">EN PLAYLIST.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#a0a0a0] max-w-2xl mx-auto mb-10 font-medium">
            Retrouvez la setlist exacte de n'importe quel concert et exportez-la vers <strong className="text-white">votre plateforme préférée</strong>.
          </p>

          {/* --- LA BOITE A OUTILS --- */}
          <div className="max-w-xl mx-auto bg-[#252525] border border-[#404040] rounded-3xl p-2 shadow-2xl">
              
              {/* Le Switcher (Onglets) */}
              <div className="flex p-1 bg-[#1a1a1a] rounded-2xl mb-4">
                  <button 
                    onClick={() => setMode('search')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${mode === 'search' ? 'bg-[#404040] text-white shadow' : 'text-[#666] hover:text-[#a0a0a0]'}`}
                  >
                    🔍 Chercher un Concert
                  </button>
                  <button 
                    onClick={() => setMode('profile')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${mode === 'profile' ? 'bg-[#4d94ff] text-white shadow' : 'text-[#666] hover:text-[#a0a0a0]'}`}
                  >
                    👤 Mon Profil Setlist.fm
                  </button>
              </div>

              {/* MODE 1 : RECHERCHE */}
              {mode === 'search' && (
                  <form onSubmit={handleSearch} className="relative flex items-center p-2">
                    <Search className="absolute left-6 w-5 h-5 text-[#a0a0a0]" />
                    <Input 
                        type="text" 
                        placeholder="Artiste, Festival ou Lieu..." 
                        className="border-0 bg-[#1a1a1a] rounded-xl focus-visible:ring-1 focus-visible:ring-[#4d94ff] text-lg placeholder:text-[#444] h-14 pl-12 pr-4 w-full"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button type="submit" size="lg" className="absolute right-3 rounded-lg bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold h-10 px-4">
                        GO
                    </Button>
                  </form>
              )}

              {/* MODE 2 : PROFIL (C'est ça qu'il manquait !) */}
              {mode === 'profile' && (
                  <form onSubmit={handleProfileConnect} className="relative flex flex-col p-4 gap-4 animate-in fade-in slide-in-from-right-4">
                    <div className="text-left">
                        <label className="text-xs text-[#a0a0a0] font-bold uppercase ml-1">Votre pseudo Setlist.fm</label>
                        <div className="relative mt-1">
                            <User className="absolute left-4 top-3.5 w-5 h-5 text-[#a0a0a0]" />
                            <Input 
                                type="text" 
                                placeholder="ex: MetalFan85" 
                                className="border border-[#404040] bg-[#1a1a1a] rounded-xl focus-visible:ring-1 focus-visible:ring-[#4d94ff] text-lg placeholder:text-[#444] h-12 pl-12"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full rounded-xl bg-[#00ff00] hover:bg-[#33ff33] text-black font-black uppercase tracking-widest h-12">
                        Importer mes concerts
                    </Button>
                    <p className="text-xs text-[#666]">
                        Pas de compte ? <a href="https://www.setlist.fm/signup" target="_blank" className="underline hover:text-white">Créer un compte gratuit sur setlist.fm</a>
                    </p>
                  </form>
              )}

          </div>

          {/* BADGES DE CONFIANCE */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-bold text-[#666] uppercase tracking-widest">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#4d94ff]"/> Gratuit</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#4d94ff]"/> Sans Inscription</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#4d94ff]"/> Setlist.fm Data</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
