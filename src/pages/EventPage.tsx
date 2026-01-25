import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Plus, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { toast } from 'sonner';

export default function EventPage() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { toggleConcert, isSelected } = useUserConcerts();

  const type = searchParams.get('type');
  const name = searchParams.get('name');
  const year = searchParams.get('year');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let url = '';
        if (type === 'setlist') {
          // Action corrigée : getSetlist
          url = `/api/search?action=getSetlist&setlistId=${eventId}`;
        } else {
          // Action corrigée : getFestivalArtists
          url = `/api/search?action=getFestivalArtists&venueId=${eventId}&year=${year}`;
        }
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erreur serveur");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
        toast.error("Impossible de charger les données");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, type, year]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-zinc-800">
          <ArrowLeft className="mr-2 h-4 w-4"/> Retour
        </Button>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin h-12 w-12 text-primary mb-4"/>
            <p className="text-zinc-500 italic">Récupération des archives...</p>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-display mb-8">{data?.setlist?.artistName || name}</h1>
            
            {type === 'setlist' ? (
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-primary font-bold mb-6 flex items-center gap-2">
                  <Calendar className="h-4 w-4"/> {data?.setlist?.eventDate}
                </h3>
                <ul className="space-y-3">
                  {data?.setlist?.songs?.length > 0 ? (
                    data.setlist.songs.map((s: string, i: number) => (
                      <li key={i} className="flex gap-4 p-2 border-b border-zinc-800/50">
                        <span className="text-zinc-600 font-mono">{i+1}</span> {s}
                      </li>
                    ))
                  ) : (
                    <p className="text-zinc-500 italic py-10 text-center">Aucune setlist répertoriée pour ce concert.</p>
                  )}
                </ul>
              </div>
            ) : (
              <div className="grid gap-3">
                {data?.artists?.length > 0 ? (
                  data.artists.map((a: any, i: number) => (
                    <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-zinc-700 transition-colors">
                      <div className="cursor-pointer flex-1" onClick={() => navigate(`/event/${a.setlistId}?type=setlist`)}>
                        <p className="font-bold text-lg">{a.name}</p>
                        <p className="text-xs text-zinc-500">Voir la setlist complète</p>
                      </div>
                      <Button 
                        variant={isSelected(a.name, a.setlistId) ? "fire" : "outline"} 
                        onClick={() => toggleConcert(a.name, a.setlistId, a.mbid, a.eventDate, name)}
                      >
                        {isSelected(a.name, a.setlistId) ? <Check className="h-5 w-5"/> : <Plus className="h-5 w-5"/>}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-20 text-zinc-500">Aucun artiste trouvé pour cette édition.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
