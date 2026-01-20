import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FestivalCard } from '@/components/FestivalCard';
import { Button } from '@/components/ui/button';
import { festivals } from '@/data/festivals';

const Festivals = () => {
  const [selectedFestivals, setSelectedFestivals] = useState<string[]>([]);

  const toggleFestival = (id: string) => {
    setSelectedFestivals((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background noise">
      <Header />

      <main className="pt-24 pb-32">
        <div className="container px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-5xl md:text-7xl text-foreground mb-4">
              CHOISISSEZ VOS <span className="text-gradient-fire">FESTIVALS</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Sélectionnez les éditions auxquelles vous avez participé pour retrouver vos concerts
            </p>
          </motion.div>

          {/* Festival Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {festivals.map((festival, index) => (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FestivalCard
                  festival={festival}
                  onClick={() => toggleFestival(festival.id)}
                  isSelected={selectedFestivals.includes(festival.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      {selectedFestivals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 glass border-t border-border"
        >
          <div className="container px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {selectedFestivals.length} festival{selectedFestivals.length > 1 ? 's' : ''} sélectionné{selectedFestivals.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Continuez pour choisir vos concerts
                  </div>
                </div>
              </div>
              <Link to={`/concerts?festivals=${selectedFestivals.join(',')}`}>
                <Button variant="fire" className="gap-2">
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Festivals;
