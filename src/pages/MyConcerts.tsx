import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Calendar, Flame, ArrowRight, ChevronRight, Clock, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const MyConcerts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'past' | 'future'>(
    searchParams.get('tab') === 'future' ? 'future' : 'past'
  );
  const [concerts, setConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcerts, setSelectedConcerts] = useState<Set<string>>(new Set());

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

  // Charger les concerts depuis setlist.fm
  useEffect(() => {
    const fetchConcerts = async () => {
      const username = localStorage.getItem('setlistfm_username');
      
      if (!username) {
        toast.error('Veuillez d\'abord connecter votre compte setlist.fm');
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        // Nettoyer l'ancien système de sélection
        localStorage.removeItem('selected_concerts');
        
        const response = await fetch(`/api/search?action=user&username=${username}`);
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const data = await response.json();
        
        // L'API setlist.fm retourne les concerts dans data.results
        const fetchedConcerts = data.results || [];
        console.log('Concerts récupérés:', fetchedConcerts);
        setConcerts(fetchedConcerts);
      } catch (error) {
        console.error('Error fetching concerts:', error);
        toast.error('Erreur lors du chargement de vos concerts');
      } finally {
        setLoading(false);
      }
    };

    fetchConcerts();
  }, [navigate]);

  // Séparer les concerts passés et futurs
  const now = new Date();
  const pastConcerts = concerts.filter(concert => {
    if (!concert.eventDate) return true;
    return new Date(concert.eventDate) < now;
  });
  
  const futureConcerts = concerts.filter(concert => {
    if (!concert.eventDate) return false;
    return new Date(concert.eventDate) >= now;
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
                    <span>{new Date(concert.eventDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}</span>
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

          {concerts.length === 0 ? (
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
                    {futureConcerts.length > 0 && (
                      <span className="ml-1 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {futureConcerts.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Past Concerts Tab */}
                <TabsContent value="past">
                  {pastConcerts.length > 0 ? (
                    <>
                      <ConcertList concerts={pastConcerts} />
                      {selectedCount > 0 && (
                        <div className="text-center mt-8">
                          <Link to="/generate">
                            <Button variant="fire" size="lg" className="gap-2">
                              <Music className="w-5 h-5" />
                              Générer ma playlist ({selectedCount} concert{selectedCount > 1 ? 's' : ''})
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
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
                  {futureConcerts.length > 0 ? (
                    <ConcertList concerts={futureConcerts} />
                  ) : (
                    <div className="text-center py-16">
                      <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun concert à venir</p>
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
