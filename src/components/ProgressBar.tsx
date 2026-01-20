import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export const ProgressBar = ({ progress, label }: ProgressBarProps) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-primary font-semibold">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-fire rounded-full shadow-fire relative"
        >
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{ backgroundSize: '200% 100%' }}
          />
        </motion.div>
      </div>
    </div>
  );
};
