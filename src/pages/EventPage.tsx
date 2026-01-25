import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Plus, Check, Music } from 'lucide-react';
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
  const { toggleConcert, isSelected, concerts } = useUserConcerts();

  const type = searchParams.get('type');
  const name = searchParams.get('name');
  const year = searchParams.get('year');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url = type === 'setlist' 
          ? `/api/search?action=getSetlist&setlistId=${eventId}`
          : `/api/search?action=getFestivalArtists&venueId=${eventId}&year=${year}`;
        const res = await fetch(url);
        setData(await res.json());
      } catch (e) { toast.error("Erreur de chargement"); }
      setLoading(false);
    };
    load();
  }, [eventId, type, year]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 pb-32">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
        
        {loading ? <Loader2 className="animate-spin h-10 w-10 mx-auto mt-20 text-primary"/> : (
          <>
            <div className="flex justify-between items-start mb-8 gap-4">
              <div>
                <h1 className="text-4xl font-display">{data?.setlist?.artistName || name}</h1>
                <p className="text-zinc-500 mt-2">{year || data?.setlist?.eventDate}</p>
              </div>
              {concerts.length > 0 && (
                <Button variant="fire" onClick={() => navigate('/generate')} className="shrink-0">
                  <Music className="mr-2 h-4 w-4"/> Ma Playlist ({concerts.length})
                </Button>
              )}
            </div>

            {type === 'setlist' ? (
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <ul className="space-y-2">
                  {data?.setlist?.songs?.length > 0 ? data.setlist.songs.map((s: string, i: number) => (
                    <li key={i} className="flex gap-4 p-2 border-b border-zinc-800/50">
                      <span className="text-zinc-600 w-6">{i+1}</span> {s}
                    </li>
                  )) : (
                    <div className="text-center py-10">
                      <p className="text-zinc-500 italic">Hélas, personne n'a complété la liste des morceaux pour ce concert à l'époque.</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Chercher une autre date</Button>
                    </div>
                  )}
                </ul>
                {data?.setlist?.songs?.length > 0 && (
                  <Button variant="fire" className="w-full mt-8 h-14" onClick={() => navigate('/generate')}>Générer sur Spotify</Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {data?.artists?.map((a: any, i: number) => (
                  <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div className="cursor-pointer flex-1" onClick={() => navigate(`/event/${a.setlistId}?type=setlist`)}>
                      <p className="font-bold">{a.name}</p>
                      <p className="text-xs text-zinc-500">Voir la setlist</p>
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
}
