import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Calendar, Flame, ArrowRight, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Link, useNavigate } from 'react-router-dom';

const MyConcerts = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userConcerts, loading: concertsLoading } = useUserConcerts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Group concerts by festival (using setlist_fm_event_id pattern)
  const groupedByFestival = userConcerts.reduce((acc, concert) => {
    const festivalKey = concert.setlist_fm_event_id || 'unknown';
    if (!acc[festivalKey]) {
      acc[festivalKey] = [];
    }
    acc[festivalKey].push(concert);
    return acc;
  }, {} as Record<string, typeof userConcerts>);

  const festivalCount = Object.keys(groupedByFestival).length;
  const totalConcerts = userConcerts.length;

  if (authLoading || concertsLoading) {
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
              MES <span className="text-gradient-fire">CONCERTS</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Votre historique de concerts aux festivals
            </p>
          </motion.div>

          {/* Stats */}
          {totalConcerts > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-12"
            >
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                  <Music className="w-6 h-6" />
                </div>
                <div className="font-display text-2xl text-gradient-fire">{totalConcerts}</div>
                <div className="text-sm text-muted-foreground">Concert{totalConcerts > 1 ? 's' : ''}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="font-display text-2xl text-gradient-fire">{festivalCount}</div>
                <div className="text-sm text-muted-foreground">Festival{festivalCount > 1 ? 's' : ''}</div>
              </div>
            </motion.div>
          )}

          {/* Concert list */}
          {totalConcerts > 0 && (
            <div className="max-w-2xl mx-auto space-y-4">
              {userConcerts.map((concert, index) => (
                <motion.div
                  key={concert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-fire flex items-center justify-center shadow-fire shrink-0">
                    <Flame className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl text-foreground truncate">
                      {concert.artist_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {concert.venue_name && <span>{concert.venue_name}</span>}
                      {concert.event_date && (
                        <>
                          {concert.venue_name && <span>•</span>}
                          <span>{new Date(concert.event_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {concert.setlist_fm_event_id.match(/\d{4}/)?.[0] || 'Festival'}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}

          {totalConcerts === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 max-w-md mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Music className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-2">Aucun concert enregistré</h2>
              <p className="text-muted-foreground mb-6">
                Commencez par sélectionner les concerts auxquels vous avez assisté
              </p>
              <Link to="/festivals">
                <Button variant="fire" className="gap-2">
                  Explorer les festivals
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyConcerts;
