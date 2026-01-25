import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Plus, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { toast } from 'sonner';

const EventPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { toggleConcert, isSelected } = useUserConcerts();

  const name = searchParams.get('name') || 'Festival';
  const type = searchParams.get('type') || 'venue';
  const city = searchParams.get('city') || '';
  const year = searchParams.get('year') || '';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let url = '';
        if (type === 'setlist') {
          url = `/api/search?action=setlist&setlistId=${eventId}`;
        } else {
          url = `/api/search?action=artists&city=${encodeURIComponent(city)}&year=${year}`;
        }
        
        const res = await fetch(url);
        const json = await res.json();
        setData(json);
      } catch (e) {
        toast.error("Erreur de chargement");
      }
      setLoading(false);
    };
    loadData();
  }, [eventId, type, city, year]);

  return (
    <div className="min-h-screen bg-background pt-24 px-4 text-white">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-zinc-800"><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
        
        {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary"/></div> : (
          <>
            <h1 className="text-4xl font-display mb-2">{data?.setlist?.artistName || name}</h1>
            <p className="text-zinc-500 mb-8 flex items-center gap-2"><Calendar className="h-4 w-4"/> {data?.setlist?.eventDate || year}</p>

            {type === 'setlist' ? (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-display text-primary mb-6">Liste des titres</h3>
                <ul className="space-y-3 mb-10">
                  {data?.setlist?.songs.length > 0 ? data.setlist.songs.map((s: string, i: number) => (
                    <li key={i} className="flex gap-4 p-2 border-b border-zinc-800/50"><span className="text-zinc-600 font-mono">{i+1}</span> {s}</li>
                  )) : <p>Aucun morceau trouvé.</p>}
                </ul>
                <Button variant="fire" className="w-full h-14 text-lg font-bold" onClick={() => navigate('/generate')}>Générer ma playlist Spotify</Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {data?.artists?.map((a: any, i: number) => (
                  <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-zinc-600">
                    <div className="cursor-pointer flex-1" onClick={() => navigate(`/event/${a.setlistId}?type=setlist`)}>
                      <p className="font-bold text-lg">{a.name}</p>
                      <p className="text-xs text-zinc-500">Voir la setlist complète</p>
                    </div>
                    <Button 
                      variant={isSelected(a.name, a.setlistId) ? "fire" : "outline"}
                      onClick={() => toggleConcert(a.name, a.setlistId, a.mbid, a.eventDate, name)}
                    >
                      {isSelected(a.name, a.setlistId) ? <Check/> : <Plus/>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventPage;
