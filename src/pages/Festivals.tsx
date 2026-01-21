import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FestivalCard } from '@/components/FestivalCard';
import { festivals } from '@/data/festivals';
import { useAuth } from '@/hooks/useAuth';
import { Flame } from 'lucide-react';

const Festivals = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background noise flex items-center justify-center">
        <div className="animate-spin">
          <Flame className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

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
              CHOISISSEZ VOTRE <span className="text-gradient-fire">FESTIVAL</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Sélectionnez une édition pour voir les artistes et marquer vos concerts
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
                  onClick={() => navigate(`/festivals/${festival.id}`)}
                  isSelected={false}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Festivals;
