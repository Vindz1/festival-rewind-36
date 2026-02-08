import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Music, Menu, X, Crown, ShoppingBag, Ticket, User, LogOut, Zap } from 'lucide-react';
// ... reste des imports
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-[#333]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO : SETLIVE.FR */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-[#4d94ff] p-1.5 rounded-lg transition-all group-hover:shadow-[0_0_15px_rgba(77,148,255,0.4)]">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">
              SETLIVE<span className="text-[#4d94ff]">.FR</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            <Link to="/my-concerts" className="text-sm font-bold uppercase tracking-widest text-[#a0a0a0] hover:text-white transition-colors">
              Mes Concerts
            </Link>
            
            <Link to="/hellfest-2026" className="group relative flex items-center gap-2 px-4 py-1.5 bg-[#00ff00] text-black text-xs font-black uppercase tracking-tighter transform -skew-x-12 hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none">
              <div className="skew-x-12 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 fill-black" />
                Hellfest 2026
              </div>
            </Link>
          
            {/* ON FUSIONNE BILLETS ET BOUTIQUE EN UN SEUL LIEN "SHOP" */}
            <Link to="/shop" className="text-sm font-medium text-[#a0a0a0] hover:text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              Shop
            </Link>
          
            <Link to="/subscription" className="text-sm font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-1.5">
              <Crown className="w-4 h-4 fill-yellow-500" />
              PREMIUM
            </Link>
          </nav>

          {/* ACTIONS UTILISATEUR */}
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-[#2d2d2d] border border-[#404040] hover:border-[#4d94ff] transition-colors">
                    <User className="w-5 h-5 text-[#4d94ff]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-[#404040] text-white shadow-2xl">
                  <div className="p-3">
                    <p className="text-xs text-[#a0a0a0] uppercase font-bold tracking-widest mb-1">Compte</p>
                    <p className="text-sm truncate font-medium">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-[#333]" />
                  <DropdownMenuItem onClick={() => navigate('/my-concerts')} className="cursor-pointer focus:bg-[#4d94ff] focus:text-white">
                    Mon Tableau de bord
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/subscription')} className="cursor-pointer focus:bg-yellow-500 focus:text-black font-bold">
                    Passer en PREMIUM
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#333]" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500 focus:bg-red-500 focus:text-white">
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

      {/* MENU MOBILE */}
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
              <Link 
                to="/my-concerts" 
                className="text-xl font-black uppercase italic text-[#a0a0a0] hover:text-white" 
                onClick={() => setIsMenuOpen(false)}
              >
                Mes Concerts
              </Link>
              
              <Link 
                to="/hellfest-2026" 
                className="text-2xl font-black italic text-[#00ff00] uppercase tracking-tighter" 
                onClick={() => setIsMenuOpen(false)}
              >
                Hellfest 2026
              </Link>
              
              <Link 
                to="/tickets" 
                className="text-xl font-bold text-[#a0a0a0]" 
                onClick={() => setIsMenuOpen(false)}
              >
                Billets
              </Link>
              
              <Link 
                to="/merch" 
                className="text-xl font-bold text-[#a0a0a0]" 
                onClick={() => setIsMenuOpen(false)}
              >
                Boutique
              </Link>
              
              <Link 
                to="/subscription" 
                className="text-xl font-bold text-yellow-500" 
                onClick={() => setIsMenuOpen(false)}
              >
                Premium
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
