import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Calendar, Flame } from 'lucide-react';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';

// Mock data for attended concerts
const mockAttendedConcerts = [
  { id: '1', artist: 'Metallica', festival: 'Hellfest 2024', date: '27 Juin 2024', stage: 'Mainstage' },
  { id: '2', artist: 'Gojira', festival: 'Hellfest 2024', date: '28 Juin 2024', stage: 'Mainstage' },
  { id: '3', artist: 'Ghost', festival: 'Hellfest 2024', date: '28 Juin 2024', stage: 'Mainstage' },
  { id: '4', artist: 'Iron Maiden', festival: 'Hellfest 2023', date: '18 Juin 2023', stage: 'Mainstage' },
  { id: '5', artist: 'KISS', festival: 'Hellfest 2023', date: '17 Juin 2023', stage: 'Mainstage' },
];

const MyConcerts = () => {
  const [concerts] = useState(mockAttendedConcerts);

  return (
    <div className="min-h-screen bg-background noise">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-5xl md:text-7xl text-foreground mb-4">
              MES <span className="text-gradient-fire">CONCERTS</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Votre historique de concerts aux festivals
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12"
          >
            {[
              { icon: <Music className="w-6 h-6" />, value: concerts.length, label: 'Concerts' },
              { icon: <Calendar className="w-6 h-6" />, value: '2', label: 'Festivals' },
              { icon: <Flame className="w-6 h-6" />, value: '50+', label: 'Morceaux' },
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                  {stat.icon}
                </div>
                <div className="font-display text-2xl text-gradient-fire">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Concert list */}
          <div className="max-w-2xl mx-auto space-y-4">
            {concerts.map((concert, index) => (
              <motion.div
                key={concert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-fire flex items-center justify-center shadow-fire shrink-0">
                  <Flame className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-xl text-foreground truncate">
                    {concert.artist}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{concert.festival}</span>
                    <span>•</span>
                    <span>{concert.date}</span>
                  </div>
                </div>
                <Badge variant="fire">{concert.stage}</Badge>
              </motion.div>
            ))}
          </div>

          {concerts.length === 0 && (
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-2xl text-foreground mb-2">Aucun concert enregistré</h2>
              <p className="text-muted-foreground">
                Commencez par sélectionner les festivals auxquels vous avez assisté
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyConcerts;
