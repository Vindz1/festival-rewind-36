import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Clock, Calendar, Crown, User, History, Sparkles, Check, Music, Zap, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';

type UserState = 'loading' | 'guest' | 'free' | 'premium';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [userState, setUserState] = useState<UserState>('loading');

  // Détermine l'état utilisateur : invité, gratuit ou premium
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUserState('guest');
      return;
    }
    getUserSubscription(user.id)
      .then(sub => setUserState(sub.subscription_type === 'premium' ? 'premium' : 'free'))
      .catch(() => setUserState('free'));
  }, [user, authLoading]);

  return (
    <div className="min-h-screen text-white relative">
      <Header />

      {/* ====================================================== */}
      {/* HERO — image de fond + baseline + formulaire + 2 CTAs   */}
      {/* ====================================================== */}

      {/* Image de fond : FIXED partout (effet ancré). Sur mobile, hauteur limitée à 60vh pour dézoomer
          le format paysage de l'image. object-[20%_top] décale légèrement vers la gauche du visuel
          (= image "glisse à droite" du point de vue de l'œil) pour révéler "Vos" qui était coupé. */}
      <div className="fixed inset-x-0 top-0 h-[60vh] sm:inset-0 sm:h-auto -z-10 bg-[#0a0a0a] pointer-events-none overflow-hidden">
        <img 
          src="/og-image.jpg" 
          alt=""
          className="w-full h-full object-cover object-[20%_top] sm:object-center"
        />
      </div>

      <section className="relative min-h-screen flex flex-col justify-end">
        {/* Shade progressif du bas — démarre à 40% sur mobile pour fondre l'image (h=60vh) avec le noir,
            et reste à 60% sur desktop comme avant */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% via-[#0a0a0a]/80 via-70% to-[#0a0a0a] sm:from-60% sm:via-90% pointer-events-none" />
        
        <div className="relative z-10 w-full pb-6 sm:pb-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            
            {/* Baseline sans année figée */}
            <p className="text-base sm:text-2xl text-white mb-6 sm:mb-8 font-medium drop-shadow-lg">
              Vos concerts vécus ou à venir, transformés en playlists Spotify, Deezer, Qobuz ou Apple Music.
            </p>

            {/* Formulaire Setlist.fm */}
            <div className="max-w-xl mx-auto mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-[#2d2d2d]/95 to-[#1a1a1a]/95 border border-[#404040] rounded-2xl p-4 sm:p-5 backdrop-blur-md">
                <h3 className="text-xs sm:text-sm font-bold text-white mb-3 flex items-center gap-2 justify-center uppercase tracking-widest">
                  <User className="w-4 h-4 text-[#4d94ff]" />
                  Lier mon compte Setlist.fm
                </h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const username = (e.target as any).username.value.trim();
                    if (username) {
                      localStorage.setItem('setlist_username', username);
                      navigate(`/my-concerts?username=${encodeURIComponent(username)}`);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="username"
                    type="text"
                    placeholder="Votre pseudo Setlist.fm..."
                    className="flex-1 min-w-0 h-11 bg-[#3d3d3d] border border-[#404040] rounded-xl px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4d94ff]"
                  />
                  <Button
                    type="submit"
                    className="shrink-0 h-11 px-6 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold rounded-xl"
                  >
                    Go
                  </Button>
                </form>
              </div>
            </div>

            {/* 2 CTA principaux */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                onClick={() => navigate('/my-concerts')}
                size="lg"
                className="w-full sm:w-auto bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-8 h-12 sm:h-14 text-base rounded-full shadow-lg shadow-blue-500/30"
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Mes concerts
              </Button>
              <Button
                onClick={() => navigate('/festivals')}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/30 font-bold px-8 h-12 sm:h-14 text-base rounded-full"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Festivals à venir
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* DEUX PORTES D'ENTRÉE + mini-strip 1·2·3                 */}
      {/* ====================================================== */}
      <section className="py-16 sm:py-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            
            {/* Concerts passés */}
            <div 
              onClick={() => navigate('/my-concerts')}
              className="group relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-7 sm:p-8 hover:border-[#4d94ff] transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4d94ff]/5 rounded-full blur-3xl" />
              <div className="relative">
                <Clock className="w-10 h-10 text-[#4d94ff] mb-5 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase mb-3 leading-tight">
                  Concerts<br /><span className="text-[#4d94ff]">passés</span>
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6 leading-relaxed">
                  Retrouvez vos concerts vécus grâce à la base de setlist.fm. Revivez l'ambiance, titre par titre.
                </p>
                <div className="flex items-center gap-2 text-[#4d94ff] font-bold group-hover:gap-4 transition-all">
                  <span>Voir mes concerts</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Festivals à venir (sans année figée) */}
            <div 
              onClick={() => navigate('/festivals')}
              className="group relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-7 sm:p-8 hover:border-green-500 transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
              <div className="relative">
                <Calendar className="w-10 h-10 text-green-500 mb-5 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase mb-3 leading-tight">
                  Festivals<br /><span className="text-green-500">à venir</span>
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6 leading-relaxed">
                  Préparez vos prochains festivals. Programmations complètes des meilleurs festivals metal et rock.
                </p>
                <div className="flex items-center gap-2 text-green-500 font-bold group-hover:gap-4 transition-all">
                  <span>Découvrir</span>
                  <span>→</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Mini-strip 1·2·3 discret (remplace l'ancienne section "Simple & Rapide") */}
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-8 gap-y-3 text-xs sm:text-sm">
            <span className="flex items-center gap-2 text-gray-400">
              <span className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center font-black text-[#4d94ff] text-xs">1</span>
              Recherchez
            </span>
            <span className="text-[#333] hidden sm:inline">·</span>
            <span className="flex items-center gap-2 text-gray-400">
              <span className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center font-black text-[#4d94ff] text-xs">2</span>
              Sélectionnez
            </span>
            <span className="text-[#333] hidden sm:inline">·</span>
            <span className="flex items-center gap-2 text-gray-400">
              <span className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center font-black text-[#4d94ff] text-xs">3</span>
              Exportez
            </span>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* SECTION CONDITIONNELLE selon l'état utilisateur          */}
      {/* ====================================================== */}
      {userState !== 'loading' && (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            
            {/* ==================== PREMIUM ==================== */}
            {/* Récap des avantages — pas d'offre, juste un rappel des privilèges */}
            {userState === 'premium' && (
              <div className="relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-yellow-500/40 rounded-3xl p-7 sm:p-10 shadow-[0_0_50px_-15px_rgba(234,179,8,0.3)] overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-4 border border-yellow-500/30">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black italic uppercase mb-2">
                    Vos avantages <span className="text-yellow-500">Premium</span>
                  </h2>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Merci de soutenir Setlive. Voici ce dont vous profitez :
                  </p>
                </div>
                
                <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                  {[
                    { Icon: Zap, label: 'Exports illimités', desc: 'Sans aucune limite annuelle' },
                    { Icon: Music, label: 'Zéro publicité', desc: 'Sur tout le site' },
                    { Icon: BookOpen, label: 'Historique complet', desc: 'Toutes vos playlists sauvegardées' },
                    { Icon: Star, label: 'Badge supporter', desc: 'Visible sur votre profil' },
                  ].map(({ Icon, label, desc }, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-[#1a1a1a]/60 rounded-xl border border-yellow-500/20">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm sm:text-base leading-tight">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button 
                    onClick={() => navigate('/history')} 
                    variant="outline" 
                    className="border-yellow-500/40 bg-yellow-500/5 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Mon historique
                  </Button>
                  <Button 
                    onClick={() => navigate('/profile')} 
                    variant="outline" 
                    className="border-[#404040] text-gray-300 hover:bg-[#252525] hover:text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mon profil
                  </Button>
                </div>
              </div>
            )}

            {/* ==================== FREE : 2 colonnes Gratuit / Premium ==================== */}
            {userState === 'free' && (
              <>
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-4xl font-black italic uppercase mb-3">
                    Passez à la <span className="text-[#4d94ff]">vitesse supérieure</span>
                  </h2>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Libérez tout le potentiel de vos souvenirs de concerts.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
                  
                  {/* Plan actuel : Gratuit */}
                  <div className="bg-[#252525] border border-[#333] rounded-2xl p-6 sm:p-7">
                    <h3 className="text-lg font-bold mb-1">Gratuit</h3>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-black">0€</span>
                      <span className="text-gray-400 text-xs">/an</span>
                    </div>
                    <ul className="space-y-2.5 mb-6 text-sm">
                      <li className="flex items-center gap-2 text-gray-300">
                        <Check className="w-4 h-4 text-gray-500 shrink-0" />2 exports par an
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <Check className="w-4 h-4 text-gray-500 shrink-0" />Accès aux festivals
                      </li>
                      <li className="flex items-center gap-2 text-gray-500">
                        <span className="w-4 text-center shrink-0">⚠</span>Avec publicités
                      </li>
                    </ul>
                    <Button variant="outline" className="w-full border-[#404040] text-gray-400 cursor-default" disabled>
                      Plan actuel
                    </Button>
                  </div>

                  {/* Premium recommandé */}
                  <div className="relative bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-[#4d94ff] rounded-2xl p-6 sm:p-7 shadow-[0_0_30px_-10px_rgba(77,148,255,0.4)]">
                    <div className="absolute top-4 right-4 bg-[#4d94ff] text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                      Recommandé
                    </div>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      Premium <Crown className="w-4 h-4 text-yellow-500" />
                    </h3>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-black text-[#4d94ff]">5€</span>
                      <span className="text-gray-400 text-xs">/an</span>
                    </div>
                    <ul className="space-y-2.5 mb-6 text-sm">
                      <li className="flex items-center gap-2 text-white">
                        <Check className="w-4 h-4 text-[#4d94ff] shrink-0" /><strong>Exports illimités</strong>
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <Check className="w-4 h-4 text-[#4d94ff] shrink-0" />Zéro publicité
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <Check className="w-4 h-4 text-[#4d94ff] shrink-0" />Historique complet
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <Check className="w-4 h-4 text-[#4d94ff] shrink-0" />Badge supporter
                      </li>
                    </ul>
                    <Button 
                      onClick={() => navigate('/subscription')} 
                      className="w-full bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold"
                    >
                      Devenir Premium
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ==================== GUEST : Création de compte + teaser Premium discret ==================== */}
            {userState === 'guest' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-7 sm:p-10 text-center">
                  <Sparkles className="w-10 h-10 text-[#4d94ff] mx-auto mb-4" />
                  <h2 className="text-2xl sm:text-3xl font-black italic uppercase mb-3">
                    Créez votre <span className="text-[#4d94ff]">compte</span>
                  </h2>
                  <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto">
                    Sauvegardez vos playlists, suivez vos exports et accédez à tout votre historique de concerts.
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    size="lg" 
                    className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-8 rounded-full"
                  >
                    Créer un compte gratuit
                  </Button>
                  <p className="text-xs text-gray-500 mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <Crown className="w-3 h-3 text-yellow-500" />
                    Option Premium à 5€/an : exports illimités &amp; zéro pub
                  </p>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
