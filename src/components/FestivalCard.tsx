import { motion } from 'framer-motion';
import { Calendar, MapPin, Music } from 'lucide-react';
import { Festival } from '@/data/festivals';
import { Badge } from '@/components/ui/badge';

interface FestivalCardProps {
  festival: Festival;
  onClick: () => void;
  isSelected?: boolean;
  attendedCount?: number;
}

export const FestivalCard = ({ festival, onClick, isSelected, attendedCount = 0 }: FestivalCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl cursor-pointer
        bg-gradient-card border transition-all duration-300
        ${isSelected 
          ? 'border-primary shadow-glow' 
          : 'border-border hover:border-primary/50 shadow-card hover:shadow-fire'
        }
      `}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-3xl text-foreground">
              {festival.name}
            </h3>
            <span className="font-display text-5xl text-gradient-fire">
              {festival.year}
            </span>
          </div>
          {attendedCount > 0 && (
            <Badge variant="fire" className="text-sm">
              <Music className="w-3 h-3 mr-1" />
              {attendedCount} concerts
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{festival.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{festival.dates}</span>
          </div>
        </div>

        {/* Artists preview */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {festival.artists.slice(0, 5).map((artist) => (
            <Badge 
              key={artist.id} 
              variant="secondary" 
              className="text-xs"
            >
              {artist.name}
            </Badge>
          ))}
          {festival.artists.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{festival.artists.length - 5}
            </Badge>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`h-1 w-full ${isSelected ? 'bg-gradient-fire' : 'bg-gradient-to-r from-primary/50 via-primary to-primary/50'}`} />
    </motion.div>
  );
};
