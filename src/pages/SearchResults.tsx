import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Plus, Music, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';

const SearchResults = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toggleConcert, isSelected, concerts } = useUserConcerts();
  const results = state?.results || [];

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <Header />
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
          <Button variant="fire" disabled={concerts.length === 0} onClick={() => navigate('/generate')}>
            Générer ma playlist ({concerts.length})
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-6 italic text-primary">Tes Concerts</h1>
        <div className="space-y-3">
          {results.map((c: any) => (
            <div key={c.id} className="bg-zinc-900 p-5 rounded-2xl flex justify-between items-center border border-zinc-800">
              <div>
                <p className="font-bold">{c.artist?.name || c.artist}</p>
                <p className="text-sm text-zinc-500">{c.eventDate || c.date}</p>
              </div>
              <Button variant={isSelected(c.id) ? "fire" : "outline"} size="icon" onClick={() => toggleConcert(c)}>
                {isSelected(c.id) ? <Check/> : <Plus/>}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
