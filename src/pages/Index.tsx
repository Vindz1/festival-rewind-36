import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, Crown, User, ArrowRight, Music, ShieldCheck, Zap, Sparkles, PlayCircle, Calendar, Download } from 'lucide-react';
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
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#4d94ff] selection:text-white">
      <Header />

      {/* === HERO ULTRA-SIMPLIFIÉ === */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-32 overflow-hidden">
        
        {/* Grille de fond subtile */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(77,148,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(77,148,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"/>
        
        {/* Gradient glow central */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#4d94ff] rounded-full blur-[200px] opacity-10 pointer-events-none"/>
        
        <div className="relative z-10 w-full max-w-5xl text-center space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* Tag Premium */}
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 backdrop-blur border border-white/10 text-sm font-semibold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff00] opacity-75"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff00]"/>
            </span>
            Compatible Spotify, Deezer, Apple Music, Qobuz, etc.
          </div>

          {/* TITRE MASSIF & LISIBLE */}
          <div className="space-y-6">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.9]">
              <span className="block text-white">VOS CONCERTS</span>
              <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] via-[#8b5cf6] to-[#ec4899] animate-gradient">
                EN PLAYLIST
              </span>
            </h1>
            
            <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Transformez vos concerts vécus en playlists musicale. <br className="hidden md:block"/>
              Setlists exactes. Import en 2 clics.
            </p>
          </div>

          {/* CTA DOUBLE : RECHERCHE OU CONNEXION */}
          <div className="space-y-8 pt-8">
            {/* Bouton principal : Connecter profil */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => {
                  const el = document.getElementById('connect-profile');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                size="lg"
                className="h-16 px-10 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white text-lg font-bold rounded-full shadow-[0_0_50px_rgba(77,148,255,0.3)] hover:shadow-[0_0_80px_rgba(77,148,255,0.5)] transition-all group"
              >
                <User className="mr-2 group-hover:scale-110 transition-transform"/>
                Connecter mon profil
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform"/>
              </Button>
              
              <span className="text-gray-500 font-semibold">ou</span>
              
              <Button 
                onClick={() => {
                  const el = document.getElementById('search-section');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                size="lg"
                variant="outline"
                className="h-16 px-10 border-2 border-white/20 hover:border-white/40 bg-transparent text-white text-lg font-bold rounded-full hover:bg-white/5 transition-all"
              >
                <Search className="mr-2"/>
                Rechercher un concert
              </Button>
            </div>

            {/* Stats sociales */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 font-semibold">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400"/>
                <span>100% Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400"/>
                <span>Aucune installation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400"/>
                <span>Export instantané</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/40 rounded-full"/>
          </div>
        </div>
      </section>


      {/* === COMMENT ÇA MARCHE === */}
      <section className="py-32 px-6 bg-gradient-to-b from-black via-[#0a0a0a] to-black border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6">
              Simple comme <span className="text-[#4d94ff]">1-2-3</span>
            </h2>
            <p className="text-xl text-gray-400">
              De la scène à vos oreilles en quelques secondes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Étape 1 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#4d94ff]/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"/>
              <div className="relative bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-8 hover:border-[#4d94ff]/50 transition-all">
                <div className="w-16 h-16 bg-[#4d94ff] rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_30px_rgba(77,148,255,0.3)]">
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4">Connectez votre profil</h3>
                <p className="text-gray-400 leading-relaxed">
                  Entrez votre nom d'utilisateur Setlist.fm pour importer automatiquement tous vos concerts.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-[#4d94ff] font-semibold">
                  <User className="w-4 h-4"/>
                  Import automatique
                </div>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"/>
              <div className="relative bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-8 hover:border-purple-500/50 transition-all">
                <div className="w-16 h-16 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4">Sélectionnez vos concerts</h3>
                <p className="text-gray-400 leading-relaxed">
                  Choisissez les concerts que vous voulez transformer en playlist. Un ou plusieurs, c'est vous qui décidez.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-purple-400 font-semibold">
                  <Calendar className="w-4 h-4"/>
                  Multi-sélection
                </div>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"/>
              <div className="relative bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-8 hover:border-green-500/50 transition-all">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4">Exportez sur toutes les plateformes de streaming</h3>
                <p className="text-gray-400 leading-relaxed">
                  Copiez la liste et importez-la sur Spotify, Deezer, Apple Music ou autres via TuneMyMusic.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-green-400 font-semibold">
                  <Download className="w-4 h-4"/>
                  Export instantané
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* === CONNEXION PROFIL (ID pour scroll) === */}
      <section id="connect-profile" className="py-32 px-6 bg-black scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          
          <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
            {/* Effet de fond animé */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#4d94ff] rounded-full blur-[150px] opacity-20 animate-pulse"/>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8b5cf6] rounded-full blur-[150px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}/>
            
            <div className="relative z-10 p-12 md:p-16 lg:p-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                
                {/* Texte */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4d94ff]/10 border border-[#4d94ff]/20 text-[#4d94ff] font-bold text-sm">
                    <Sparkles className="w-4 h-4"/>
                    Import Ultra-Rapide
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-black leading-tight">
                    Déjà sur<br/>
                    <span className="text-[#88c446]">Setlist.fm</span> ?
                  </h2>
                  
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Connectez votre compte pour <strong className="text-white">importer automatiquement</strong> tout votre historique de concerts en une seconde.
                  </p>

                  <div className="flex flex-col gap-3 pt-4 text-sm text-gray-400">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0"/>
                      <span>Import de tous vos concerts passés</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0"/>
                      <span>Synchronisation avec vos "I'm going"</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 shrink-0"/>
                      <span>Aucune donnée partagée avec Setlist.fm</span>
                    </div>
                  </div>
                </div>

                {/* Formulaire */}
                <div className="bg-black/50 backdrop-blur border border-white/10 rounded-2xl p-8">
                  <form onSubmit={handleProfileConnect} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-300">
                        Nom d'utilisateur Setlist.fm
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5"/>
                        <Input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="votre-pseudo" 
                          className="h-14 pl-12 bg-white/5 border-white/10 rounded-xl focus:border-[#4d94ff] focus:ring-2 focus:ring-[#4d94ff]/20 text-lg transition-all"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Visible dans l'URL de votre profil Setlist.fm
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-14 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold text-lg rounded-xl shadow-[0_10px_40px_rgba(77,148,255,0.3)] hover:shadow-[0_10px_60px_rgba(77,148,255,0.5)] transition-all"
                    >
                      <ArrowRight className="mr-2"/>
                      Importer mes concerts
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-500">
                    Pas encore de compte ?{' '}
                    <a 
                      href="https://www.setlist.fm/signup" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#88c446] hover:underline font-semibold"
                    >
                      S'inscrire sur Setlist.fm
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>


      {/* === RECHERCHE MANUELLE (ID pour scroll) === */}
      <section id="search-section" className="py-32 px-6 bg-gradient-to-b from-black via-[#050505] to-black scroll-mt-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-black">
              Ou recherchez <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4d94ff] to-[#8b5cf6]">manuellement</span>
            </h2>
            <p className="text-xl text-gray-400">
              Trouvez n'importe quel concert ou festival
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6 group-focus-within:text-[#4d94ff] transition-colors z-10" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Metallica, Black Label Society, Gojira..." 
              className="h-20 pl-16 pr-40 bg-white/5 border-2 border-white/10 text-xl rounded-full focus:ring-2 focus:ring-[#4d94ff]/50 focus:border-[#4d94ff] transition-all shadow-2xl placeholder:text-gray-600"
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-2 bottom-2 px-10 rounded-full bg-[#4d94ff] hover:bg-white hover:text-black font-bold uppercase transition-all text-lg shadow-[0_0_30px_rgba(77,148,255,0.4)] hover:shadow-none"
            >
              Rechercher
            </Button>
          </form>
          
          {/* Recherches populaires */}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <span className="text-sm text-gray-500 font-semibold">Populaires :</span>
            {[
              { name: 'Metallica', color: 'from-red-500 to-orange-500' },
              { name: 'Bad Bunny', color: 'from-green-500 to-emerald-500' },
              { name: 'Daft Punk', color: 'from-blue-500 to-cyan-500' },
              { name: 'Iron Maiden', color: 'from-purple-500 to-pink-500' }
            ].map(({ name, color }) => (
              <button
                key={name}
                onClick={() => navigate(`/search?q=${name}`)}
                className={`px-5 py-2 rounded-full bg-gradient-to-r ${color} bg-opacity-10 border border-white/10 hover:border-white/30 text-white text-sm font-semibold transition-all hover:scale-105`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* === PRICING REPENSÉ === */}
      <section className="py-32 px-6 bg-black" id="pricing">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-5xl md:text-7xl font-black">
              Gratuit pour <span className="text-[#4d94ff]">toujours</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Créez des playlists sans limite. Premium pour enlever les pubs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* GRATUIT */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#4d94ff] to-[#8b5cf6] rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"/>
              <div className="relative bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 rounded-3xl p-10 hover:border-[#4d94ff]/30 transition-all">
                
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4d94ff]/10 border border-[#4d94ff]/20 text-[#4d94ff] text-xs font-bold uppercase tracking-wider mb-4">
                    <Zap className="w-3 h-3"/>
                    Gratuit
                  </div>
                  <h3 className="text-3xl font-black mb-2">Membre</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-[#4d94ff]">0€</span>
                    <span className="text-gray-500">/mois</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#4d94ff] shrink-0 mt-0.5"/>
                    <span className="text-gray-300"><strong className="text-white">2 exports</strong> par an</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#4d94ff] shrink-0 mt-0.5"/>
                    <span className="text-gray-300">Historique <strong className="text-white">illimité</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#4d94ff] shrink-0 mt-0.5"/>
                    <span className="text-gray-300">Import Setlist.fm</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#4d94ff] shrink-0 mt-0.5"/>
                    <span className="text-gray-300">Tous les festivals</span>
                  </li>
                  <li className="flex items-start gap-3 opacity-50">
                    <span className="text-gray-600 text-sm italic">Publicités activées</span>
                  </li>
                </ul>

                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full h-14 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold text-lg rounded-xl shadow-[0_10px_40px_rgba(77,148,255,0.2)] transition-all"
                >
                  Créer un compte gratuit
                </Button>
              </div>
            </div>

            {/* PREMIUM */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"/>
              <div className="relative bg-gradient-to-br from-[#1a1a0a] via-black to-[#0a0a0a] border-2 border-yellow-500/30 rounded-3xl p-10 hover:border-yellow-500/50 transition-all">
                
                {/* Badge Premium */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-[0_0_40px_rgba(234,179,8,0.5)]">
                  <span className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-wider">
                    <Crown className="w-4 h-4"/>
                    Le plus populaire
                  </span>
                </div>

                <div className="mb-8 mt-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wider mb-4">
                    <Crown className="w-3 h-3"/>
                    Premium
                  </div>
                  <h3 className="text-3xl font-black mb-2">Gold</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-yellow-500">5€</span>
                    <span className="text-gray-500">/an</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Soit 0.42€/mois</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"/>
                    <span className="text-white font-semibold">Exports illimités</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"/>
                    <span className="text-white font-semibold">Zéro publicité</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"/>
                    <span className="text-gray-300">Badge supporter exclusif</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"/>
                    <span className="text-gray-300">Support prioritaire</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"/>
                    <span className="text-gray-300">Accès anticipé aux nouveautés</span>
                  </li>
                </ul>

                <Button 
                  onClick={() => navigate('/subscription')}
                  className="w-full h-14 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black text-lg rounded-xl shadow-[0_10px_50px_rgba(234,179,8,0.4)] transition-all"
                >
                  Passer Premium
                </Button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  🎉 Offre de lancement • Annulation immédiate
                </p>
              </div>
            </div>

          </div>

          {/* Garantie */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 bg-white/5">
              <ShieldCheck className="w-5 h-5 text-green-400"/>
              <span className="text-sm font-semibold text-gray-300">
                Paiement sécurisé
              </span>
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
