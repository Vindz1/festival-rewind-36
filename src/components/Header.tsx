import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Menu, X, Crown, ShoppingBag, User, LogOut, Zap, History, Globe as GlobeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';
import { SearchBar } from '@/components/SearchBar';
// On garde ton composant caché dans le DOM s'il charge le script initial de Google
import { GoogleTranslate } from '@/components/GoogleTranslate'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dictionnaire des langues et drapeaux (tu peux utiliser des emojis ou des icônes SVG si tu préfères)
const LANGUAGES = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  de: '🇩🇪',
  it: '🇮🇹'
};

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  
  // État de la langue (Français par défaut)
  const [currentLang, setCurrentLang] = useState('fr');

  useEffect(() => {
    // Optionnel : Lire le cookie de Google au chargement pour afficher le bon drapeau si l'utilisateur revient
    const match = document.cookie.match(/googtrans=\/fr\/([a-z]{2})/);
    if (match && match[1] && LANGUAGES[match[1] as keyof typeof LANGUAGES]) {
      setCurrentLang(match[1]);
    }
  }, []);

  const checkStatus = async () => {
    if (user) {
      try {
        const sub = await getUserSubscription(user.id);
        setIsPremium(sub && sub.subscription_type === 'premium');
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  const handleSignOut = async () => {
    localStorage.clear();
    try {
      await signOut();
    } catch (error) {
      console.error("Erreur déconnexion silencieuse", error);
    }
    window.location.href = '/';
  };

  // Fonction pour changer la langue en forçant le cookie de Google Translate
  const handleLanguageChange = (langCode: string) => {
    if (langCode === currentLang) return;
    
    setCurrentLang(langCode);
    
    // Si on repasse en français, on supprime le cookie de traduction
    if (langCode === 'fr') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    } else {
      // Sinon, on force la traduction depuis le français (/fr/) vers la langue choisie
      document.cookie = `googtrans=/fr/${langCode}; path=/;`;
      document.cookie = `googtrans=/fr/${langCode}; path=/; domain=${window.location.hostname};`;
    }
    
    // On recharge pour que le script de Google applique la modification instantanément
    window.location.reload();
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-[#333]">
      {/* On garde ton composant GoogleTranslate caché quelque part pour qu'il injecte le script si nécessaire */}
      <div className="hidden">
        <GoogleTranslate />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`p-1.5 rounded-lg transition-all ${
              isPremium 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]' 
                : 'bg-[#4d94ff] group-hover:shadow-[0_0_15px_rgba(77,148,255,0.4)]'
            }`}>
              {isPremium ? <Crown className="w-6 h-6 text-black fill-black/20" /> : <Music className="w-6 h-6 text-white" />}
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">
              SETLIVE<span className={isPremium ? "text-yellow-500 drop-shadow-md" : "text-[#4d94ff]"}>.FR</span>
            </span>
          </Link>

          {/* NAVIGATION DESKTOP */}
          <nav className="hidden md:flex items-center gap-5">
            <Link to="/my-concerts" className="text-sm font-bold uppercase tracking-widest text-[#a0a0a0] hover:text-white transition-colors">
              Mes Concerts
            </Link>
            
            <Link 
              to="/festivals" 
              className="group relative flex items-center gap-2 px-4 py-1.5 bg-[#4d94ff] text-white text-xs font-black uppercase tracking-tighter transform -skew-x-12 hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
            >
              <div className="skew-x-12 flex items-center gap-2">
                <GlobeIcon className="w-3.5 h-3.5" />
                Festivals
              </div>
            </Link>

            <SearchBar />

            {!isPremium && user && (
              <Link to="/subscription" className="text-sm font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4 fill-yellow-500" />
                PREMIUM
              </Link>
            )}
          </nav>

          {/* ACTIONS UTILISATEUR & LANGUE */}
          <div className="flex items-center gap-3">
            
            {/* SearchBar mobile */}
            <div className="md:hidden">
              <SearchBar />
            </div>

            {/* SÉLECTEUR DE LANGUE AVEC DRAPEAUX (Visible partout) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0 rounded-full bg-[#2d2d2d] border border-[#404040] text-xl hover:bg-[#404040] transition-colors">
                  {LANGUAGES[currentLang as keyof typeof LANGUAGES] || '🇫🇷'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[4rem] w-16 bg-[#1a1a1a] border-[#404040] p-1 shadow-2xl">
                {Object.entries(LANGUAGES).map(([code, flag]) => (
                  <DropdownMenuItem 
                    key={code} 
                    onClick={() => handleLanguageChange(code)}
                    className={`cursor-pointer justify-center text-2xl py-2 my-0.5 rounded-md transition-colors ${currentLang === code ? 'bg-[#333]' : 'hover:bg-[#4d94ff]/20'}`}
                  >
                    {flag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              // MENU UTILISATEUR
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`relative h-10 w-10 rounded-full border transition-colors ${
                      isPremium ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-[#2d2d2d] border-[#404040] text-[#4d94ff]'
                  }`}>
                    {isPremium ? <Crown className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-[#404040] text-white shadow-2xl">
                  <div className="p-3">
                    <p className="text-xs text-[#a0a0a0] uppercase font-bold tracking-widest mb-1">Compte</p>
                    <p className="text-sm truncate font-medium flex items-center gap-2">
                        {user.email?.split('@')[0]}
                        {isPremium && <span className="bg-yellow-500 text-black text-[10px] px-1.5 py-0.5 rounded font-black">PREMIUM</span>}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-[#333]" />
                  
                  <DropdownMenuItem onClick={() => { navigate('/profile'); setIsMenuOpen(false); }} className="cursor-pointer focus:bg-[#4d94ff] focus:text-white">
                    <User className="mr-2 h-4 w-4" /> Mon Profil
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => { navigate('/my-concerts'); setIsMenuOpen(false); }} className="cursor-pointer focus:bg-[#4d94ff] focus:text-white">
                    <Music className="mr-2 h-4 w-4" /> Mes Setlists
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => { navigate('/history'); setIsMenuOpen(false); }} className="cursor-pointer focus:bg-[#4d94ff] focus:text-white">
                    <History className="mr-2 h-4 w-4" /> Historique
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-[#333]" />

                  <DropdownMenuItem onClick={() => { navigate('/festivals'); setIsMenuOpen(false); }} className="md:hidden cursor-pointer focus:bg-[#4d94ff] focus:text-white">
                    <GlobeIcon className="mr-2 h-4 w-4" /> Festivals
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => { navigate('/shop'); setIsMenuOpen(false); }} className="md:hidden cursor-pointer focus:bg-[#4d94ff] focus:text-white">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Shop
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-[#333]" />

                  <DropdownMenuItem onClick={() => { navigate('/subscription'); setIsMenuOpen(false); }} className="cursor-pointer focus:bg-yellow-500 focus:text-black font-bold">
                    <Crown className="mr-2 h-4 w-4" />
                    {isPremium ? 'Mon Abonnement' : 'Passer PREMIUM'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-[#333]" />
                  
                  <DropdownMenuItem 
                    onSelect={handleSignOut}
                    className="cursor-pointer text-red-500 focus:bg-red-500 focus:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // NON CONNECTÉ
              <>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="hidden md:flex bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold rounded-full uppercase text-xs tracking-widest h-9 px-6 shadow-lg shadow-blue-500/20"
                >
                  Connexion
                </Button>
                
                <Button 
                  onClick={() => navigate('/auth')}
                  className="md:hidden bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-black rounded-full text-sm h-9 w-9 p-0 shadow-lg shadow-blue-500/20"
                >
                  <User className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
