import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';

export default function Index() {
  const [query, setQuery] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'search' | 'profile'>('search');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('setlistfm_username');
    if (savedUser) setUsername(savedUser);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleProfileConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('setlistfm_username', username.trim());
      toast.success(`Profil connecté !`);
      navigate('/my-concerts');
    } else {
        toast.error("Veuillez entrer un pseudo");
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col font-sans">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center relative overflow-hidden">
        
        {/* Fond animé plus subtil */}
        <div className="absolute inset-0 overflow-hidden -z-10 opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[150px] animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in zoom-in duration-700 slide-in-from-bottom-8">
          
          {/* Badge Universel */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#252525] border border-[#333] text-xs font-bold uppercase tracking-widest text-[#a0a0a0] shadow-sm">
            <Globe className="w-4 h-4 text-[#4d94ff]" />
            Compatible Toutes Plateformes
          </div>

          {/* Titre Principal Aéré */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic text-white leading-tight tracking-tighter">
            VOS CONCERTS.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#a361ff] to-[#ff4d94]">EN PLAYLIST.</span>
          </h1>

          {/* Sous-titre clair */}
          <p className="text-lg md:text-xl text-[#a0a0a0] max-w-2xl mx-auto leading-relaxed">
            Retrouvez la setlist exacte de n'importe quel concert (data Setlist.fm) et exportez-la vers <strong className="text-white">Spotify, Deezer, Apple Music</strong> et plus.
          </p>

          {/* --- LA BOITE A OUTILS --- */}
          <div className="max-w-xl mx-auto bg-[#252525] border border-[#333] rounded-3xl p-3 shadow-2xl mt-12">
              
              {/* Switcher */}
              <div className="flex p-1 bg-[#1a1a1a] rounded-2xl mb-4">
                  <button 
                    onClick={() => setMode('search')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${mode === 'search' ? 'bg-[#333] text-white shadow-inner' : 'text-[#666] hover:text-[#a0a0a0]'}`}
                  >
                    <Search className="w-4 h-4"/> Chercher un Concert
                  </button>
                  <button 
                    onClick={() => setMode('profile')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${mode === 'profile' ? 'bg-[#4d94ff] text-white shadow' : 'text-[#666] hover:text-[#a0a0a0]'}`}
                  >
                    <User className="w-4 h-4"/> Mon Profil Setlist.fm
                  </button>
              </div>

              {/* RECHERCHE */}
              {mode === 'search' && (
                  <form onSubmit={handleSearch} className="relative flex items-center p-1">
                    <Search className="absolute left-5 w-5 h-5 text-[#666]" />
                    <Input 
                        type="text" 
                        placeholder="Artiste, Festival ou Lieu..." 
                        className="border-0 bg-[#1a1a1a] rounded-xl focus-visible:ring-2 focus-visible:ring-[#4d94ff] text-lg placeholder:text-[#444] h-14 pl-12 pr-20 w-full transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button type="submit" size="lg" className="absolute right-2 top-2 bottom-2 rounded-lg bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-6 shadow-lg shadow-blue-500/20">
                        GO
                    </Button>
                  </form>
              )}

              {/* PROFIL */}
              {mode === 'profile' && (
                  <form onSubmit={handleProfileConnect} className="relative flex flex-col p-2 gap-4 animate-in fade-in">
                    <div className="relative">
                        <User className="absolute left-5 top-4 w-5 h-5 text-[#666]" />
                        <Input 
                            type="text" 
                            placeholder="Votre pseudo setlist.fm (ex: MetalFan85)" 
                            className="border border-[#333] bg-[#1a1a1a] rounded-xl focus-visible:ring-2 focus-visible:ring-[#4d94ff] text-lg placeholder:text-[#444] h-14 pl-12"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <Button type="submit" size="lg" className="w-full rounded-xl bg-[#00ff00] hover:bg-[#33ff33] text-black font-black uppercase tracking-widest h-14 shadow-lg shadow-green-500/20">
                        Importer mon historique
                    </Button>
                    <p className="text-xs text-[#666] mt-2">
                        Pas de compte ? <a href="https://www.setlist.fm/signup" target="_blank" className="underline hover:text-white transition-colors">Créer un compte gratuit sur setlist.fm</a>
                    </p>
                  </form>
              )}
          </div>

          {/* Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-bold text-[#666] uppercase tracking-widest">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#4d94ff]"/> Gratuit</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#4d94ff]"/> Sans Inscription</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#4d94ff]"/> Data Officielle</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
