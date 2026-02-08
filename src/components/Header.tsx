import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Menu, X, Crown, ShoppingBag, Ticket, User, LogOut, Flame } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-md border-b border-[#404040]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO & NOM */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-[#4d94ff] p-1.5 rounded-lg transition-transform group-hover:scale-110">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white italic">
              SETLIVE<span className="text-[#4d94ff]">.</span>
            </span>
          </Link>

          {/* NAVIGATION DESKTOP */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/my-concerts" className="text-sm font-medium text-[#a0a0a0] hover:text-white transition-colors">
              Mes Concerts
            </Link>
            
            {/* LIEN SPECIAL HELLFEST 2026 */}
            <Link to="/hellfest-2026" className="text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-full border border-orange-500/20 hover:bg-orange-500/20 transition-all">
              <Flame className="w-4 h-4" />
              Hellfest 2026
            </Link>

            <Link to="/tickets" className="text-sm font-medium text-[#a0a0a0] hover:text-white flex items-center gap-1">
              <Ticket className="w-4 h-4" />
              Tickets
            </Link>

            <Link to="/merch" className="text-sm font-medium text-[#a0a0a0] hover:text-white flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              Merch
            </Link>

            <Link to="/subscription" className="text-sm font-medium text-yellow-500 hover:text-yellow-400 flex items-center gap-1">
              <Crown className="w-4 h-4" />
              Premium
            </Link>
          </nav>

          {/* ACTIONS UTILISATEUR */}
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-[#2d2d2d] border border-[#404040]">
                    <User className="w-5 h-5 text-[#4d94ff]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#2d2d2d] border-[#404040] text-white">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email?.split('@')[0]}</p>
                      <p className="text-xs leading-none text-[#a0a0a0]">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-[#404040]" />
                  <DropdownMenuItem onClick={() => navigate('/my-concerts')} className="cursor-pointer hover:bg-[#3d3d3d]">
                    Tableau de bord
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/subscription')} className="cursor-pointer hover:bg-[#3d3d3d] text-yellow-500">
                    Gérer l'abonnement
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#404040]" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-400 hover:bg-red-400/10 focus:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white rounded-full px-6"
              >
                Connexion
              </Button>
            )}

            {/* BOUTON MOBILE MENU */}
            <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* MENU MOBILE */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-b border-[#404040] px-4 py-6 space-y-4 animate-in slide-in-from-top-4">
          <Link to="/my-concerts" className="block text-lg text-[#a0a0a0]" onClick={() => setIsMenuOpen(false)}>Mes Concerts</Link>
          <Link to="/hellfest-2026" className="block text-lg text-orange-500 font-bold" onClick={() => setIsMenuOpen(false)}>🔥 Hellfest 2026</Link>
          <Link to="/tickets" className="block text-lg text-[#a0a0a0]" onClick={() => setIsMenuOpen(false)}>Tickets</Link>
          <Link to="/merch" className="block text-lg text-[#a0a0a0]" onClick={() => setIsMenuOpen(false)}>Merch</Link>
          <Link to="/subscription" className="block text-lg text-yellow-500" onClick={() => setIsMenuOpen(false)}>Premium</Link>
        </div>
      )}
    </header>
  );
};
