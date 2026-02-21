import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Crown, ShoppingBag, User, LogOut, History, Globe as GlobeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';
import { SearchBar } from '@/components/SearchBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);

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
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-[#333]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO AVEC BADGE PREMIUM */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              {/* Conteneur de l'image avec zoom (w-[120%]) pour cacher les bords blancs */}
              <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-all ${
                isPremium 
                  ? 'ring-2 ring-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]' 
                  : 'ring-1 ring-[#4d94ff] group-hover:shadow-[0_0_15px_rgba(77,148,255,0.4)]'
              }`}>
                <img 
                  src="/favicon.png" 
                  alt="Setlive Logo" 
                  className="w-[120%] h-[120%] max-w-none object-cover" 
                />
              </div>

              {/* Le badge Premium positionné en haut à droite */}
              {isPremium && (
                <div className="absolute -top-2 -right-2 bg-[#1a1a1a] rounded-full p-0.5 border border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] rotate-12 z-10 animate-in zoom-in duration-300">
                  <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                </div>
              )}
            </div>
            
            <span className="text-xl font-black tracking-tighter text-white uppercase italic ml-1">
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
