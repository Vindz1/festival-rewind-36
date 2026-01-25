import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Music, Calendar, ArrowLeft, Loader2, Plus, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useUserConcerts } from '@/hooks/useUserConcerts';

const EventPage = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { toggleConcert, isSelected } = useUserConcerts();

  const name = searchParams.get('name') || 'Événement';
  const type = searchParams.get('type') || 'venue';
  const city = searchParams.get('city') || '';
  const year = searchParams.get('year') || '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const action = type === 'setlist' ? 'getSetlist' : 'getVenueArtists';
      const body = type === 'setlist' ? { action, setlistId: eventId } : { action, cityName: city, year };
      
      const { data: res } = await supabase.functions.invoke('setlist-fm', { body });
      if (res?.success) setData(res);
      setLoading(false);
    };
    load();
  }, [eventId, type, city, year]);

  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
        
        {loading ? <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/> : (
          <>
            <h1 className="text-4xl font-display mb-2">{data?.setlist?.artistName || name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mb-8"><Calendar className="h-4 w-4"/> {data?.setlist?.eventDate || year}</p>

            {type === 'setlist' ? (
              <div className="bg-card p-6 rounded-xl border">
                <h3 className="text-xl font-display mb-4">Chansons jouées</h3>
                <ul className="space-y-2 mb-8">
                  {data?.setlist?.songs.map((s: string, i: number) => (
                    <li key={i} className="flex gap-4 p-2 hover:bg-muted rounded-lg"><span className="text-primary font-bold">{i+1}</span> {s}</li>
                  ))}
                </ul>
                <Button variant="fire" className="w-full h-12 text-lg" onClick={() => navigate('/generate')}>Générer ma playlist Spotify</Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {data?.artists?.map((a: any, i: number) => (
                  <div key={i} className="bg-card p-4 rounded-xl border flex justify-between items-center hover:border-primary transition-colors">
                    <div onClick={() => navigate(`/event/${a.setlistId}?type=setlist`)} className="cursor-pointer flex-1">
                      <p className="font-bold text-lg">{a.name}</p>
                      <p className="text-sm text-muted-foreground">Voir la setlist</p>
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
