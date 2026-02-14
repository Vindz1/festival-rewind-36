import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, Crown, User, ArrowRight, ShieldCheck, Zap, Sparkles, Calendar, Download } from 'lucide-react';
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
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleProfileConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('setlistfm_username', username.trim());
      navigate('/my-concerts');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#4d94ff] selection:text-white overflow-x-hidden">
      <Header />

      {/* HERO MOBILE OPTIMIZED */}
      <section className="relative min-h-[80vh] sm:min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 pb-16 sm:pb-32">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(77,148,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(77,148,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"/>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#4d94ff] rounded-full blur-[120px] sm:blur-[200px] opacity-10"/>
        
        <div className="relative z-10 w-full max-w-5xl text-center space-y-6 sm:space-y-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-[#00ff00] opacity-75"/><span className="relative rounded-full h-2 w-2 bg-[#00ff00]"/></span>
            <span className="hidden sm:inline">Compatible Spotify, Deezer, Apple Music...</span>
            <span className="sm:hidden">Compatible toutes plateformes</span>
          </div>

          <div className="space-y-3 sm:space-y-6 px-2">
            <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[1.05] sm:leading-[0.9]">
              <span className="block text-white">VOS CONCERTS</span>
              <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#8b5cf6] to-[#ec4899] animate-gradient">EN PLAYLIST</span>
            </h1>
            <p className="text-sm xs:text-base sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
              Transformez vos concerts vécus en playlists.<br className="hidden xs:block"/>Setlists exactes. Import en 2 clics.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-8 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 px-2">
              <Button onClick={() => document.getElementById('connect-profile')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 sm:h-16 px-6 sm:px-10 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white text-sm sm:text-lg font-bold rounded-full">
                <User className="mr-2 w-4 h-4"/><span className="truncate">Connecter mon profil</span><ArrowRight className="ml-2 w-4 h-4"/>
              </Button>
              <span className="text-gray-500 text-center hidden sm:block">ou</span>
              <Button onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" className="h-12 sm:h-16 px-6 sm:px-10 border-2 border-white/20 bg-transparent text-white text-sm sm:text-lg font-bold rounded-full">
                <Search className="mr-2 w-4 h-4"/><span className="truncate">Rechercher</span>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 px-2">
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400"/>100% Gratuit</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400"/>Sans installation</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-400"/>Export instantané</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-12 sm:py-24 px-4 bg-gradient-to-b from-black via-[#0a0a0a] to-black border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3">Simple comme <span className="text-[#4d94ff]">1-2-3</span></h2>
            <p className="text-base sm:text-xl text-gray-400">De la scène à vos oreilles</p>
          </div>
          <div className="grid gap-5 sm:gap-8 md:grid-cols-3">
            {[
              { num: 1, color: 'bg-[#4d94ff]', title: 'Connectez votre profil', desc: 'Import automatique depuis Setlist.fm', icon: User },
              { num: 2, color: 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]', title: 'Sélectionnez', desc: 'Un ou plusieurs concerts', icon: Calendar },
              { num: 3, color: 'bg-gradient-to-r from-green-500 to-emerald-500', title: 'Exportez', desc: 'Sur toutes les plateformes', icon: Download }
            ].map(({ num, color, title, desc, icon: Icon }) => (
              <div key={num} className="relative bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-2xl p-5 sm:p-6">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 ${color} rounded-xl flex items-center justify-center text-lg sm:text-2xl font-black mb-3 sm:mb-4`}>{num}</div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm sm:text-base text-gray-400">{desc}</p>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 mt-3"/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONNEXION PROFIL */}
      <section id="connect-profile" className="py-12 sm:py-24 px-4 bg-black scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
            <div className="absolute top-0 right-0 w-48 sm:w-80 h-48 sm:h-80 bg-[#4d94ff] rounded-full blur-[80px] sm:blur-[120px] opacity-20"/>
            <div className="relative z-10 p-6 sm:p-12 grid lg:grid-cols-2 gap-6 sm:gap-10">
              <div className="space-y-3 sm:space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4d94ff]/10 border border-[#4d94ff]/20 text-[#4d94ff] text-xs sm:text-sm font-bold">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4"/>Import Ultra-Rapide
                </div>
                <h2 className="text-3xl sm:text-5xl font-black leading-tight">Déjà sur<br/><span className="text-[#88c446]">Setlist.fm</span> ?</h2>
                <p className="text-base sm:text-lg text-gray-300">Connectez votre compte pour <strong className="text-white">importer automatiquement</strong> vos concerts.</p>
                <div className="space-y-2 text-xs sm:text-sm text-gray-400">
                  {['Import concerts passés', 'Sync "I\'m going"', 'Données privées'].map(t => <div key={t} className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400"/>{t}</div>)}
                </div>
              </div>
              <div className="bg-black/50 backdrop-blur border border-white/10 rounded-xl p-5 sm:p-6">
                <form onSubmit={handleProfileConnect} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-300">Nom d'utilisateur Setlist.fm</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4"/>
                      <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="votre-pseudo" className="h-11 sm:h-12 pl-10 bg-white/5 border-white/10 rounded-lg text-sm sm:text-base" required/>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Visible dans l'URL de votre profil</p>
                  </div>
                  <Button type="submit" className="w-full h-11 sm:h-12 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold text-sm sm:text-base rounded-lg">
                    <ArrowRight className="mr-2 w-4 h-4"/>Importer mes concerts
                  </Button>
                </form>
                <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-gray-500">
                  Pas de compte ? <a href="https://www.setlist.fm/signup" target="_blank" rel="noopener noreferrer" className="text-[#88c446] hover:underline font-semibold">S'inscrire</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECHERCHE MANUELLE */}
      <section id="search-section" className="py-12 sm:py-24 px-4 bg-gradient-to-b from-black to-[#050505] scroll-mt-16">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-10">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black mb-3">Ou recherchez <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] to-[#8b5cf6]">manuellement</span></h2>
            <p className="text-base sm:text-lg text-gray-400">Trouvez n'importe quel concert</p>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5 z-10"/>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Metallica, Gojira..." className="h-14 sm:h-16 pl-11 sm:pl-14 pr-24 sm:pr-32 bg-white/5 border-2 border-white/10 text-base sm:text-lg rounded-full"/>
            <Button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 px-5 sm:px-8 rounded-full bg-[#4d94ff] hover:bg-white hover:text-black font-bold text-sm sm:text-base">GO</Button>
          </form>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <span className="text-xs text-gray-500 w-full sm:w-auto">Populaires :</span>
            {['Metallica', 'Bad Bunny', 'Daft Punk', 'Iron Maiden'].map(n => (
              <button key={n} onClick={() => navigate(`/search?q=${n}`)} className="px-3 sm:px-4 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-white text-xs sm:text-sm font-semibold">{n}</button>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-12 sm:py-24 px-4 bg-black" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3">Gratuit pour <span className="text-[#4d94ff]">toujours</span></h2>
            <p className="text-base sm:text-lg text-gray-400">Premium pour enlever les pubs et historique complet</p>
          </div>
          <div className="grid gap-5 sm:gap-7 md:grid-cols-2">
            <div className="relative bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4d94ff]/10 border border-[#4d94ff]/20 text-[#4d94ff] text-[10px] sm:text-xs font-bold mb-3"><Zap className="w-2.5 h-2.5"/>GRATUIT</div>
              <h3 className="text-2xl sm:text-3xl font-black mb-1">Membre</h3>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-4xl sm:text-5xl font-black text-[#4d94ff]">0€</span><span className="text-gray-500 text-sm">/mois</span>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-6">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#4d94ff] shrink-0 mt-0.5"/><span className="text-sm sm:text-base text-gray-300"><strong className="text-white">2 exports</strong> par an</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#4d94ff] shrink-0 mt-0.5"/><span className="text-sm sm:text-base text-gray-300">Tous les festivals</span></li>
                <li className="flex items-start gap-2 opacity-50"><span className="text-xs text-gray-600 italic">Publicités activées</span></li>
              </ul>
              <Button onClick={() => navigate('/auth')} className="w-full h-11 sm:h-12 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold text-sm sm:text-base rounded-lg">Créer un compte</Button>
            </div>
            <div className="relative bg-gradient-to-br from-[#1a1a0a] to-black border-2 border-yellow-500/30 rounded-2xl p-6 sm:p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"><span className="flex items-center gap-1.5 text-black font-black text-[10px] sm:text-xs uppercase"><Crown className="w-3 h-3"/>POPULAIRE</span></div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] sm:text-xs font-bold mb-3 mt-3"><Crown className="w-2.5 h-2.5"/>PREMIUM</div>
              <h3 className="text-2xl sm:text-3xl font-black mb-1">Gold</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl sm:text-5xl font-black text-yellow-500">5€</span><span className="text-gray-500 text-sm">/an</span>
              </div>
              <p className="text-xs text-gray-500 mb-5">Soit 0.42€/mois</p>
              <ul className="space-y-2.5 sm:space-y-3 mb-6">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0 mt-0.5"/><span className="text-sm sm:text-base text-white font-semibold">Exports illimités</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0 mt-0.5"/><span className="text-sm sm:text-base text-white font-semibold">Zéro publicité</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0 mt-0.5"/><span className="text-sm sm:text-base text-gray-300">Historique complet</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0 mt-0.5"/><span className="text-sm sm:text-base text-gray-300">Support prioritaire</span></li>
              </ul>
              <Button onClick={() => navigate('/subscription')} className="w-full h-11 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-sm sm:text-base rounded-lg">Passer Premium</Button>
              <p className="text-center text-[10px] text-gray-500 mt-3">🎉 Offre de lancement</p>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
              <ShieldCheck className="w-4 h-4 text-green-400"/><span className="text-xs sm:text-sm text-gray-300">Paiement sécurisé</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`@keyframes gradient{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}.animate-gradient{background-size:200% 200%;animation:gradient 3s ease infinite}`}</style>
    </div>
  );
}
