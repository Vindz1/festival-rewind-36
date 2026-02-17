import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function ShareFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  // Sur la page /generate, on remonte le bouton pour ne pas gêner
  const isGeneratePage = location.pathname === '/generate';

  return (
    <Link to="/partage">
      <motion.div
        className={`fixed right-4 sm:right-6 z-40 group ${
          isGeneratePage 
            ? 'bottom-20 sm:bottom-6' // Remonté sur mobile en page generate
            : 'bottom-6'
        }`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-14 top-1/2 -translate-y-1/2 bg-[#252525] text-white px-3 py-2 rounded-lg border border-[#333] whitespace-nowrap shadow-lg"
            >
              <p className="text-sm font-bold">Partager Setlive</p>
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-[#252525]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton - plus petit sur mobile */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#4d94ff] to-purple-500 rounded-full blur-lg opacity-40 group-hover:opacity-70 animate-pulse-slow" />
          <div className="relative bg-gradient-to-r from-[#4d94ff] to-purple-500 p-3 sm:p-4 rounded-full shadow-lg cursor-pointer">
            <Share2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
