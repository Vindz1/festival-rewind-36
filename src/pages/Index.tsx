import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchBar } from '@/components/SearchBar';
import { Clock, Calendar, Music2, Smartphone, Share2, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      {/* HERO avec image de fond */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Image de fond avec overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(/og-image.jpg)',
            backgroundPosition: 'center 40%'
          }}
        >
          {/* Overlay gradient pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[#0a0a0a]" />
        </div>

        {/* Contenu hero */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-20">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4d94ff]/10 border border-[#4d94ff]/30 backdrop-blur-sm mb-6">
            <Zap className="w-4 h-4 text-[#4d94ff]" />
            <span className="text-sm font-bold text-[#4d94ff]">100% Gratuit • 0 Pub • Export Instantané</span>
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black italic uppercase mb-6 leading-tight tracking-tighter">
            VOS CONCERTS<br />
            <span className="text-[#4d94ff]">EN PLAYLISTS</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto font-medium">
            Concerts vécus ou à venir : transformez vos setlists en playlists Spotify, Deezer ou Apple Music
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar />
          </div>

          {/* 2 CTA principaux */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={() => navigate('/my-concerts')}
              size="lg"
              className="w-full sm:w-auto bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-8 h-14 text-lg rounded-full shadow-lg shadow-blue-500/30"
            >
              <Clock className="w-5 h-5 mr-2" />
              Mes Concerts Passés
            </Button>
            
            <Button
              onClick={() => navigate('/festivals')}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/30 font-bold px-8 h-14 text-lg rounded-full"
            >
              <Globe className="w-5 h-5 mr-2" />
              Festivals 2026
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-400">Millions de setlists disponibles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4d94ff]" />
              <span className="text-gray-400">Principaux festivals 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-gray-400">Multi-plateformes</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Comment ça marche */}
      <section className="py-20 bg-[#0a0a0a] relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black italic uppercase mb-4">
              SIMPLE & <span className="text-[#4d94ff]">RAPIDE</span>
            </h2>
            <p className="text-gray-400 text-lg">
              3 étapes pour revivre vos concerts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333] rounded-2xl p-8 hover:border-[#4d94ff] transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4d94ff] to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Recherchez</h3>
              <p className="text-gray-400 leading-relaxed">
                Artiste, festival ou ville. Choisissez parmi 1 million de concerts référencés.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333] rounded-2xl p-8 hover:border-[#4d94ff] transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4d94ff] to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Sélectionnez</h3>
              <p className="text-gray-400 leading-relaxed">
                Un concert, un festival entier, ou plusieurs événements. Vous choisissez.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333] rounded-2xl p-8 hover:border-[#4d94ff] transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4d94ff] to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Exportez</h3>
              <p className="text-gray-400 leading-relaxed">
                Spotify, Deezer, Apple Music ou fichier .txt. En 2 clics, c'est fait.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Concerts passés vs Festivals à venir */}
      <section className="py-20 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Concerts passés */}
            <div 
              onClick={() => navigate('/my-concerts')}
              className="group relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-8 sm:p-10 hover:border-[#4d94ff] transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4d94ff]/5 rounded-full blur-3xl" />
              
              <div className="relative">
                <Clock className="w-12 h-12 text-[#4d94ff] mb-6 group-hover:scale-110 transition-transform" />
                
                <h3 className="text-3xl font-black italic uppercase mb-4">
                  CONCERTS<br />
                  <span className="text-[#4d94ff]">PASSÉS</span>
                </h3>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Retrouvez vos concerts vécus grâce à notre immense base de setlists. 
                  Revivez l'ambiance, titre par titre.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4d94ff]" />
                    Recherche par artiste, ville ou date
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4d94ff]" />
                    Setlists exactes jouées en concert
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4d94ff]" />
                    Export multi-plateformes
                  </li>
                </ul>

                <div className="flex items-center gap-2 text-[#4d94ff] font-bold group-hover:gap-4 transition-all">
                  <span>Voir mes concerts</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Festivals 2026 */}
            <div 
              onClick={() => navigate('/festivals')}
              className="group relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-8 sm:p-10 hover:border-green-500 transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
              
              <div className="relative">
                <Calendar className="w-12 h-12 text-green-500 mb-6 group-hover:scale-110 transition-transform" />
                
                <h3 className="text-3xl font-black italic uppercase mb-4">
                  FESTIVALS<br />
                  <span className="text-green-500">2026</span>
                </h3>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Préparez vos festivals à venir ! Programmations complètes des plus grands festivals metal et rock.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Hellfest, Download UK, Wacken...
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Carte interactive mondiale
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Nouvelles programmations ajoutées régulièrement
                  </li>
                </ul>

                <div className="flex items-center gap-2 text-green-500 font-bold group-hover:gap-4 transition-all">
                  <span>Découvrir les festivals</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Features */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Texte */}
            <div>
              <h2 className="text-3xl sm:text-5xl font-black italic uppercase mb-6">
                POURQUOI<br />
                <span className="text-[#4d94ff]">SETLIVE ?</span>
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#4d94ff]/10 flex items-center justify-center">
                    <Music2 className="w-6 h-6 text-[#4d94ff]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Setlists exactes</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Données issues de Setlist.fm, la plus grande base mondiale de setlists de concerts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#4d94ff]/10 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-[#4d94ff]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Multi-plateformes</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Compatible Spotify, Deezer, Apple Music. Ou téléchargez en .txt pour autres services.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">100% Gratuit</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Aucun abonnement. Aucune publicité. Export illimité. Toujours gratuit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Partage facile</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Partagez vos playlists de concerts avec vos amis en un clic.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image placeholder ou stats */}
            <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-[#1a1a1a] rounded-xl border border-[#333]">
                  <div className="text-4xl font-black text-[#4d94ff] mb-2">✓</div>
                  <div className="text-sm text-gray-400">Millions de setlists</div>
                </div>
                <div className="text-center p-6 bg-[#1a1a1a] rounded-xl border border-[#333]">
                  <div className="text-4xl font-black text-green-500 mb-2">🌍</div>
                  <div className="text-sm text-gray-400">Festivals monde</div>
                </div>
                <div className="text-center p-6 bg-[#1a1a1a] rounded-xl border border-[#333]">
                  <div className="text-4xl font-black text-purple-500 mb-2">🎵</div>
                  <div className="text-sm text-gray-400">Multi-plateformes</div>
                </div>
                <div className="text-center p-6 bg-[#1a1a1a] rounded-xl border border-[#333]">
                  <div className="text-4xl font-black text-yellow-500 mb-2">∞</div>
                  <div className="text-sm text-gray-400">Gratuit à vie</div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button
                  onClick={() => navigate('/partage')}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager Setlive
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black italic uppercase mb-6">
            PRÊT À REVIVRE<br />
            <span className="text-[#4d94ff]">VOS CONCERTS ?</span>
          </h2>
          
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Rejoignez des milliers de fans qui transforment leurs souvenirs de concerts en playlists mémorables.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/my-concerts')}
              size="lg"
              className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-10 h-14 text-lg rounded-full shadow-lg shadow-blue-500/30"
            >
              Commencer maintenant
            </Button>
            
            <Button
              onClick={() => navigate('/festivals')}
              size="lg"
              variant="outline"
              className="bg-transparent hover:bg-white/10 text-white border-white/30 font-bold px-10 h-14 text-lg rounded-full"
            >
              Explorer les festivals
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
