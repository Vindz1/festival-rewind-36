import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Calendar, Flame, ArrowRight, ChevronRight, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Link, useNavigate } from 'react-router-dom';

const MyConcerts = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userConcerts, loading: concertsLoading } = useUserConcerts();
  const [activeTab, setActiveTab] = useState<'past' | 'future'>('past');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Séparer les concerts passés et futurs
  const now = new Date();
  const pastConcerts = userConcerts.filter(concert => {
    if (!concert.event_date) return true; // Par défaut, considérer comme passé
    return new Date(concert.event_date) < now;
  });
  
  const futureConcerts = userConcerts.filter(concert => {
    if (!concert.event_date) return false;
    return new Date(concert.event_date) >= now;
  });

  // Group concerts by festival
  const groupPastByFestival = pastConcerts.reduce((acc, concert) => {
    const festivalKey = concert.setlist_fm_event_id || 'unknown';
    if (!acc[festivalKey]) acc[festivalKey] = [];
    acc[festivalKey].push(concert);
    return acc;
  }, {} as Record<string, typeof userConcerts>);

  const groupFutureByFestival = futureConcerts.reduce((acc, concert) => {
    const festivalKey = concert.setlist_fm_event_id || 'unknown';
    if (!acc[festivalKey]) acc[festivalKey] = [];
    acc[festivalKey].push(concert);
    return acc;
  }, {} as Record<string, typeof userConcerts>);

  const pastFestivalCount = Object.keys(groupPastByFestival).length;
  const futureFestivalCount = Object.keys(groupFutureByFestival).length;

  if (authLoading || concertsLoading) {
    return (
      <div className="min-h-screen bg-background noise flex items-center justify-center">
        <div className="animate-spin">
          <Flame className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  const ConcertList = ({ concerts }: { concerts: typeof userConcerts }) => (
    <div className="max-w-2xl mx-auto space-y-4">
      {concerts.map((concert, index) => (
        <motion.div
          key={concert.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => navigate(`/event/${concert.setlist_fm_event_id}?name=${encodeURIComponent(concert.artist_name)}&type=setlist`)}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-fire flex items-center justify-center shadow-fire shrink-0">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl text-foreground truncate group-hover:text-primary transition-colors">
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
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </motion.div>
      ))}
    </div>
  );

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
              Votre historique et vos concerts à venir
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'past' | 'future')} className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="past" className="gap-2">
                <Music className="w-4 h-4" />
                I Was There
                {pastConcerts.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                    {pastConcerts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="future" className="gap-2">
                <Clock className="w-4 h-4" />
                I'm Going
                {futureConcerts.length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                    {futureConcerts.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Past Concerts Tab */}
            <TabsContent value="past">
              {/* Stats */}
              {pastConcerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-12"
                >
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                      <Music className="w-6 h-6" />
                    </div>
                    <div className="font-display text-2xl text-gradient-fire">{pastConcerts.length}</div>
                    <div className="text-sm text-muted-foreground">Concert{pastConcerts.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="font-display text-2xl text-gradient-fire">{pastFestivalCount}</div>
                    <div className="text-sm text-muted-foreground">Festival{pastFestivalCount > 1 ? 's' : ''}</div>
                  </div>
                </motion.div>
              )}

              {pastConcerts.length > 0 ? (
                <ConcertList concerts={pastConcerts} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16 max-w-md mx-auto"
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Music className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="font-display text-2xl text-foreground mb-2">Aucun concert passé</h2>
                  <p className="text-muted-foreground mb-6">
                    Ajoutez les concerts auxquels vous avez assisté
                  </p>
                  <Link to="/festivals">
                    <Button variant="fire" className="gap-2">
                      Explorer les festivals
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </TabsContent>

            {/* Future Concerts Tab */}
            <TabsContent value="future">
              {/* Stats */}
              {futureConcerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-12"
                >
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="font-display text-2xl text-gradient-fire">{futureConcerts.length}</div>
                    <div className="text-sm text-muted-foreground">Concert{futureConcerts.length > 1 ? 's' : ''} à venir</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="font-display text-2xl text-gradient-fire">{futureFestivalCount}</div>
                    <div className="text-sm text-muted-foreground">Festival{futureFestivalCount > 1 ? 's' : ''}</div>
                  </div>
                </motion.div>
              )}

              {futureConcerts.length > 0 ? (
                <ConcertList concerts={futureConcerts} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16 max-w-md mx-auto"
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="font-display text-2xl text-foreground mb-2">Aucun concert prévu</h2>
                  <p className="text-muted-foreground mb-6">
                    Ajoutez les concerts auxquels vous allez assister
                  </p>
                  <Link to="/festivals">
                    <Button variant="fire" className="gap-2">
                      Explorer les festivals
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default MyConcerts;
