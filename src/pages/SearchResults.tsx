import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Plus, Music, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';

export default function SearchResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { concerts, toggleConcert, isSelected } = useUserConcerts();
  const list = state?.list || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 px-4 pb-32">
      <Header />
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
          <Button variant="fire" disabled={concerts.length === 0} onClick={() => navigate('/generate')}>
            <Music className="mr-2 h-4 w-4"/> Créer ma playlist ({concerts.length})
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8 italic text-primary">Tes concerts ({state?.username})</h1>

        <div className="space-y-3">
          {list.map((c: any) => (
            <div key={c.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">{c.artist}</p>
                <p className="text-sm text-zinc-500">{c.date} — {c.venue}, {c.city}</p>
              </div>
              <Button 
                variant={isSelected(c.id) ? "fire" : "outline"} 
                size="icon" 
                className="rounded-full"
                onClick={() => toggleConcert(c)}
              >
                {isSelected(c.id) ? <Check/> : <Plus/>}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
