import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Music, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // On récupère les résultats envoyés par la barre de recherche
  const { results, query } = location.state || { results: [], query: '' };

  return (
    <div className="min-h-screen bg-background pt-24 px-4 text-white">
      <Header />
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-6 hover:bg-zinc-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4"/> Retour à l'accueil
        </Button>

        <h1 className="text-3xl font-display mb-2">Résultats pour "{query}"</h1>
        <p className="text-zinc-500 mb-8">{results.length} résultat(s) trouvé(s)</p>

        <div className="grid gap-4 md:grid-cols-2">
          {results.map((item: any, index: number) => (
            <div 
              key={index} 
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl hover:border-primary transition-all cursor-pointer group"
              onClick={() => {
                const params = item.type === 'festival' 
                  ? `?type=venue&city=${encodeURIComponent(item.city)}&year=${item.year}&name=${encodeURIComponent(item.name)}`
                  : `?type=artist&name=${encodeURIComponent(item.name)}`;
                navigate(`/event/${item.id}${params}`);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {item.type === 'festival' ? (
                      <span className="bg-fire/20 text-fire text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Festival</span>
                    ) : (
                      <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Artiste</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{item.name}</h3>
                  
                  {item.type === 'festival' && (
                    <div className="flex flex-col gap-1 mt-3 text-sm text-zinc-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> {item.city}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Édition {item.year}
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-primary transition-colors">
                   <ArrowLeft className="h-5 w-5 rotate-180" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
            <Music className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500">Désolé, nous n'avons rien trouvé d'autre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
