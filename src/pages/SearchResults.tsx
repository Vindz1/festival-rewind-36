import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Check, Plus, Music } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, username } = location.state || { results: [], username: 'Utilisateur' };
  const { toggleConcert, isSelected, concerts } = useUserConcerts();

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 px-4 text-white pb-32">
      <Header />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-zinc-400">
            <ArrowLeft className="mr-2 h-4 w-4"/> Retour
          </Button>
          <Button 
            variant={concerts.length > 0 ? "fire" : "outline"} 
            onClick={() => navigate('/generate')}
            disabled={concerts.length === 0}
          >
            <Music className="mr-2 h-4 w-4"/> 
            {concerts.length > 0 ? `Créer ma playlist (${concerts.length})` : "Sélectionne tes concerts"}
          </Button>
        </div>

        <h1 className="text-3xl font-display font-bold mb-8">
          Concerts de <span className="text-primary">{username}</span>
        </h1>

        <div className="grid gap-4">
          {results.length > 0 ? results.map((c: any) => (
            <div key={c.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl flex justify-between items-center">
              <div className="flex-1">
                <h3 className="text-xl font-bold">{c.artist}</h3>
                <p className="text-zinc-500 text-sm mt-1">{c.date} — {c.venue}, {c.city}</p>
              </div>
              <Button 
                variant={isSelected(c.artist, c.id) ? "fire" : "outline"}
                size="icon"
                onClick={() => toggleConcert(c.artist, c.id, "", c.date, c.venue)}
                className="rounded-full h-12 w-12"
              >
                {isSelected(c.artist, c.id) ? <Check/> : <Plus/>}
              </Button>
            </div>
          )) : (
            <p className="text-center py-20 text-zinc-500 italic">Aucun concert trouvé. Vérifie que tu as bien marqué des concerts comme "I was there" sur Setlist.fm.</p>
          )}
        </div>
      </div>
    </div>
  );
}
