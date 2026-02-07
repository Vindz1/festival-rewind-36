import { useEffect, useState } from 'react';
import { Music, Calendar, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from "@/AuthContext";
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  // Helpers d'affichage sécurisés
  const getArtistName = (c: any) => c.artist?.name || c.artist || 'Artiste inconnu';
  const getVenueName = (c: any) => c.venue?.name || c.venue_name || '—';
  const getEventDate = (c: any) => c.eventDate || c.event_date || 'À venir';

  useEffect(() => {
    const fetchAllConcerts = async () => {
      const username = localStorage.getItem('setlistfm_username');
      if (!username) { setLoading(false); return; }

      setLoading(true);
      try {
        // CHARGEMENT "I WAS THERE" (API OFFICIELLE)
        try {
          const res = await fetch(`/api/search?action=user&username=${username}`);
          if (res.ok) {
            const data = await res.json();
            setConcerts(data.results || []);
          }
        } catch (e) { console.error(e); }

        // CHARGEMENT "I'M GOING" (SCRAPER)
        let upcoming: any[] = [];
        try {
          const resUpcoming = await fetch(`/api/upcoming-shows?username=${username}`);
          if (resUpcoming.ok) {
            const data = await resUpcoming.json();
            upcoming = data.results || [];
          }
        } catch (e) { console.error(e); }

        // MERGE SUPABASE
        if (user) {
          const { data: sbData } = await supabase
            .from('upcoming_concerts')
            .select('*')
            .eq('user_id', user.id);
          if (sbData) upcoming = [...upcoming, ...sbData];
        }

        // DÉDOUBLONNAGE FINAL
        // On retire les doublons exacts (même nom d'artiste) pour éviter l'effet "Metallica, Metallica"
        const uniqueUpcoming = Array.from(new Map(upcoming.map(item => [getArtistName(item), item])).values());

        setUpcomingConcerts(uniqueUpcoming);

      } catch (error) {
        toast.error('Erreur chargement');
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
    
    if (selected.size === 0) return toast.error('Sélectionnez un concert');
    
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

  if (loading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center"><Music className="animate-pulse text-white w-12 h-12"/></div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-white mb-6">MES CONCERTS</h1>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mb-6">
          <TabsList className="bg-[#2d2d2d] border-b border-[#404040] w-full justify-start p-0 h-auto rounded-none">
            <TabsTrigger value="past" className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#4d94ff] text-[#a0a0a0] data-[state=active]:text-white">I Was There</TabsTrigger>
            <TabsTrigger value="future" className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#4d94ff] text-[#a0a0a0] data-[state=active]:text-white">I'm Going</TabsTrigger>
          </TabsList>

          <TabsContent value="past">
            <div className="bg-[#2d2d2d] border border-[#404040] rounded overflow-hidden">
               {concerts.length === 0 ? <div className="p-8 text-center text-[#a0a0a0]">Aucun concert</div> : (
                 <table className="w-full">
                   <thead className="bg-[#252525] text-[#a0a0a0] text-xs uppercase">
                     <tr><th className="p-4 w-12"></th><th className="p-4 text-left">Artiste</th><th className="p-4 text-left">Lieu</th><th className="p-4 text-left">Date</th></tr>
                   </thead>
                   <tbody className="divide-y divide-[#404040]">
                     {concerts.map(c => (
                       <tr key={c.id} onClick={() => toggleSelection(selectedConcerts, setSelectedConcerts, c.id)} className="hover:bg-[#3d3d3d] cursor-pointer">
                         <td className="p-4"><input type="checkbox" checked={selectedConcerts.has(c.id)} readOnly className="rounded border-[#404040]"/></td>
                         <td className="p-4 text-white font-medium">{getArtistName(c)}</td>
                         <td className="p-4 text-[#a0a0a0] text-sm">{getVenueName(c)}</td>
                         <td className="p-4 text-[#a0a0a0] text-sm">{getEventDate(c)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
            </div>
            {selectedConcerts.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4">
                    <div className="max-w-[1200px] mx-auto flex justify-between items-center text-white">
                        <span>{selectedConcerts.size} sélectionné(s)</span>
                        <Button onClick={() => handleGenerate(false)} className="bg-[#4d94ff]">Générer Playlist <ArrowRight className="ml-2 w-4 h-4"/></Button>
                    </div>
                </div>
            )}
          </TabsContent>

          <TabsContent value="future">
             <div className="bg-[#2d2d2d] border border-[#404040] rounded overflow-hidden">
               {upcomingConcerts.length === 0 ? <div className="p-8 text-center text-[#a0a0a0]">Aucun concert à venir trouvé</div> : (
                 <table className="w-full">
                   <thead className="bg-[#252525] text-[#a0a0a0] text-xs uppercase">
                     <tr><th className="p-4 w-12"></th><th className="p-4 text-left">Artiste</th><th className="p-4 text-left">Lieu</th><th className="p-4 text-left">Date</th></tr>
                   </thead>
                   <tbody className="divide-y divide-[#404040]">
                     {upcomingConcerts.map(c => (
                       <tr key={c.id} onClick={() => toggleSelection(selectedUpcoming, setSelectedUpcoming, c.id)} className="hover:bg-[#3d3d3d] cursor-pointer">
                         <td className="p-4"><input type="checkbox" checked={selectedUpcoming.has(c.id)} readOnly className="rounded border-[#404040]"/></td>
                         <td className="p-4 text-white font-medium">{getArtistName(c)}</td>
                         <td className="p-4 text-[#a0a0a0] text-sm">{getVenueName(c)}</td>
                         <td className="p-4 text-[#a0a0a0] text-sm">{getEventDate(c)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
            </div>
            {selectedUpcoming.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4">
                    <div className="max-w-[1200px] mx-auto flex justify-between items-center text-white">
                        <span>{selectedUpcoming.size} sélectionné(s)</span>
                        <Button onClick={() => handleGenerate(true)} className="bg-[#4d94ff]">Générer Playlist <ArrowRight className="ml-2 w-4 h-4"/></Button>
                    </div>
                </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyConcerts;
