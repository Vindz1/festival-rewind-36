import { motion } from 'framer-motion';
import { Music, LogOut, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
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
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Music className="w-8 h-8 text-primary glow-fire transition-transform group-hover:scale-110" />
            </div>
            <span className="font-display text-2xl tracking-wider text-foreground">
              SETLIST<span className="text-gradient-fire">MEMORY</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="https://www.emp.fr" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Boutique
            </a>
            <a 
              href="https://www.discogs.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Vinyles
            </a>
            <a 
              href="https://www.bandsintown.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Concerts
            </a>
            <Link 
              to="/my-concerts" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/my-concerts' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Mes Concerts
            </Link>
          </nav>

          {/* Right section - Auth */}
          <div className="flex items-center gap-3">
            {!authLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-fire flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                          {user.email?.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="gap-2">
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
    </motion.header>
  );
};
