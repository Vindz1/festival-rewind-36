import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Menu, X, Crown, ShoppingBag, User, LogOut, Zap, History, Globe as GlobeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';
import { SearchBar } from '@/components/SearchBar';
import { GoogleTranslate } from '@/components/GoogleTranslate';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mapping : Langue Google Translate -> Code pays FlagCDN
const FLAGS: Record<string, string> = {
  fr: 'fr',
  en: 'gb',
  es: 'es',
  de: 'de',
  it: 'it'
};

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [currentLang, setCurrentLang] = useState('fr');

  // Détecter la langue active continuellement
  useEffect(() => {
    const detectLanguage = () => {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith('googtrans=')) {
          // Format: googtrans=/fr/en ou googtrans=/auto/en
          const match = trimmed.match(/googtrans=\/[^/]+\/([a-z]{2})/i);
          if (match && match[1]) {
            const lang = match[1].toLowerCase();
            if (FLAGS[lang]) {
              setCurrentLang(lang);
              return;
            }
          }
        }
      }
      // Si aucun cookie, on est en français
      setCurrentLang('fr');
    };

    detectLanguage();
    // Re-vérifier toutes les 500ms pour capturer les changements
    const interval = setInterval(detectLanguage, 500);
    return () => clearInterval(interval);
  }, []);

  // Vérification statut Premium
  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        try {
          const sub = await getUserSubscription(user.id);
          setIsPremium(sub?.subscription_type === 'premium');
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkStatus();
  }, [user]);

  const handleSignOut = async () => {
    localStorage.clear();
    try {
      await signOut();
    } catch (error) {
      console.error("Erreur déconnexion", error);
    }
    window.location.href = '/';
  };

  const handleLanguageChange = (langCode: string) => {
    // Supprimer tous les cookies Google Translate
    const cookiesToDelete = ['googtrans', 'googtrans_temp'];
    const domains = [
      '',
      `; domain=${window.location.hostname}`,
      `; domain=.${window.location.hostname}`
    ];
    
    cookiesToDelete.forEach(cookieName => {
      domains.forEach(domain => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domain}`;
      });
    });

    // Créer nouveau cookie si pas français
    if (langCode !== 'fr') {
      const cookieValue = `/fr/${langCode}`;
      domains.forEach(domain => {
        document.cookie = `googtrans=${cookieValue}; path=/${domain}; max-age=31536000`;
      });
    }
    
    // Recharger pour appliquer
    setTimeout(() => window.location.reload(), 100);
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-[#333]">
      
      {/* GoogleTranslate caché */}
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

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            
            <div className="md:hidden">
              <SearchBar />
            </div>

            {/* SÉLECTEUR LANGUE */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0 rounded-full bg-[#2d2d2d] border border-[#404040] hover:bg-[#404040] transition-colors overflow-hidden flex items-center justify-center">
                  <img 
                    src={`https://flagcdn.com/${FLAGS[currentLang] || 'fr'}.svg`} 
                    alt={currentLang}
                    className="w-6 h-auto rounded-[2px]" 
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[4rem] w-16 bg-[#1a1a1a] border-[#404040] p-1 shadow-2xl">
                {Object.entries(FLAGS).map(([langCode, countryCode]) => (
                  <DropdownMenuItem 
                    key={langCode} 
                    onClick={() => handleLanguageChange(langCode)}
                    className={`cursor-pointer justify-center py-2 my-0.5 rounded-md transition-colors ${
                      currentLang === langCode ? 'bg-[#4d94ff]' : 'hover:bg-[#333]'
                    }`}
                  >
                    <img 
                      src={`https://flagcdn.com/${countryCode}.svg`} 
                      alt={langCode}
                      className="w-7 h-auto rounded-[2px] shadow-sm" 
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
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
