import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Plus, Check, Music, AlertCircle } from 'lucide-react';
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
  const name = searchParams.get('name') || 'Événement';
  const year = searchParams.get('year');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url = type === 'setlist' 
          ? `/api/search?action=getSetlist&setlistId=${eventId}`
          : `/api/search?action=getFestivalArtists&venueId=${eventId}&year=${year}`;
        const res = await fetch(url);
        const result = await res.json();
        setData(result);
      } catch (e) { 
        console.error(e);
        toast.error("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, type, year]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pt-24 px-4 pb-32">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-zinc-400 hover:text-white hover:bg-zinc-900">
          <ArrowLeft className="mr-2 h-4 w-4"/> Retour
        </Button>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin h-12 w-12 text-primary mb-4"/>
            <p className="text-zinc-500 animate-pulse">Chargement des données...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                  {data?.setlist?.artistName || name}
                </h1>
                <div className="flex items-center gap-3 text-zinc-500 mt-3">
                  <Calendar className="h-4 w-4" />
                  <span className="text-lg">{year || data?.setlist?.eventDate}</span>
                </div>
              </div>
              
              {concerts.length > 0 && (
                <Button 
                  variant="fire" 
                  onClick={() => navigate('/generate')} 
                  className="shadow-lg shadow-primary/20 h-12 px-6"
                >
                  <Music className="mr-2 h-5 w-5"/> Ma Capsule ({concerts.length})
                </Button>
              )}
            </div>

            {type === 'setlist' ? (
              <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 p-6 md:p-8 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                  <Music className="h-5 w-5" /> Setlist
                </h2>
                
                {data?.setlist?.songs?.length > 0 ? (
                  <div className="grid gap-2">
                    {data.setlist.songs.map((s: string, i: number) => (
                      <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-zinc-800/50 border-b border-zinc-800/30 transition-colors">
                        <span className="text-zinc-600 font-mono w-6 text-right">{i+1}</span>
                        <span className="font-medium">{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                    <AlertCircle className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
                    <p className="text-zinc-400 max-w-xs mx-auto italic">
                      Les morceaux de ce concert ne sont pas encore répertoriés dans la base de données.
                    </p>
                  </div>
                )}
                
                {data?.setlist?.songs?.length > 0 && (
                  <Button variant="fire" className="w-full mt-10 h-14 text-lg font-bold" onClick={() => navigate('/generate')}>
                    Ajouter à ma playlist
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {data?.artists?.length > 0 ? (
                  data.artists.map((a: any, i: number) => (
                    <div key={i} className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center hover:bg-zinc-900/80 transition-all group">
                      <div className="cursor-pointer flex-1" onClick={() => navigate(`/event/${a.setlistId}?type=setlist`)}>
                        <p className="font-bold text-lg group-hover:text-primary transition-colors">{a.name}</p>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Voir Setlist</p>
                      </div>
                      <Button 
                        variant={isSelected(a.name, a.setlistId) ? "fire" : "outline"}
                        size="icon"
                        className="rounded-full h-10 w-10"
                        onClick={() => toggleConcert(a.name, a.setlistId, a.mbid, a.eventDate, name)}
                      >
                        {isSelected(a.name, a.setlistId) ? <Check className="h-5 w-5"/> : <Plus className="h-5 w-5"/>}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <p className="text-zinc-500 italic">Aucun artiste trouvé.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
