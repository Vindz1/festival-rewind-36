import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Menu, X, Crown, ShoppingBag, User, LogOut, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';
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

  // Vérification stricte du statut Premium
  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        try {
          const sub = await getUserSubscription(user.id);
          if (sub && sub.subscription_type === 'premium') {
            setIsPremium(true);
          } else {
            setIsPremium(false);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkStatus();
  }, [user]);

// Fonction de déconnexion "Nucléaire"
  const handleSignOut = async () => {
    // 1. On nettoie tout ce qu'on a en local immédiatement
    localStorage.clear();
    
    // 2. On tente de prévenir Supabase (fire and forget)
    try {
      await signOut();
    } catch (error) {
      console.error("Erreur déconnexion silencieuse", error);
    }

    // 3. Quoi qu'il arrive, on recharge la page vers l'accueil
    window.location.href = '/';
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-[#333]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO : OR si Premium, BLEU si Gratuit */}
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
              to="/hellfest-2026" 
              className="group relative flex items-center gap-2 px-4 py-1.5 bg-[#00ff00] text-black text-xs font-black uppercase tracking-tighter transform -skew-x-12 hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
            >
              <div className="skew-x-12 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 fill-black" />
                Hellfest 2026
              </div>
            </Link>

            <Link to="/shop" className="text-sm font-medium text-[#a0a0a0] hover:text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              Shop
            </Link>

            {!isPremium && (
                <Link to="/subscription" className="text-sm font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4 fill-yellow-500" />
                PREMIUM
                </Link>
            )}
          </nav>

          {/* ACTIONS UTILISATEUR */}
          <div className="flex items-center gap-4">
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
                  
                  {/* LIEN 1 : MON PROFIL */}
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer focus:bg-[#4d94ff] focus:text-white">
                    <User className="mr-2 h-4 w-4" /> Mon Profil
                  </DropdownMenuItem>

                  {/* LIEN 2 : MES SETLISTS */}
                  <DropdownMenuItem onClick={() => navigate('/my-concerts')} className="cursor-pointer focus:bg-[#4d94ff] focus:text-white">
                    <Music className="mr-2 h-4 w-4" /> Mes Setlists
                  </DropdownMenuItem>

                  {/* LIEN 3 : ABONNEMENT */}
                  <DropdownMenuItem onClick={() => navigate('/subscription')} className="cursor-pointer focus:bg-yellow-500 focus:text-black font-bold">
                    <Crown className="mr-2 h-4 w-4" />
                    {isPremium ? 'Mon Abonnement' : 'Passer PREMIUM'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-[#333]" />
                  
                  {/* LIEN 4 : DÉCONNEXION */}
                  <DropdownMenuItem 
                    onSelect={handleSignOut} // <--- C'EST ICI LE CHANGEMENT (onSelect au lieu de onClick)
                    className="cursor-pointer text-red-500 focus:bg-red-500 focus:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-white text-black hover:bg-[#4d94ff] hover:text-white font-bold rounded-none uppercase text-xs tracking-widest h-9 px-6 transition-all"
              >
                Connexion
              </Button>
            )}

            {/* MOBILE TOGGLE */}
            <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-[#1a1a1a] border-b border-[#333] overflow-hidden"
          >
            <div className="flex flex-col items-center py-8 space-y-6">
              <Link to="/profile" className="text-xl font-bold text-white" onClick={() => setIsMenuOpen(false)}>Mon Profil</Link>
              <Link to="/my-concerts" className="text-xl font-black uppercase italic text-[#a0a0a0]" onClick={() => setIsMenuOpen(false)}>Mes Concerts</Link>
              <Link to="/hellfest-2026" className="text-2xl font-black italic text-[#00ff00] uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>Hellfest 2026</Link>
              <Link to="/shop" className="text-xl font-bold text-[#a0a0a0]" onClick={() => setIsMenuOpen(false)}>Shop</Link>
              <Link to="/subscription" className="text-xl font-bold text-yellow-500" onClick={() => setIsMenuOpen(false)}>PREMIUM</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
