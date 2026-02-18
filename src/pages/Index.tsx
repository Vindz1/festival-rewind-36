import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, Crown, User, ShieldCheck, Zap, Music2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Index() {
  const [query, setQuery] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleProfileConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('setlistfm_username', username.trim());
      navigate('/my-concerts');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#4d94ff] selection:text-white">
      <Header />

      {/* ===== HERO - Compact ===== */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-16 px-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(77,148,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(77,148,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"/>
        {/* Rond bleu subtil */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[#4d94ff] rounded-full blur-[100px] opacity-[0.04]"/>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-[#00ff00] opacity-75"/>
              <span className="relative rounded-full h-2 w-2 bg-[#00ff00]"/>
            </span>
            <span>Compatible Spotify, Deezer, Apple Music</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight">
            <span className="block text-white">VOS CONCERTS</span>
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#8b5cf6] to-[#ec4899] animate-gradient">EN PLAYLIST</span>
          </h1>
          
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Transformez vos concerts vécus en playlists.<br className="hidden sm:block"/>
            Setlists exactes. Import en 2 clics.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 pt-2">
            <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400"/>100% Gratuit</div>
            <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400"/>Sans installation</div>
            <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400"/>Export instantané</div>
          </div>
        </div>
      </section>

      {/* ===== RECHERCHE MANUELLE ===== */}
      <section className="py-8 sm:py-12 px-4 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl font-black mb-2">Rechercher <span className="text-[#4d94ff]">un concert</span></h2>
          </div>
          
          <form onSubmit={handleSearch} className="relative mb-4">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5 z-10"/>
            <Input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Metallica, Gojira, Hellfest..." 
              className="h-12 sm:h-14 pl-11 sm:pl-14 pr-20 sm:pr-28 bg-white/5 border-2 border-white/10 text-sm sm:text-base rounded-xl focus:border-[#4d94ff] transition-colors"
            />
            <Button 
              type="submit" 
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 sm:px-6 h-9 sm:h-10 rounded-lg bg-[#4d94ff] hover:bg-[#6ba6ff] font-bold text-sm"
            >
              GO
            </Button>
          </form>

          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-xs text-gray-500">Populaires :</span>
            {['Metallica', 'Iron Maiden', 'Hellfest'].map(n => (
              <button 
                key={n} 
                onClick={() => navigate(`/search?q=${n}`)} 
                className="px-3 py-1 rounded-full border border-white/10 hover:border-[#4d94ff] hover:text-[#4d94ff] text-white text-xs font-semibold transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONNEXION SETLIST.FM ===== */}
      <section className="py-8 sm:py-12 px-4 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#4d94ff] rounded-full blur-[100px] opacity-20"/>
            
            <div className="relative z-10 p-5 sm:p-8 grid md:grid-cols-5 gap-5 sm:gap-6 items-center">
              
              {/* Gauche : Explication */}
              <div className="md:col-span-2 space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4d94ff]/10 border border-[#4d94ff]/20 text-[#4d94ff] text-xs font-bold">
                  <Sparkles className="w-3 h-3"/>Import Ultra-Rapide
                </div>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  Déjà sur<br/>
                  <span className="text-[#88c446]">Setlist.fm</span> ?
                </h2>
                <p className="text-sm sm:text-base text-gray-300">
                  Importez automatiquement vos concerts passés et à venir.
                </p>
              </div>

              {/* Droite : Formulaire */}
              <div className="md:col-span-3 bg-black/40 backdrop-blur border border-white/10 rounded-lg p-4 sm:p-5">
                <form onSubmit={handleProfileConnect} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">Nom d'utilisateur Setlist.fm</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4"/>
                      <Input 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="votre-pseudo" 
                        className="h-10 sm:h-11 pl-10 bg-white/5 border-white/10 rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold text-sm rounded-lg"
                  >
                    <ArrowRight className="mr-2 w-4 h-4"/>
                    Importer mes concerts
                  </Button>
                </form>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Pas de compte ? <a href="https://www.setlist.fm/signup" target="_blank" rel="noopener noreferrer" className="text-[#88c446] hover:underline font-semibold">S'inscrire</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE - Condensé ===== */}
      <section className="py-8 sm:py-12 px-4 bg-gradient-to-b from-[#0a0a0a] to-black border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl font-black mb-2">Simple comme <span className="text-[#4d94ff]">1-2-3</span></h2>
            <p className="text-sm sm:text-base text-gray-400">De la scène à vos oreilles</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {[
              { 
                num: 1, 
                color: 'bg-[#4d94ff]', 
                title: 'Recherchez ou connectez', 
                desc: 'Via Setlist.fm ou recherche manuelle',
                icon: Search
              },
              { 
                num: 2, 
                color: 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]', 
                title: 'Sélectionnez', 
                desc: 'Un ou plusieurs concerts',
                icon: Music2
              },
              { 
                num: 3, 
                color: 'bg-gradient-to-r from-green-500 to-emerald-500', 
                title: 'Exportez', 
                desc: 'Vers Spotify, Deezer ou Apple Music',
                icon: Check
              }
            ].map(({ num, color, title, desc, icon: Icon }) => (
              <div key={num} className="relative bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-xl p-3 sm:p-4 md:p-5 hover:border-white/20 transition-colors">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 ${color} rounded-lg flex items-center justify-center text-sm sm:text-base md:text-xl font-black mb-2 sm:mb-3`}>
                  {num}
                </div>
                <h3 className="text-xs sm:text-base md:text-lg font-bold mb-1 sm:mb-1.5 leading-tight">{title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 leading-relaxed hidden sm:block">{desc}</p>
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600 mt-1 sm:mt-2 hidden sm:block"/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING - Plus compact ===== */}
      <section className="py-10 sm:py-16 px-4 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-2">
              Gratuit pour <span className="text-[#4d94ff]">toujours</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-400">Premium pour enlever les pubs</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            
            {/* Plan 1 : Non connecté */}
            <div className="relative bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 rounded-xl p-3 sm:p-5 md:p-6">
              <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400 text-[8px] sm:text-[10px] font-bold mb-2 sm:mb-3">
                <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5"/>
                <span className="hidden sm:inline">VISITEUR</span>
              </div>
              <h3 className="text-sm sm:text-xl md:text-2xl font-black mb-2 sm:mb-3 leading-tight">Non connecté</h3>
              
              <ul className="space-y-1 sm:space-y-2 mb-3 sm:mb-5 text-[9px] sm:text-xs md:text-sm">
                <li className="flex items-start gap-1 sm:gap-2 text-gray-400">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 shrink-0 mt-0.5 hidden sm:block"/>
                  <span className="leading-tight">Recherche</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-2 text-gray-400">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 shrink-0 mt-0.5 hidden sm:block"/>
                  <span className="leading-tight hidden sm:inline">Consultation</span>
                  <span className="leading-tight sm:hidden">Setlists</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-2 opacity-50">
                  <span className="text-[8px] sm:text-xs text-gray-600 italic leading-tight">Pas d'export</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => navigate('/auth')} 
                variant="outline"
                className="w-full h-7 sm:h-9 md:h-10 border-white/20 text-white hover:bg-white/5 font-semibold text-[10px] sm:text-sm"
              >
                Créer
              </Button>
            </div>

            {/* Plan 2 : Membre gratuit */}
            <div className="relative bg-gradient-to-br from-[#0a0a0a] to-black border border-[#4d94ff]/30 rounded-xl p-3 sm:p-5 md:p-6">
              <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#4d94ff]/10 border border-[#4d94ff]/20 text-[#4d94ff] text-[8px] sm:text-[10px] font-bold mb-2 sm:mb-3">
                <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5"/>
                <span className="hidden sm:inline">GRATUIT</span>
              </div>
              <h3 className="text-sm sm:text-xl md:text-2xl font-black mb-1 sm:mb-1 leading-tight">Membre</h3>
              <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3">
                <span className="text-xl sm:text-3xl md:text-4xl font-black text-[#4d94ff]">0€</span>
                <span className="text-gray-500 text-[8px] sm:text-xs">/mois</span>
              </div>
              
              <ul className="space-y-1 sm:space-y-2 mb-3 sm:mb-5 text-[9px] sm:text-xs md:text-sm">
                <li className="flex items-start gap-1 sm:gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-[#4d94ff] shrink-0 mt-0.5 hidden sm:block"/>
                  <span className="text-gray-300 leading-tight"><strong className="text-white">2 exports</strong>/an</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-[#4d94ff] shrink-0 mt-0.5 hidden sm:block"/>
                  <span className="text-gray-300 leading-tight">Festivals</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-2 opacity-50">
                  <span className="text-[8px] sm:text-xs text-gray-600 italic leading-tight">Avec pubs</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full h-7 sm:h-9 md:h-10 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold text-[10px] sm:text-sm"
              >
                Créer
              </Button>
            </div>

            {/* Plan 3 : Premium */}
            <div className="relative bg-gradient-to-br from-[#1a1a0a] to-black border-2 border-yellow-500/40 rounded-xl p-3 sm:p-5 md:p-6">
              <div className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                <span className="flex items-center gap-1 sm:gap-1.5 text-black font-black text-[8px] sm:text-[10px] uppercase">
                  <Crown className="w-2 h-2 sm:w-2.5 sm:h-2.5"/>
                  <span className="hidden sm:inline">TOP</span>
                </span>
              </div>
              
              <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] sm:text-[10px] font-bold mb-2 sm:mb-3 mt-1 sm:mt-2">
                <Crown className="w-2 h-2 sm:w-2.5 sm:h-2.5"/>
                <span className="hidden sm:inline">PREMIUM</span>
              </div>
              <h3 className="text-sm sm:text-xl md:text-2xl font-black mb-1 leading-tight">Gold</h3>
              <div className="flex items-baseline gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                <span className="text-xl sm:text-3xl md:text-4xl font-black text-yellow-500">5€</span>
                <span className="text-gray-500 text-[8px] sm:text-xs">/an</span>
              </div>
              <p className="text-[8px] sm:text-[10px] text-gray-500 mb-2 sm:mb-3">0.42€/mois</p>
              
              <ul className="space-y-1 sm:space-y-2 mb-3 sm:mb-5 text-[9px] sm:text-xs md:text-sm">
                <li className="flex items-start gap-1 sm:gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0 mt-0.5 hidden sm:block"/>
                  <span className="text-white font-semibold leading-tight">Illimité</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0 mt-0.5 hidden sm:block"/>
                  <span className="text-white font-semibold leading-tight">0 pub</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0 mt-0.5 hidden sm:block"/>
                  <span className="text-gray-300 leading-tight">Historique</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => navigate('/subscription')} 
                className="w-full h-7 sm:h-9 md:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-[10px] sm:text-sm"
              >
                Premium
              </Button>
            </div>
          </div>

          {/* Badge sécurité */}
          <div className="mt-6 sm:mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400"/>
              <span className="text-xs text-gray-300">Paiement sécurisé</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
