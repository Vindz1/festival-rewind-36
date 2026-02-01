import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Calendar, Flame, ArrowRight, ChevronRight, Clock, ArrowLeft, Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MyConcerts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'past' | 'future'>(
    searchParams.get('tab') === 'future' ? 'future' : 'past'
  );
  const [concerts, setConcerts] = useState<any[]>([]);
  const [upcomingConcerts, setUpcomingConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcerts, setSelectedConcerts] = useState<Set<string>>(new Set());

  // Charger les concerts depuis setlist.fm ET Supabase
  useEffect(() => {
    const fetchAllConcerts = async () => {
      const username = localStorage.getItem('setlistfm_username');
      
      if (!username) {
        toast.error('Veuillez d\'abord connecter votre compte setlist.fm');
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        // Fetch concerts passés (setlist.fm)
        const response = await fetch(`/api/search?action=user&username=${username}`);
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const data = await response.json();
        const fetchedConcerts = data.results || [];
        console.log('Concerts récupérés:', fetchedConcerts);
        setConcerts(fetchedConcerts);

        // Fetch concerts à venir (setlist.fm scraping)
        try {
          const upcomingResponse = await fetch(`/api/upcoming-shows?username=${username}`);
          const upcomingData = await upcomingResponse.json();
          
          console.log('Upcoming shows response:', upcomingData);
          
          if (upcomingData.results && upcomingData.results.length > 0) {
            console.log('✅ Upcoming shows trouvés:', upcomingData.results);
            setUpcomingConcerts(upcomingData.results);
          } else {
            console.log('❌ Aucun upcoming show trouvé, essai Supabase...');
            // Fallback: charger depuis Supabase si rien trouvé
            if (user) {
              const { data: upcoming, error } = await supabase
                .from('upcoming_concerts')
                .select('*')
                .eq('user_id', user.id)
                .order('event_date', { ascending: true });

              if (!error && upcoming) {
                console.log('Concerts Supabase:', upcoming);
                setUpcomingConcerts(upcoming);
              }
            }
          }
        } catch (upcomingError) {
          console.error('Error fetching upcoming shows:', upcomingError);
        }
      } catch (error) {
        console.error('Error fetching concerts:', error);
        toast.error('Erreur lors du chargement de vos concerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAllConcerts();
  }, [navigate, user]);

  // Toggle sélection d'un concert
  const toggleConcert = (concert: any) => {
    const newSelection = new Set(selectedConcerts);
    if (newSelection.has(concert.id)) {
      newSelection.delete(concert.id);
    } else {
      newSelection.add(concert.id);
    }
    setSelectedConcerts(newSelection);
    
    // Sauvegarder dans localStorage pour Generate.tsx
    const selectedArray = concerts.filter(c => newSelection.has(c.id)).map(c => ({
      id: c.id,
      artist: c.artist.name,
      date: c.eventDate
    }));
    localStorage.setItem('selected_concerts', JSON.stringify(selectedArray));
  };

  // Séparer les concerts passés et futurs
  const now = new Date();
  
  // Fonction pour convertir DD-MM-YYYY en Date
  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('-');
    return new Date(`${year}-${month}-${day}`);
  };
  
  const pastConcerts = concerts.filter(concert => {
    if (!concert.eventDate) return true;
    const concertDate = parseDate(concert.eventDate);
    return concertDate && concertDate < now;
  });

  const selectedCount = selectedConcerts.size;

  if (loading) {
    return (
      <div className="min-h-screen bg-background noise flex items-center justify-center">
        <div className="animate-spin">
          <Flame className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  const ConcertList = ({ concerts }: { concerts: typeof concerts }) => (
    <div className="max-w-2xl mx-auto space-y-4">
      {concerts.map((concert, index) => {
        const isSelected = selectedConcerts.has(concert.id);
        return (
          <motion.div
            key={concert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => toggleConcert(concert)}
            className={`bg-card border rounded-xl p-4 flex items-center gap-4 transition-all cursor-pointer group ${
              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-fire shrink-0 transition-all ${
              isSelected ? 'bg-gradient-fire' : 'bg-muted'
            }`}>
              {isSelected ? (
                <ChevronRight className="w-6 h-6 text-primary-foreground" />
              ) : (
                <Flame className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl text-foreground truncate group-hover:text-primary transition-colors">
                {concert.artist.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {concert.venue?.name && <span>{concert.venue.name}</span>}
                {concert.eventDate && (
                  <>
                    {concert.venue?.name && <span>•</span>}
                    <span>{(() => {
                      const [day, month, year] = concert.eventDate.split('-');
                      const date = new Date(`${year}-${month}-${day}`);
                      return date.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      });
                    })()}</span>
                  </>
                )}
              </div>
            </div>
            {isSelected && (
              <div className="text-primary font-medium text-sm shrink-0">
                ✓ Sélectionné
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );

  const UpcomingConcertsList = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      {upcomingConcerts.map((concert, index) => {
        // Handle both setlist.fm scraped format and Supabase format
        const artistName = concert.artist?.name || concert.artist_name;
        const eventName = concert.event_name;
        const venueName = concert.venue?.name || concert.venue_name;
        const eventDate = concert.eventDate || concert.event_date;
        
        return (
          <motion.div
            key={concert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-fire flex items-center justify-center shadow-fire shrink-0">
              <Music className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl text-foreground truncate">
                {artistName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {eventName && <span>{eventName}</span>}
                {venueName && (
                  <>
                    {eventName && <span>•</span>}
                    <span>{venueName}</span>
                  </>
                )}
                {eventDate && (
                  <>
                    {(eventName || venueName) && <span>•</span>}
                    <span>{typeof eventDate === 'string' && eventDate.includes('-') && eventDate.length === 10
                      ? new Date(eventDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : eventDate
                    }</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background noise">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container px-4">
          {/* Back button */}
          <div className="max-w-4xl mx-auto mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </div>

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
              Sélectionnez les concerts à inclure dans votre playlist
            </p>
            
            {!user && selectedCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm">
                <span className="text-muted-foreground">💡 Créez un compte pour exporter vos {selectedCount} concert{selectedCount > 1 ? 's' : ''}</span>
                <Link to="/auth">
                  <Button size="sm" variant="outline">S'inscrire</Button>
                </Link>
              </div>
            )}
          </motion.div>

          {concerts.length === 0 && upcomingConcerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 max-w-md mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Music className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-2">Aucun concert trouvé</h2>
              <p className="text-muted-foreground mb-6">
                Ajoutez des concerts sur votre profil setlist.fm
              </p>
              <a href="https://www.setlist.fm" target="_blank" rel="noopener noreferrer">
                <Button variant="fire" className="gap-2">
                  Aller sur setlist.fm
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          ) : (
            <>
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
                    {upcomingConcerts.length > 0 && (
                      <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {upcomingConcerts.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Past Concerts Tab */}
                <TabsContent value="past">
                  {pastConcerts.length > 0 ? (
                    <>
                      <ConcertList concerts={pastConcerts} />
                      
                      {/* Floating Action Button */}
                      {selectedCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="fixed bottom-8 right-8 z-50"
                        >
                          <Link to="/generate">
                            <Button 
                              variant="fire" 
                              size="lg" 
                              className="gap-2 shadow-lg hover:shadow-xl transition-shadow rounded-full px-6 py-6"
                            >
                              <Music className="w-5 h-5" />
                              Générer ({selectedCount})
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun concert passé</p>
                    </div>
                  )}
                </TabsContent>

                {/* Future Concerts Tab */}
                <TabsContent value="future">
                  {upcomingConcerts.length > 0 ? (
                    <>
                      <UpcomingConcertsList />
                      {user && (
                        <div className="text-center mt-6">
                          <Link to="/im-going">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Plus className="w-4 h-4" />
                              Ajouter manuellement
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Aucun concert à venir trouvé</p>
                      {user ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-4">
                            Ajoutez vos concerts à venir manuellement
                          </p>
                          <Link to="/im-going">
                            <Button variant="fire" className="gap-2">
                              <Plus className="w-4 h-4" />
                              Ajouter des concerts
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Connectez-vous pour ajouter des concerts à venir
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyConcerts;
