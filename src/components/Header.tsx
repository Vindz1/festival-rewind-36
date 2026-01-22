import { motion } from 'framer-motion';
import { Flame, Music, LogOut, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSpotify } from '@/hooks/useSpotify';
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
  const isHome = location.pathname === '/';
  const { user, signOut, loading: authLoading } = useAuth();
  const { isConnected: spotifyConnected, connect: connectSpotify, loading: spotifyLoading } = useSpotify();

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
              <Flame className="w-8 h-8 text-primary glow-fire transition-transform group-hover:scale-110" />
            </div>
            <span className="font-display text-2xl tracking-wider text-foreground">
              SETLIST<span className="text-gradient-fire">FEST</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/festivals" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/festivals' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Festivals
            </Link>
            <Link 
              to="/my-concerts" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === '/my-concerts' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Mes Concerts
            </Link>
          </nav>

          {/* Right section - Auth & Spotify */}
          <div className="flex items-center gap-3">
            {/* Spotify status indicator */}
            {user && !authLoading && !spotifyLoading && (
              <button
                onClick={() => !spotifyConnected && connectSpotify()}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  spotifyConnected
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-muted text-muted-foreground border border-border hover:border-primary/50 hover:text-primary cursor-pointer'
                }`}
                title={spotifyConnected ? 'Spotify connecté' : 'Cliquez pour connecter Spotify'}
              >
                <div className={`w-2 h-2 rounded-full ${spotifyConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                <span className="hidden sm:inline">
                  {spotifyConnected ? 'Spotify lié' : 'Lier Spotify'}
                </span>
              </button>
            )}

            {/* User menu or login button */}
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
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${spotifyConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                          <span className="text-xs text-muted-foreground">
                            {spotifyConnected ? 'Spotify connecté' : 'Spotify non lié'}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      {!spotifyConnected && (
                        <DropdownMenuItem onClick={connectSpotify}>
                          <Music className="w-4 h-4 mr-2" />
                          Connecter Spotify
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    {isHome ? (
                      <Link to="/festivals">
                        <Button variant="fire" size="sm" className="gap-2">
                          <Music className="w-4 h-4" />
                          Commencer
                        </Button>
                      </Link>
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
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
