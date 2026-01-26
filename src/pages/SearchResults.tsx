import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Check, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  // On récupère les résultats ou on met un tableau vide par défaut pour éviter le crash
  const { results, username } = location.state || { results: null, username: '' };
  const { toggleConcert, isSelected, concerts } = useUserConcerts();

  if (!results) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-zinc-500 mb-4" />
        <p className="text-xl mb-6 text-center">Oups, aucune donnée n'a été transmise.</p>
        <Button onClick={() => navigate('/')} variant="outline">Retourner à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 px-4 text-white pb-32">
      <Header />
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Concerts de <span className="text-primary">{username}</span></h1>
            <p className="text-zinc-500 italic mt-1">{results.length} souvenirs retrouvés</p>
          </div>
          {concerts.length > 0 && (
            <Button variant="fire" onClick={() => navigate('/generate')} className="h-12 px-6 shadow-lg shadow-primary/20">
              Générer ma playlist ({concerts.length})
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {results.length > 0 ? results.map((c: any) => (
            <div key={c.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl flex justify-between items-center hover:bg-zinc-900 transition-all group">
              <div className="flex-1">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{c.artist}</h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500 mt-2">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {c.venue}, {c.city}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/> {c.date}</span>
                </div>
              </div>
              <Button 
                variant={isSelected(c.artist, c.id) ? "fire" : "outline"}
                size="icon"
                onClick={() => toggleConcert(c.artist, c.id, "", c.date, c.venue)}
                className="rounded-full h-12 w-12 shrink-0 ml-4"
              >
                {isSelected(c.artist, c.id) ? <Check className="h-6 w-6"/> : <Plus className="h-6 w-6"/>}
              </Button>
            </div>
          )) : (
            <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
              <p className="text-zinc-500 italic">Aucun concert trouvé pour cet utilisateur.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
