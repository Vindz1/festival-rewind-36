import { motion } from 'framer-motion';
import { Clock, Check } from 'lucide-react';
import { Artist, stages } from '@/data/festivals';
import { Badge } from '@/components/ui/badge';

interface ArtistCardProps {
  artist: Artist;
  isSelected: boolean;
  onToggle: () => void;
}

export const ArtistCard = ({ artist, isSelected, onToggle }: ArtistCardProps) => {
  const stage = stages[artist.stage];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      className={`
        relative overflow-hidden rounded-lg cursor-pointer
        transition-all duration-300 group
        ${isSelected
          ? 'bg-primary/20 border-2 border-primary shadow-fire'
          : 'bg-card border border-border hover:border-primary/50 hover:bg-card/80'
        }
      `}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Selection indicator */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0
          transition-all duration-300
          ${isSelected
            ? 'bg-gradient-fire shadow-fire'
            : 'bg-muted border border-border group-hover:border-primary/50'
          }
        `}>
          {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
        </div>

        {/* Artist info */}
        <div className="flex-1 min-w-0">
          <h4 className={`
            font-display text-xl truncate transition-colors
            ${isSelected ? 'text-primary' : 'text-foreground'}
          `}>
            {artist.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={stage.color} className="text-xs">
              {stage.name}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Jour {artist.day} • {artist.time}
            </span>
          </div>
        </div>
      </div>

      {/* Selected glow effect */}
      {isSelected && (
        <motion.div
          layoutId="glow"
          className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.div>
  );
};
