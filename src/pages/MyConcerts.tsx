import { useEffect, useState } from 'react';
import { Music, Calendar, ArrowRight, Plus, MapPin } from 'lucide-react';
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

  // --- HELPER FUNCTIONS ---

  const getArtistName = (c: any) => {
    let name = 'Artiste inconnu';
    
    // Tentative de récupération du nom
    if (c.artist_name) name = c.artist_name;
    else if (typeof c.artist === 'string') name = c.artist;
    else if (c.artist?.name) name = c.artist.name;

    // PATCH "Jun" et Mois : Si l'artiste est un mois, on l'ignore ou on affiche une alerte
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (MONTHS.includes(name) || name.length < 2) {
         // Si le backend a mal parsé, on essaie de voir si on a le titre de l'event
         if (c.event_name) return c.event_name;
         return 'Nom introuvable';
    }
    return name;
  };

  const getVenueName = (c: any) => {
    // Setlist.fm object
    if (c.venue?.name) return c.venue.name;
    // Supabase column
    if (c.venue_name) return c.venue_name;
    // Setlist.fm string simple
    if (typeof c.venue === 'string') return c.venue;
    // Fallback: Ville
    if (c.city?.name) return `${c.city.name} (Lieu TBD)`;
    
    return '—';
  };

  const getEventDate = (c: any) => {
    // Récupérer la date brute
    const raw = c.event_date || c.eventDate || c.date;
    
    if (!raw) return 'Date à confirmer';
    if (raw === 'À venir') return raw; 

    // Gestion du format Setlist.fm "DD-MM-YYYY"
    const ddmmyyyy = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;
    const match = raw.match(ddmmyyyy);
    
    if (match) {
        const isoDate = `${match[3]}-${match[2]}-${match[1]}`;
        try {
          const dateObj = new Date(isoDate);
          return dateObj.toLocaleDateString('fr-FR', {
            day: 'numeric', 
            month: 'long', 
            year: 'numeric'
          });
        } catch(e) { return raw; }
    }

    // Format standard ISO
    try {
      const dateObj = new Date(raw);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    } catch (e) { }

    return raw;
  };

  // --- DATA LOADING ---

  useEffect(() => {
    const fetchAllConcerts = async () => {
      const username = localStorage.getItem('setlistfm_username');
      
      if (!username) {
        // toast.error('Veuillez d\'abord connecter votre compte setlist.fm');
        // navigate('/');
        // On ne force pas la redirection ici pour éviter les boucles si l'user veut juste voir ses ajouts manuels
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Fetch concerts passés (setlist.fm)
        try {
          const response = await fetch(`/api/search?action=user&username=${username}`);
          if (response.ok) {
            const data = await response.json();
            setConcerts(data.results || []);
          }
        } catch (e) { console.error("Err past concerts", e); }

        // 2. Fetch concerts à venir
        try {
          const upcomingResponse = await fetch(`/api/upcoming-shows?username=${username}`);
          const upcomingData = await upcomingResponse.json();
          
          let upcomingList: any[] = [];
          if (upcomingData.results && upcomingData.results.length > 0) {
            upcomingList = upcomingData.results;
          }

          // Merge avec Supabase si connecté
          if (user) {
            const { data: supabaseUpcoming, error } = await supabase
              .from('upcoming_concerts')
              .select('*')
              .eq('user_id', user.id)
              .order('event_date', { ascending: true });

            if (!error && supabaseUpcoming) {
              upcomingList = [...upcomingList, ...supabaseUpcoming];
            }
          }
          
          // Filtrage côté client pour retirer les doublons ou erreurs manifestes ("Jun")
          const cleanList = upcomingList.filter(c => {
             const name = getArtistName(c);
             return name !== 'Nom introuvable' && name !== 'Jun';
          });

          setUpcomingConcerts(cleanList);

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

  // --- SELECTION LOGIC ---

  const toggleConcert = (concert: any) => {
    const newSelection = new Set(selectedConcerts);
    if (newSelection.has(concert.id)) newSelection.delete(concert.id);
    else newSelection.add(concert.id);
    setSelectedConcerts(newSelection);
    
    const selectedArray = concerts.filter(c => newSelection.has(c.id)).map(c => ({
      id: c.id,
      artist: getArtistName(c),
      venue: getVenueName(c),
      eventDate: c.eventDate,
    }));
    localStorage.setItem('selected_concerts', JSON.stringify(selectedArray));
  };

  const toggleUpcoming = (concert: any) => {
    const newSelection = new Set(selectedUpcoming);
    if (newSelection.has(concert.id)) newSelection.delete(concert.id);
    else newSelection.add(concert.id);
    setSelectedUpcoming(newSelection);
    
    const selectedArray = upcomingConcerts.filter(c => newSelection.has(c.id)).map(c => ({
      id: c.id,
      artist: getArtistName(c),
      eventDate: getEventDate(c),
    }));
    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArray));
  };

  const handleGenerate = () => {
    if (activeTab === 'past') {
      if (selectedConcerts.size === 0) {
        toast.error('Sélectionnez au moins un concert');
        return;
      }
      navigate('/generate');
    } else {
      if (selectedUpcoming.size === 0) {
        toast.error('Sélectionnez au moins un concert');
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
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Mes Concerts</h1>
          <p className="text-sm text-[#a0a0a0]">
            {activeTab === 'past' 
              ? `${concerts.length} concerts assistés` 
              : `${upcomingConcerts.length} concerts à venir`}
          </p>
        </div>

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

          {/* --- TAB: I WAS THERE --- */}
          <TabsContent value="past" className="mt-0">
            {concerts.length === 0 ? (
              <div className="bg-[#2d2d2d] border border-[#404040] rounded p-12 text-center">
                <Music className="w-12 h-12 mx-auto mb-4 text-[#606060]" />
                <p className="text-[#a0a0a0] mb-4">Aucun concert trouvé</p>
              </div>
            ) : (
              <>
                <div className="bg-[#2d2d2d] border border-[#404040] rounded overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#252525] border-b border-[#404040]">
                      <tr>
                        <th className="px-4 py-3 w-12">
                          <input 
                            type="checkbox" 
                            checked={selectedConcerts.size === concerts.length}
                            onChange={() => {
                              if (selectedConcerts.size === concerts.length) setSelectedConcerts(new Set());
                              else setSelectedConcerts(new Set(concerts.map(c => c.id)));
                            }}
                            className="rounded border-[#404040]"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase">Artiste</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase hidden md:table-cell">Lieu</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase w-20">Morceaux</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#404040]">
                      {concerts.map((concert) => (
                        <tr key={concert.id} onClick={() => toggleConcert(concert)} className="hover:bg-[#3d3d3d] cursor-pointer transition-colors">
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedConcerts.has(concert.id)} readOnly className="rounded border-[#404040]" />
                          </td>
                          <td className="px-4 py-3 font-medium text-white">{getArtistName(concert)}</td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0] hidden md:table-cell">{getVenueName(concert)}</td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0]">{getEventDate(concert)}</td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0]">{concert.sets?.set?.[0]?.song?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Footer Past */}
                {selectedConcerts.size > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4 z-50 animate-in slide-in-from-bottom-2">
                    <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                      <div className="text-white">
                        <span className="font-semibold">{selectedConcerts.size}</span>
                        <span className="text-[#a0a0a0] ml-1">concerts sélectionnés</span>
                      </div>
                      <Button onClick={handleGenerate} className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white">
                        Générer la playlist <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* --- TAB: I'M GOING (FUTURE) --- */}
          <TabsContent value="future" className="mt-0">
            {upcomingConcerts.length === 0 ? (
              <div className="bg-[#2d2d2d] border border-[#404040] rounded p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-[#606060]" />
                <p className="text-[#a0a0a0] mb-4">Aucun concert à venir</p>
                <a href="https://www.setlist.fm" target="_blank" className="text-[#4d94ff] hover:underline text-sm">
                  Ajouter sur setlist.fm
                </a>
              </div>
            ) : (
              <>
                <div className="bg-[#2d2d2d] border border-[#404040] rounded overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#252525] border-b border-[#404040]">
                      <tr>
                        <th className="px-4 py-3 w-12">
                          <input 
                            type="checkbox" 
                            checked={selectedUpcoming.size === upcomingConcerts.length}
                            onChange={() => {
                              if (selectedUpcoming.size === upcomingConcerts.length) setSelectedUpcoming(new Set());
                              else setSelectedUpcoming(new Set(upcomingConcerts.map(c => c.id)));
                            }}
                            className="rounded border-[#404040]"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase">Artiste</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase hidden md:table-cell">Lieu</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#404040]">
                      {upcomingConcerts.map((concert) => (
                        <tr key={concert.id} onClick={() => toggleUpcoming(concert)} className="hover:bg-[#3d3d3d] cursor-pointer transition-colors">
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedUpcoming.has(concert.id)} readOnly className="rounded border-[#404040]" />
                          </td>
                          <td className="px-4 py-3 font-medium text-white">
                            {getArtistName(concert)}
                            <div className="md:hidden text-xs text-[#a0a0a0] mt-1">{getVenueName(concert)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0] hidden md:table-cell">
                            {getVenueName(concert)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#a0a0a0]">
                            {getEventDate(concert)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Future */}
                {selectedUpcoming.size > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4 z-50 animate-in slide-in-from-bottom-2">
                    <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                      <div className="text-white">
                        <span className="font-semibold">{selectedUpcoming.size}</span>
                        <span className="text-[#a0a0a0] ml-1">concerts sélectionnés</span>
                      </div>
                      <Button onClick={handleGenerate} className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white">
                        Générer la playlist <ArrowRight className="w-4 h-4 ml-2" />
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
