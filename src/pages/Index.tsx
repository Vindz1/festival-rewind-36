import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchBar } from '@/components/SearchBar';
import { Clock, Calendar, Crown, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [setlistUsername, setSetlistUsername] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const handleSetlistConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = setlistUsername.trim();
    
    if (uname) {
      setIsLinking(true);
      
      // 1. Sauvegarde en local (Double sécurité pour MyConcerts)
      localStorage.setItem('setlist_username', uname);
      localStorage.setItem('setlistUsername', uname);
      
      // 2. Mise à jour dans Supabase si tu es connecté
      if (user) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ setlist_username: uname })
            .eq('id', user.id);
            
          if (!error) {
             toast.success("Compte Setlist.fm lié avec succès !");
          }
        } catch (error) {
          console.error("Erreur lors de la mise à jour du profil:", error);
        }
      }
      
      setIsLinking(false);
      // 3. Navigation React fluide (Garde la session Supabase active sans recharger la page !)
      navigate(`/my-concerts?username=${encodeURIComponent(uname)}`);
    } else {
      navigate('/my-concerts');
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* LE FOND FIXE UNIVERSEL (Astuce anti-bug iOS) :
        Ceci remplace le "bg-fixed" classique. Cette div reste figée en arrière-plan, 
        elle s'adapte en largeur sur mobile (bg-contain) et couvre tout l'écran sur PC (md:bg-cover).
      */}
      <div 
        className="fixed inset-0 -z-10 bg-no-repeat bg-contain md:bg-cover bg-top md:bg-center pointer-events-none"
        style={{ backgroundImage: 'url(/og-image.jpg)' }}
      />

      <Header />

      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-end pb-20">
        {/* Overlay gradient qui fait la transition vers le noir */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0a0a0a]/80 to-[#0a0a0a]" />

        {/* Contenu en bas de l'image */}
        <div className="relative z-10 w-full">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            
            {/* Sous-titre */}
            <p className="text-lg sm:text-2xl text-white mb-8 font-medium max-w-3xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Concerts vécus ou à venir : transformez vos setlists en playlists Spotify, Deezer, Qobuz, Apple Music ou autres...
            </p>

            {/* Search bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar />
            </div>

            {/* 2 CTA principaux */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
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
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-white/30 font-bold px-8 h-14 text-lg rounded-full shadow-lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Festivals 2026
              </Button>
            </div>

            {/* ENCART DE CONNEXION SETLIST.FM */}
            <div className="max-w-md mx-auto mb-10 bg-[#141414]/80 backdrop-blur-md border border-[#333] rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="w-5 h-5 text-[#4d94ff]" />
                <h3 className="font-bold text-white">Lier mon compte Setlist.fm</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">Importez automatiquement tout votre historique de concerts.</p>
              
              <form onSubmit={handleSetlistConnect} className="flex gap-2">
                <input
                  type="text"
                  value={setlistUsername}
                  onChange={(e) => setSetlistUsername(e.target.value)}
                  placeholder="Votre pseudo Setlist.fm..."
                  className="flex-1 bg-[#2d2d2d] border border-[#404040] text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-[#4d94ff] transition-colors placeholder:text-gray-500"
                />
                <Button type="submit" disabled={isLinking} className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold rounded-xl px-5">
                  {isLinking ? '...' : <><span className="mr-1">Go</span> <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </form>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-gray-200 drop-shadow-md">Millions de setlists</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4d94ff]" />
                <span className="text-gray-200 drop-shadow-md">Principaux festivals 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-200 drop-shadow-md">Multi-plateformes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: 1-2-3 condensé */}
      <section className="relative z-10 py-16 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#333] rounded-2xl p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase mb-8 text-center">
              SIMPLE & <span className="text-[#4d94ff]">RAPIDE</span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {/* 1 */}
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#4d94ff] to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  <span className="text-2xl font-black text-white">1</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Recherchez</h3>
                <p className="text-sm text-gray-400">Un artiste parmi des millions de concerts</p>
              </div>

              {/* 2 */}
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#4d94ff] to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  <span className="text-2xl font-black text-white">2</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Sélectionnez</h3>
                <p className="text-sm text-gray-400">Les concerts qui vous intéressent</p>
              </div>

              {/* 3 */}
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#4d94ff] to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  <span className="text-2xl font-black text-white">3</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Exportez</h3>
                <p className="text-sm text-gray-400">Vers Spotify, Deezer, Qobuz, Apple Music ou autres</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Concerts passés vs Festivals à venir */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Concerts passés */}
            <div 
              onClick={() => navigate('/my-concerts')}
              className="group relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-8 sm:p-10 hover:border-[#4d94ff] transition-all cursor-pointer overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4d94ff]/5 rounded-full blur-3xl" />
              
              <div className="relative">
                <Clock className="w-12 h-12 text-[#4d94ff] mb-6 group-hover:scale-110 transition-transform duration-300" />
                
                <h3 className="text-3xl font-black italic uppercase mb-4">
                  CONCERTS<br />
                  <span className="text-[#4d94ff]">PASSÉS</span>
                </h3>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Retrouvez vos concerts vécus grâce à l'immense base de setlist.fm. 
                  Revivez l'ambiance, titre par titre.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4d94ff]" />
                    Recherche par artiste
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4d94ff]" />
                    Setlists exactes jouées en concert
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4d94ff]" />
                    2 exports gratuits par an
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
              className="group relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-8 sm:p-10 hover:border-green-500 transition-all cursor-pointer overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
              
              <div className="relative">
                <Calendar className="w-12 h-12 text-green-500 mb-6 group-hover:scale-110 transition-transform duration-300" />
                
                <h3 className="text-3xl font-black italic uppercase mb-4">
                  FESTIVALS<br />
                  <span className="text-green-500">2026</span>
                </h3>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Préparez vos festivals à venir ! Programmations complètes des plus grands festivals metal, rock ou autres.
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

      {/* SECTION: Offres (Non connecté / Gratuit / Premium) */}
      <section className="relative z-10 py-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black italic uppercase mb-4">
              CHOISISSEZ VOTRE<br />
              <span className="text-[#4d94ff]">FORMULE</span>
            </h2>
            <p className="text-gray-400 text-lg">
              De la découverte à l'expérience illimitée
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Non connecté */}
            <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-6 sm:p-8 hover:border-gray-500 transition-colors">
              <h3 className="text-xl font-bold mb-2">Découverte</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black">Lecture</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">Pour explorer le site</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-gray-400">✓</div>
                  <span>Consulter les festivals</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-gray-400">✓</div>
                  <span>Voir les programmations</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-500">
                  <div className="w-5 h-5 shrink-0">✗</div>
                  <span>Pas d'export possible</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-500">
                  <div className="w-5 h-5 shrink-0">⚠</div>
                  <span>Avec publicités</span>
                </li>
              </ul>

              <Button
                variant="outline"
                className="w-full h-11 border-[#404040] text-gray-400 cursor-default"
                disabled
              >
                Mode actuel
              </Button>
            </div>

            {/* Gratuit connecté */}
            <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-6 sm:p-8 hover:border-white transition-colors">
              <h3 className="text-xl font-bold mb-2">Gratuit</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black">0€</span>
                <span className="text-gray-400 text-sm">/à vie</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">Pour les festivaliers occasionnels</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-white">✓</div>
                  <span className="text-white"><strong>2 exports par an</strong></span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-gray-400">✓</div>
                  <span>Prévisualisation</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-500">
                  <div className="w-5 h-5 shrink-0">⚠</div>
                  <span>Avec publicités</span>
                </li>
              </ul>

              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-11 bg-[#333] hover:bg-[#444] text-white font-bold transition-colors"
              >
                Créer un compte
              </Button>
            </div>

            {/* Premium */}
            <div className="relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-[#4d94ff] rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_-10px_rgba(77,148,255,0.3)] hover:shadow-[0_0_40px_-10px_rgba(77,148,255,0.5)] transition-all">
              <div className="absolute top-4 right-4 bg-[#4d94ff] text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md">
                Recommandé
              </div>
              
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                Premium
                <Crown className="w-5 h-5 text-yellow-500" />
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black text-[#4d94ff]">5€</span>
                <span className="text-gray-400 text-sm">/an</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">L'expérience ultime</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-[#4d94ff]">✓</div>
                  <span><strong className="text-[#4d94ff]">Exports ILLIMITÉS</strong></span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-[#4d94ff]">✓</div>
                  <span>Zéro publicité</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-[#4d94ff]">✓</div>
                  <span>Historique complet</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-[#4d94ff]">✓</div>
                  <span>Badge supporter</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 shrink-0 text-[#4d94ff]">✓</div>
                  <span>Support prioritaire</span>
                </li>
              </ul>

              <Button
                onClick={() => navigate('/subscription')}
                className="w-full h-11 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold shadow-md hover:shadow-lg transition-all"
              >
                Devenir Premium
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-[#1a1a1a] to-black">
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
              className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-10 h-14 text-lg rounded-full shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
            >
              <Clock className="w-5 h-5 mr-2" />
              Mes Concerts Passés
            </Button>
            
            <Button
              onClick={() => navigate('/festivals')}
              size="lg"
              variant="outline"
              className="bg-transparent hover:bg-white/10 text-white border-white/30 font-bold px-10 h-14 text-lg rounded-full transition-transform active:scale-95"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Festivals 2026
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
