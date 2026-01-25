import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Plus, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';

const EventPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { toggleConcert, isSelected } = useUserConcerts();

  const name = searchParams.get('name') || 'Festival';
  const type = searchParams.get('type') || 'venue';
  const year = searchParams.get('year') || '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const url = type === 'setlist' 
        ? `/api/search?action=setlist&setlistId=${eventId}`
        : `/api/search?action=artists&venueId=${eventId}&year=${year}`;
      const res = await fetch(url);
      setData(await res.json());
      setLoading(false);
    };
    load();
  }, [eventId, type, year]);

  return (
    <div className="min-h-screen bg-background pt-24 px-4 text-white">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="h-4 w-4 mr-2"/> Retour</Button>
        {loading ? <Loader2 className="animate-spin h-10 w-10 mx-auto mt-20 text-primary"/> : (
          <>
            <h1 className="text-4xl font-display mb-8">{data?.setlist?.artistName || name}</h1>
            {type === 'setlist' ? (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <ul className="space-y-2">
                  {data?.setlist?.songs.map((s: string, i: number) => (
                    <li key={i} className="flex gap-4 p-2 border-b border-zinc-800/50"><span className="text-zinc-600">{i+1}</span> {s}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="grid gap-3">
                {data?.artists?.map((a: any, i: number) => (
                  <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => navigate(`/event/${a.setlistId}?type=setlist`)}>
                      <p className="font-bold text-lg">{a.name}</p>
                    </div>
                    <Button variant={isSelected(a.name, a.setlistId) ? "fire" : "outline"} onClick={() => toggleConcert(a.name, a.setlistId, a.mbid, a.eventDate, name)}>
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
