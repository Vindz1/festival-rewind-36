import { useEffect, useState } from 'react';
import { Music, Calendar, ArrowRight, MapPin, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from "@/AuthContext";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient'; // Vérifiez que ce chemin est bon chez vous
import { toast } from 'sonner';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';

export default function MyConcerts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // États des données
  const [activeTab, setActiveTab] = useState<'past' | 'future'>(
    searchParams.get('tab') === 'future' ? 'future' : 'past'
  );
  const [concerts, setConcerts] = useState<any[]>([]);
  const [upcomingConcerts, setUpcomingConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États de sélection
  const [selectedConcerts, setSelectedConcerts] = useState<Set<string>>(new Set());
  const [selectedUpcoming, setSelectedUpcoming] = useState<Set<string>>(new Set());
  
  // État Premium (pour les pubs)
  const [isPremium, setIsPremium] = useState(false);

  // Helpers pour éviter les crashs si l'API renvoie des formats bizarres
  const getArtistName = (c: any) => c.artist?.name || c.artist || 'Artiste inconnu';
  const getVenueName = (c: any) => c.venue?.name || c.venue_name || '—';
  const getEventDate = (c: any) => c.eventDate || c.event_date || 'À venir';

  // 1. Vérifier le statut Premium au chargement
  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then(sub => {
         setIsPremium(sub.subscription_type === 'premium');
      });
    }
  }, [user]);

  // 2. Charger les concerts depuis Setlist.fm (via votre API locale)
  useEffect(() => {
    const fetchAllConcerts = async () => {
      const username = localStorage.getItem('setlistfm_username');
      
      // Si pas d'username setlist.fm, on arrête le chargement
      if (!username) { 
        setLoading(false); 
        return; 
      }

      setLoading(true);
      try {
        // A. CHARGEMENT "I WAS THERE" (Passés)
        try {
          const res = await fetch(`/api/search?action=user&username=${username}`);
          if (res.ok) {
            const data = await res.json();
            setConcerts(data.results || []);
          }
        } catch (e) { console.error("Erreur Past:", e); }

        // B. CHARGEMENT "I'M GOING" (Futurs)
        let upcoming: any[] = [];
        try {
          const resUpcoming = await fetch(`/api/upcoming-shows?username=${username}`);
          if (resUpcoming.ok) {
            const data = await resUpcoming.json();
            upcoming = data.results || [];
          }
        } catch (e) { console.error("Erreur Future:", e); }

        // C. MERGE SUPABASE (Si l'utilisateur a ajouté manuellement des concerts futurs)
        if (user) {
          const { data: sbData } = await supabase
            .from('upcoming_concerts')
            .select('*')
            .eq('user_id', user.id);
          if (sbData) upcoming = [...upcoming, ...sbData];
        }

        // D. DÉDOUBLONNAGE
        const uniqueUpcoming = Array.from(new Map(upcoming.map(item => [getArtistName(item), item])).values());
        setUpcomingConcerts(uniqueUpcoming);

      } catch (error) {
        toast.error('Erreur lors du chargement des concerts');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllConcerts();
  }, [user]);

  const toggleSelection = (setIds: Set<string>, setFunc: any, id: string) => {
    const newSet = new Set(setIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setFunc(newSet);
  };

  const handleGenerate = (isUpcoming: boolean) => {
    const selected = isUpcoming ? selectedUpcoming : selectedConcerts;
    const list = isUpcoming ? upcomingConcerts : concerts;
    
    if (selected.size === 0) return toast.error('Sélectionnez au moins un concert');
    
    const dataToSave = list
      .filter(c => selected.has(c.id))
      .map(c => ({
        id: c.id,
        artist: getArtistName(c),
        venue: getVenueName(c),
        eventDate: getEventDate(c)
      }));
      
    localStorage.setItem(isUpcoming ? 'selected_upcoming' : 'selected_concerts', JSON.stringify(dataToSave));
    navigate(isUpcoming ? '/generate?mode=upcoming' : '/generate');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      
      <div className="flex-grow max-w-[1200px] mx-auto w-full px-4 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-black italic uppercase text-white">Mes Concerts</h1>
            {!localStorage.getItem('setlistfm_username') && (
                <div className="text-sm text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/30">
                    ⚠️ Aucun compte Setlist.fm relié. <button onClick={() => navigate('/')} className="underline font-bold">Relier maintenant</button>
                </div>
            )}
        </div>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mb-6">
          <TabsList className="bg-[#2d2d2d] border-b border-[#404040] w-full justify-start p-0 h-auto rounded-none">
            <TabsTrigger value="past" className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#4d94ff] text-[#a0a0a0] data-[state=active]:text-white font-bold uppercase tracking-wider">
                I Was There <span className="ml-2 bg-[#333] px-2 rounded-full text-xs text-white">{concerts.length}</span>
            </TabsTrigger>
            <TabsTrigger value="future" className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#00ff00] text-[#a0a0a0] data-[state=active]:text-white font-bold uppercase tracking-wider">
                I'm Going <span className="ml-2 bg-[#333] px-2 rounded-full text-xs text-white">{upcomingConcerts.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* ONGLET PASSÉ */}
          <TabsContent value="past" className="mt-6">
            <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden shadow-2xl">
               {concerts.length === 0 ? <div className="p-12 text-center text-[#a0a0a0]">Aucun concert trouvé sur votre profil Setlist.fm</div> : (
                 <div className="divide-y divide-[#404040]">
                   {concerts.map((c, index) => (
                     <div key={c.id}>
                        {/* Ligne du concert */}
                        <div 
                            onClick={() => toggleSelection(selectedConcerts, setSelectedConcerts, c.id)} 
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selectedConcerts.has(c.id) ? 'bg-[#4d94ff]/10' : 'hover:bg-[#3d3d3d]'}`}
                        >
                            <input type="checkbox" checked={selectedConcerts.has(c.id)} readOnly className="w-5 h-5 rounded border-[#404040] accent-[#4d94ff]"/>
                            <div className="flex-1">
                                <p className="text-white font-bold text-lg">{getArtistName(c)}</p>
                                <div className="flex items-center gap-4 text-sm text-[#a0a0a0] mt-1">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {getVenueName(c)}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {getEventDate(c)}</span>
                                </div>
                            </div>
                        </div>

                        {/* PUB INTELLIGENTE (Tous les 5 items) */}
                        {(index + 1) % 5 === 0 && !isPremium && (
                            <div className="px-4 py-2 bg-[#1a1a1a]">
                                <SmartAd artistName={getArtistName(c)} index={index} />
                            </div>
                        )}
                     </div>
                   ))}
                 </div>
               )}
            </div>
            
            {/* Barre de génération flottante */}
            {selectedConcerts.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full z-40">
                    <div className="max-w-[1200px] mx-auto flex justify-between items-center text-white">
                        <span className="font-bold">{selectedConcerts.size} concert(s) sélectionné(s)</span>
                        <Button onClick={() => handleGenerate(false)} className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold shadow-lg shadow-blue-500/20">
                            Générer Playlist <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                    </div>
                </div>
            )}
          </TabsContent>

          {/* ONGLET FUTUR */}
          <TabsContent value="future" className="mt-6">
             <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden shadow-2xl">
               {upcomingConcerts.length === 0 ? <div className="p-12 text-center text-[#a0a0a0]">Aucun concert à venir.</div> : (
                 <div className="divide-y divide-[#404040]">
                   {upcomingConcerts.map((c, index) => (
                     <div key={c.id}>
                        {/* Ligne du concert */}
                        <div 
                            onClick={() => toggleSelection(selectedUpcoming, setSelectedUpcoming, c.id)} 
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selectedUpcoming.has(c.id) ? 'bg-[#00ff00]/10' : 'hover:bg-[#3d3d3d]'}`}
                        >
                            <input type="checkbox" checked={selectedUpcoming.has(c.id)} readOnly className="w-5 h-5 rounded border-[#404040] accent-[#00ff00]"/>
                            <div className="flex-1">
                                <p className="text-white font-bold text-lg">{getArtistName(c)}</p>
                                <div className="flex items-center gap-4 text-sm text-[#a0a0a0] mt-1">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {getVenueName(c)}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {getEventDate(c)}</span>
                                </div>
                            </div>
                        </div>

                        {/* PUB INTELLIGENTE (Tous les 5 items) */}
                        {(index + 1) % 5 === 0 && !isPremium && (
                            <div className="px-4 py-2 bg-[#1a1a1a]">
                                <SmartAd artistName={getArtistName(c)} index={index} />
                            </div>
                        )}
                     </div>
                   ))}
                 </div>
               )}
            </div>
            
            {selectedUpcoming.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full z-40">
                    <div className="max-w-[1200px] mx-auto flex justify-between items-center text-white">
                        <span className="font-bold">{selectedUpcoming.size} concert(s) sélectionné(s)</span>
                        <Button onClick={() => handleGenerate(true)} className="bg-[#00ff00] hover:bg-[#33ff33] text-black font-bold shadow-lg shadow-green-500/20">
                            Préparer Playlist <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                    </div>
                </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};
