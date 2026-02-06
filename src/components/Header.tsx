import { Music, LogOut, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-[#2d2d2d] border-b border-[#404040] sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo - Style setlist.fm sobre */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Music className="w-5 h-5 text-[#4d94ff]" />
            <span className="text-lg font-semibold text-white tracking-tight">
              setlist<span className="text-[#4d94ff]">memory</span>
            </span>
          </Link>

          {/* Navigation horizontale - Style setlist.fm */}
          <nav className="hidden md:flex items-center">
            <Link 
              to="/my-concerts" 
              className={`px-4 py-4 text-sm transition-colors border-b-2 ${
                location.pathname === '/my-concerts' 
                  ? 'text-white border-[#4d94ff]' 
                  : 'text-[#a0a0a0] border-transparent hover:text-white hover:bg-[#3d3d3d]'
              }`}
            >
              Mes Concerts
            </Link>
            
            {/* Hellfest 2026 - Style officiel vert */}
            <Link 
              to="/hellfest-2026" 
              className={`px-4 py-4 text-sm font-bold transition-colors border-b-2 ${
                location.pathname === '/hellfest-2026' 
                  ? 'text-[#00ff00] border-[#00ff00]' 
                  : 'text-[#00cc00] border-transparent hover:text-[#00ff00] hover:bg-[#3d3d3d]'
              }`}
            >
              HELLFEST 2026
            </Link>

            <a 
              href="https://www.emp.fr" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-4 text-sm text-[#a0a0a0] hover:text-white hover:bg-[#3d3d3d] transition-colors"
            >
              Boutique
            </a>
            <a 
              href="https://www.discogs.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-4 text-sm text-[#a0a0a0] hover:text-white hover:bg-[#3d3d3d] transition-colors"
            >
              Vinyles
            </a>
            <a 
              href="https://www.bandsintown.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-4 text-sm text-[#a0a0a0] hover:text-white hover:bg-[#3d3d3d] transition-colors"
            >
              Concerts
            </a>
          </nav>

          {/* Auth - Style setlist.fm */}
          <div className="flex items-center gap-3">
            {!authLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:bg-[#3d3d3d] text-white h-9"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#4d94ff] flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                          {user.email?.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#2d2d2d] border-[#404040]">
                      <div className="px-2 py-1.5">
                        <p className="text-sm text-white truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-[#404040]" />
                      <DropdownMenuItem 
                        onClick={handleSignOut} 
                        className="text-red-400 hover:bg-[#3d3d3d] hover:text-red-300"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth">
                    <Button 
                      size="sm" 
                      className="gap-2 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white h-9 px-4"
                    >
                      <User className="w-4 h-4" />
                      Connexion
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
