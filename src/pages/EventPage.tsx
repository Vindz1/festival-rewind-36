import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Music, Calendar, ArrowLeft, Loader2, Plus, Check } from 'lucide-react';
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
  const year = searchParams.get('year') || '';
  const city = searchParams.get('city') || '';
  const type = searchParams.get('type') || 'venue';

  // RÉCUPÉRATION DIRECTE SANS SUPABASE
  const fetchFromApi = async (queryPath: string) => {
    const apiKey = import.meta.env.VITE_SETLIST_FM_API_KEY || 'ovRH4H1pKy1yumS7vWuHrg7q4dwF30FsICjj';
    const res = await fetch(`https://api.setlist.fm/rest/1.0/${queryPath}`, {
      headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
    });
    return res.json();
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (type === 'setlist') {
          const res = await fetchFromApi(`setlist/${eventId}`);
          const songs = res.sets?.set?.flatMap((s: any) => s.song?.map((so: any) => so.name)) || [];
          setData({ artistName: res.artist.name, eventDate: res.eventDate, songs, id: res.id });
        } else {
          // On cherche par ville et année pour avoir TOUT le festival
          const res = await fetchFromApi(`search/setlists?cityName=${encodeURIComponent(city)}&year=${year}`);
          const uniqueArtists = new Map();
          res.setlist?.forEach((s: any) => {
            if (!uniqueArtists.has(s.artist.name)) {
              uniqueArtists.set(s.artist.name, {
                name: s.artist.name,
                mbid: s.artist.mbid,
                setlistId: s.id,
                eventDate: s.eventDate
              });
            }
          });
          setData({ artists: Array.from(uniqueArtists.values()) });
        }
      } catch (e) {
        toast.error("Erreur de connexion à l'API");
      }
      setLoading(false);
    };
    loadData();
  }, [eventId, type, city, year]);

  return (
    <div className="min-h-screen bg-background pt-24 px-4 text-foreground">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-white"><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
        
        {loading ? <div className="text-center py-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary"/></div> : (
          <>
            <h1 className="text-4xl font-display text-white mb-2">{data?.artistName || name}</h1>
            <p className="text-muted-foreground mb-8 flex items-center gap-2"><Calendar className="h-4 w-4"/> {data?.eventDate || year}</p>

            {type === 'setlist' ? (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-display text-primary mb-4">Setlist</h3>
                <ul className="space-y-2 mb-8">
                  {data?.songs.map((s: string, i: number) => (
                    <li key={i} className="text-zinc-300 flex gap-4"><span className="text-zinc-600">{i+1}</span> {s}</li>
                  ))}
                </ul>
                <Button variant="fire" className="w-full" onClick={() => navigate('/generate')}>Générer Playlist Spotify</Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {data?.artists?.map((a: any, i: number) => (
                  <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => navigate(`/event/${a.setlistId}?type=setlist`)}>
                      <p className="font-bold text-white text-lg">{a.name}</p>
                      <p className="text-xs text-zinc-500">Cliquez pour voir les morceaux</p>
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
