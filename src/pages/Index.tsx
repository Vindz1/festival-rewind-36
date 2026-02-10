import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Music, CheckCircle2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Header />

      {/* HERO SECTION */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-32 pb-16 text-center relative overflow-hidden">
        
        {/* Fond animé subtil */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        <div className="animate-in fade-in zoom-in duration-700 slide-in-from-bottom-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#333] border border-[#404040] text-xs font-bold uppercase tracking-widest text-[#a0a0a0] mb-8">
            <Globe className="w-3 h-3 text-[#4d94ff]" />
            Compatible Spotify • Deezer • Apple Music
          </div>

          <h1 className="text-5xl md:text-7xl font-black italic text-white leading-[0.9] tracking-tighter mb-6">
            VOS CONCERTS.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#a361ff] to-[#ff4d94]">EN PLAYLIST.</span>
          </h1>

          <p className="text-xl text-[#a0a0a0] max-w-2xl mx-auto mb-10 font-medium">
            Retrouvez la setlist exacte de n'importe quel concert (depuis Setlist.fm) et exportez-la vers <strong className="text-white">votre plateforme de streaming préférée</strong> en quelques secondes.
          </p>

          {/* BARRE DE RECHERCHE PRINCIPALE */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4d94ff] to-[#ff4d94] rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative flex items-center bg-[#252525] border border-[#404040] rounded-full p-2 shadow-2xl transition-transform group-hover:scale-[1.02]">
              <Search className="ml-4 w-6 h-6 text-[#a0a0a0]" />
              <Input 
                type="text" 
                placeholder="Artiste, Festival ou Lieu..." 
                className="border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-[#666] h-12"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" size="lg" className="rounded-full bg-white text-black hover:bg-[#e6e6e6] font-bold px-8 h-12">
                GO
              </Button>
            </div>
          </form>

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
