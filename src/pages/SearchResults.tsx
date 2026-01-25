import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, query } = location.state || { results: [], query: '' };

  return (
    <div className="min-h-screen bg-background pt-24 px-4 text-white">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
        <h1 className="text-3xl font-display mb-8">Résultats pour "{query}"</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {results.map((item: any, index: number) => (
            <div 
              key={index} 
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl hover:border-primary cursor-pointer"
              onClick={() => navigate(`/event/${item.id}?type=venue&year=${item.year}&name=${encodeURIComponent(item.name)}`)}
            >
              <h3 className="text-xl font-bold mb-2">{item.name}</h3>
              <div className="text-sm text-zinc-400 flex flex-col gap-1">
                <span className="flex items-center gap-2"><MapPin className="h-3 w-3"/> {item.city}</span>
                <span className="flex items-center gap-2"><Calendar className="h-3 w-3"/> Édition {item.year}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, query } = location.state || { results: [], query: '' };

  return (
    <div className="min-h-screen bg-background pt-24 px-4 text-white">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4"/> Retour</Button>
        <h1 className="text-3xl font-display mb-8">Résultats pour "{query}"</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {results.map((item: any, index: number) => (
            <div 
              key={index} 
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl hover:border-primary cursor-pointer"
              onClick={() => navigate(`/event/${item.id}?type=venue&year=${item.year}&name=${encodeURIComponent(item.name)}`)}
            >
              <h3 className="text-xl font-bold mb-2">{item.name}</h3>
              <div className="text-sm text-zinc-400 flex flex-col gap-1">
                <span className="flex items-center gap-2"><MapPin className="h-3 w-3"/> {item.city}</span>
                <span className="flex items-center gap-2"><Calendar className="h-3 w-3"/> Édition {item.year}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
