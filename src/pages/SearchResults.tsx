import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Check, Plus, Music } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, username } = location.state || { results: [], username: '' };
  const { toggleConcert, isSelected, concerts } = useUserConcerts();

  return (
    <div className="min-h-screen bg-black pt-24 px-4 text-white pb-32">
      <Header />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display">Concerts de {username}</h1>
            <p className="text-zinc-500 italic">{results.length} événements trouvés</p>
          </div>
          {concerts.length > 0 && (
            <Button variant="fire" onClick={() => navigate('/generate')} className="animate-pulse">
              Générer ma playlist ({concerts.length})
            </Button>
          )}
        </div>

        <div className="grid gap-3">
          {results.map((c: any) => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center hover:bg-zinc-800/50 transition-all">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-primary">{c.artist}</h3>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {c.venue}, {c.city}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {c.date}</span>
                </div>
              </div>
              <Button 
                variant={isSelected(c.artist, c.id) ? "fire" : "outline"}
                onClick={() => toggleConcert(c.artist, c.id, "", c.date, c.venue)}
                className="rounded-full"
              >
                {isSelected(c.artist, c.id) ? <Check className="h-5 w-5"/> : <Plus className="h-5 w-5"/>}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
