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

      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-28 pb-16 text-center relative overflow-hidden">
        
        {/* TITRE ET ACCROCHE */}
        <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in zoom-in duration-700 slide-in-from-bottom-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#252525] border border-[#333] text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#a0a0a0] mb-4">
            <Globe className="w-3 h-3 text-[#4d94ff]" />
            Compatible Toutes Plateformes
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic text-white leading-none tracking-tight">
            VOS CONCERTS.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#a361ff] to-[#ff4d94]">EN PLAYLIST.</span>
          </h1>

          <p className="text-base md:text-xl text-[#a0a0a0] max-w-2xl mx-auto leading-relaxed">
            Récupérez la setlist exacte de vos concerts et exportez-la vers <strong className="text-white">Spotify, Deezer ou Apple Music</strong> en quelques secondes.
          </p>

          {/* BOITE A OUTILS */}
          <div className="max-w-xl mx-auto bg-[#252525] border border-[#333] rounded-2xl p-2 shadow-2xl mt-10">
              
              <div className="flex p-1 bg-[#1a1a1a] rounded-xl mb-3">
                  <button 
                    onClick={() => setMode('search')}
                    className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${mode === 'search' ? 'bg-[#333] text-white' : 'text-[#666] hover:text-[#a0a0a0]'}`}
                  >
                    <Search className="w-4 h-4"/> Recherche
                  </button>
                  <button 
                    onClick={() => setMode('profile')}
                    className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${mode === 'profile' ? 'bg-[#4d94ff] text-white' : 'text-[#666] hover:text-[#a0a0a0]'}`}
                  >
                    <User className="w-4 h-4"/> Mon Profil
                  </button>
              </div>

              {mode === 'search' && (
                  <form onSubmit={handleSearch} className="relative flex items-center p-1">
                    <Search className="absolute left-4 w-5 h-5 text-[#666]" />
                    <Input 
                        type="text" 
                        placeholder="Artiste, Festival..." 
                        className="border-0 bg-[#1a1a1a] rounded-lg text-base h-12 pl-12 pr-4 w-full"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button type="submit" className="absolute right-1 top-1 bottom-1 rounded-md bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-4 h-auto">
                        GO
                    </Button>
                  </form>
              )}

              {mode === 'profile' && (
                  <form onSubmit={handleProfileConnect} className="relative flex flex-col p-2 gap-3 animate-in fade-in">
                    <div className="relative">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-[#666]" />
                        <Input 
                            type="text" 
                            placeholder="Pseudo setlist.fm" 
                            className="border border-[#333] bg-[#1a1a1a] rounded-lg text-base h-12 pl-12"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full rounded-lg bg-[#00ff00] hover:bg-[#33ff33] text-black font-bold uppercase tracking-widest h-12">
                        Importer
                    </Button>
                  </form>
              )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
