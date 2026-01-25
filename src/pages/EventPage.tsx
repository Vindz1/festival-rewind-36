import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Music, Check, Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';

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
      let url = `/api/search?action=artists&venueId=${eventId}&year=${year}`;
      if (type === 'artist') url = `/api/search?action=artistConcerts&mbid=${eventId}`;
      if (type === 'setlist') url = `/api/search?action=setlist&setlistId=${eventId}`;
      
      const res = await fetch(url);
      setData(await res.json());
      setLoading(false);
    };
    load();
  }, [eventId, type, year]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
        
        {loading ? <Loader2 className="animate-spin h-10 w-10 mx-auto mt-20 text-primary"/> : (
          <>
            <h1 className="text-4xl font-display mb-2">{data?.setlist?.artistName || name}</h1>
            
            {type === 'setlist' ? (
              <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-primary font-bold mb-4">Setlist du concert</h3>
                <ul className="space-y-2 mb-8">
                  {data?.setlist?.songs.map((s: string, i: number) => (
                    <li key={i} className="flex gap-4"><span className="text-zinc-600">{i+1}</span> {s}</li>
                  ))}
                </ul>
                <Button variant="fire" className="w-full h-14 text-lg font-bold" onClick={() => navigate('/generate')}>
                  <Music className="mr-2 h-5 w-5"/> Générer Playlist Spotify
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {(data?.artists || data?.concerts)?.map((item: any, i: number) => (
                  <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => navigate(`/event/${item.setlistId || item.id}?type=setlist`)}>
                      <p className="font-bold">{item.name || item.venue}</p>
                      <p className="text-xs text-zinc-500">{item.eventDate} - {item.city}</p>
                    </div>
                    <Button variant={isSelected(item.name || name, item.setlistId) ? "fire" : "outline"} onClick={() => toggleConcert(item.name || name, item.setlistId, item.mbid, item.eventDate, name)}>
                      {isSelected(item.name || name, item.setlistId) ? <Check/> : <Plus/>}
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
