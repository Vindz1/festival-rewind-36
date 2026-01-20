import { motion } from 'framer-motion';
import { Flame, Music } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

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

          {/* CTA */}
          {isHome && (
            <Link to="/festivals">
              <Button variant="fire" size="sm" className="gap-2">
                <Music className="w-4 h-4" />
                Commencer
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};
