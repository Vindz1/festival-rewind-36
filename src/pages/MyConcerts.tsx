import { useEffect, useState } from 'react';
import { Music, Calendar, ArrowRight, Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from "@/AuthContext";
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
  const [selectedUpcoming, setSelectedUpcoming] = useState<Set<string>>(new Set());

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
      venue: c.venue.name,
      eventDate: c.eventDate,
    }));
    localStorage.setItem('selected_concerts', JSON.stringify(selectedArray));
  };

  const toggleUpcoming = (concert: any) => {
    const newSelection = new Set(selectedUpcoming);
    if (newSelection.has(concert.id)) {
      newSelection.delete(concert.id);
    } else {
      newSelection.add(concert.id);
    }
    setSelectedUpcoming(newSelection);
    
    // Sauvegarder dans localStorage pour Generate.tsx
    const selectedArray = upcomingConcerts.filter(c => newSelection.has(c.id)).map(c => ({
      id: c.id,
      artist: c.artist_name || c.artist,
      eventDate: c.event_date || c.eventDate,
    }));
    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArray));
  };

  const handleGenerate = () => {
    if (activeTab === 'past') {
      if (selectedConcerts.size === 0) {
        toast.error('Veuillez sélectionner au moins un concert');
        return;
      }
      navigate('/generate');
    } else {
      if (selectedUpcoming.size === 0) {
        toast.error('Veuillez sélectionner au moins un concert');
        return;
      }
      navigate('/generate?mode=upcoming');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Music className="w-12 h-12 mx-auto mb-4 text-[#4d94ff] animate-pulse" />
            <p className="text-[#a0a0a0]">Chargement de vos concerts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header />
      
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Header - Style setlist.fm */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Mes Concerts</h1>
          <p className="text-sm text-[#a0a0a0]">
            {activeTab === 'past' 
              ? `${concerts.length} concerts assistés` 
              : `${upcomingConcerts.length} concerts à venir`}
          </p>
        </div>

        {/* Tabs - Style setlist.fm */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'past' | 'future')} className="mb-6">
          <TabsList className="bg-[#2d2d2d] border-b border-[#404040] rounded-none h-auto p-0 w-full justify-start">
            <TabsTrigger 
              value="past" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#4d94ff] rounded-none px-6 py-3 text-[#a0a0a0]"
            >
              I Was There
            </TabsTrigger>
            <TabsTrigger 
              value="future"
              className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#4d94ff] rounded-none px-6 py-3 text-[#a0a0a0]"
            >
              I'm Going
            </TabsTrigger>
          </TabsList>

          {/* Past concerts - Table style setlist.fm */}
          <TabsContent value="past" className="mt-0">
            {concerts.length === 0 ? (
              <div className="bg-[#2d2d2d] border border-[#404040] rounded p-12 text-center">
                <Music className="w-12 h-12 mx-auto mb-4 text-[#606060]" />
                <p className="text-[#a0a0a0] mb-4">Aucun concert trouvé</p>
                <a 
                  href="https://www.setlist.fm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#4d94ff] hover:underline text-sm"
                >
                  Ajouter des concerts sur setlist.fm
                </a>
              </div>
            ) : (
              <>
                <div className="bg-[#2d2d2d] border border-[#404040] rounded overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#252525] border-b border-[#404040]">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider w-12">
                          <input 
                            type="checkbox" 
                            checked={selectedConcerts.size === concerts.length}
                            onChange={() => {
                              if (selectedConcerts.size === concerts.length) {
                                setSelectedConcerts(new Set());
                                localStorage.removeItem('selected_concerts');
                              } else {
                                const all = new Set(concerts.map(c => c.id));
                                setSelectedConcerts(all);
                                localStorage.setItem('selected_concerts', JSON.stringify(concerts.map(c => ({
                                  id: c.id,
                                  artist: c.artist.name,
                                  venue: c.venue.name,
                                  eventDate: c.eventDate,
                                }))));
                              }
                            }}
                            className="rounded border-[#404040]"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                          Artiste
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                          Lieu
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider w-20">
                          Morceaux
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#404040]">
                      {concerts.map((concert) => (
                        <tr 
                          key={concert.id}
                          onClick={() => toggleConcert(concert)}
                          className="hover:bg-[#3d3d3d] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedConcerts.has(concert.id)}
                              onChange={() => toggleConcert(concert)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-[#404040]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{concert.artist.name}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0]">
                            {concert.venue.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0]">
                            {concert.eventDate}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0]">
                            {concert.sets?.set?.[0]?.song?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Generate button - Fixed bottom */}
                {selectedConcerts.size > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4">
                    <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                      <div className="text-white">
                        <span className="font-semibold">{selectedConcerts.size}</span>
                        <span className="text-[#a0a0a0] ml-1">concert{selectedConcerts.size > 1 ? 's' : ''} sélectionné{selectedConcerts.size > 1 ? 's' : ''}</span>
                      </div>
                      <Button 
                        onClick={handleGenerate}
                        className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white"
                      >
                        Générer la playlist
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Future concerts - Table style setlist.fm */}
          <TabsContent value="future" className="mt-0">
            {upcomingConcerts.length === 0 ? (
              <div className="bg-[#2d2d2d] border border-[#404040] rounded p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-[#606060]" />
                <p className="text-[#a0a0a0] mb-4">Aucun concert à venir</p>
                <a 
                  href="https://www.setlist.fm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#4d94ff] hover:underline text-sm"
                >
                  Ajouter des concerts sur setlist.fm
                </a>
              </div>
            ) : (
              <>
                <div className="bg-[#2d2d2d] border border-[#404040] rounded overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#252525] border-b border-[#404040]">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider w-12">
                          <input 
                            type="checkbox" 
                            checked={selectedUpcoming.size === upcomingConcerts.length}
                            onChange={() => {
                              if (selectedUpcoming.size === upcomingConcerts.length) {
                                setSelectedUpcoming(new Set());
                                localStorage.removeItem('selected_upcoming');
                              } else {
                                const all = new Set(upcomingConcerts.map(c => c.id));
                                setSelectedUpcoming(all);
                                localStorage.setItem('selected_upcoming', JSON.stringify(upcomingConcerts.map(c => ({
                                  id: c.id,
                                  artist: c.artist_name || c.artist,
                                  eventDate: c.event_date || c.eventDate,
                                }))));
                              }
                            }}
                            className="rounded border-[#404040]"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                          Artiste
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#404040]">
                      {upcomingConcerts.map((concert) => (
                        <tr 
                          key={concert.id}
                          onClick={() => toggleUpcoming(concert)}
                          className="hover:bg-[#3d3d3d] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedUpcoming.has(concert.id)}
                              onChange={() => toggleUpcoming(concert)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-[#404040]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">
                              {concert.artist_name || concert.artist}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0]">
                            {concert.event_date || concert.eventDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Generate button - Fixed bottom */}
                {selectedUpcoming.size > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4">
                    <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                      <div className="text-white">
                        <span className="font-semibold">{selectedUpcoming.size}</span>
                        <span className="text-[#a0a0a0] ml-1">concert{selectedUpcoming.size > 1 ? 's' : ''} sélectionné{selectedUpcoming.size > 1 ? 's' : ''}</span>
                      </div>
                      <Button 
                        onClick={handleGenerate}
                        className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white"
                      >
                        Générer la playlist
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyConcerts;
