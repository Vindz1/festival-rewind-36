import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function ShareFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link to="/partage">
      <motion.div
        className="fixed bottom-6 right-6 z-40 group"
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
              className="absolute right-16 top-1/2 -translate-y-1/2 bg-[#252525] text-white px-4 py-2 rounded-lg border border-[#333] whitespace-nowrap shadow-lg"
            >
              <p className="text-sm font-bold">Partager Setlive</p>
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-[#252525]"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton principal */}
        <div className="relative">
          {/* Effet de glow animé */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#4d94ff] to-purple-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 animate-pulse-slow"></div>
          
          {/* Bouton */}
          <div className="relative bg-gradient-to-r from-[#4d94ff] to-purple-500 p-4 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
