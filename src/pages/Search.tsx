import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, Music, Calendar, MapPin, ArrowRight, AlertCircle } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      setError('');
      setResults([]);

      try {
        // NOTE: Idéalement, passez par votre backend (api/setlist) pour cacher la clé API
        // Ici j'utilise une structure fetch compatible avec votre proxy existant si configuré
        // Sinon, remplacez par votre logique d'appel API Setlist.fm habituelle
        
        const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(query)}&p=1`, {
            headers: {
                'x-api-key': import.meta.env.VITE_SETLIST_FM_API_KEY || '', // Votre clé API
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error("Erreur lors de la recherche");
        
        const data = await response.json();
        setResults(data.setlist || []);
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer les résultats. Vérifiez votre connexion ou la clé API.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  // Formatage de la date (DD-MM-YYYY)
  const formatDate = (dateStr: string) => {
    const [d, m, y] = dateStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSelect = (concert: any) => {
    // On formate comme attendu par Generate.tsx
    // Pour les concerts passés, on envoie les 'sets'
    // Pour les concerts futurs (si setlist.fm les renvoie), on gère aussi
    
    // Astuce : On passe par le localStorage pour simuler un "panier" unique temporaire
    const formattedConcert = {
        id: concert.id,
        artist: concert.artist,
        venue: concert.venue,
        eventDate: concert.eventDate,
        sets: concert.sets
    };

    // On utilise le mode "Direct" via location.state pour Generate
    // Mais comme Generate attend un format spécifique, on va ruser :
    // On stocke dans le localStorage "selected_concerts" (comme MyConcerts)
    // Et on redirige.
    
    localStorage.setItem('selected_concerts', JSON.stringify([formattedConcert]));
    // On nettoie le futur pour être sûr
    localStorage.removeItem('selected_upcoming');
    
    navigate('/generate');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
      <Header />
      
      <div className="flex-grow max-w-5xl mx-auto w-full px-4 pt-32 pb-20">
        <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase mb-2">Résultats</h1>
            <p className="text-[#a0a0a0] text-xl">Pour la recherche : <span className="text-white font-bold">"{query}"</span></p>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[#4d94ff] animate-spin mb-4"/>
                <p className="text-[#666] uppercase tracking-widest font-bold text-sm">Interrogation de Setlist.fm...</p>
            </div>
        ) : error ? (
            <div className="bg-[#1a1a1a] border border-red-500/30 p-8 rounded-2xl text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4"/>
                <p className="text-white mb-4">{error}</p>
                <Button onClick={() => navigate('/')} variant="outline">Retour</Button>
            </div>
        ) : results.length === 0 ? (
            <div className="text-center py-20 bg-[#1a1a1a] rounded-3xl border border-[#333]">
                <Music className="w-16 h-16 text-[#333] mx-auto mb-4"/>
                <h3 className="text-xl font-bold mb-2">Aucun résultat trouvé</h3>
                <p className="text-[#666]">Essayez avec un autre nom d'artiste.</p>
            </div>
        ) : (
            <div className="grid gap-4">
                {results.map((concert) => (
                    <div key={concert.id} className="group bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#4d94ff] p-6 rounded-xl transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
                        
                        {/* DATE */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-[#111] border border-[#333] w-20 h-20 rounded-lg group-hover:border-[#4d94ff]/50 transition-colors">
                            <span className="text-xl font-black text-white">{concert.eventDate.split('-')[0]}</span>
                            <span className="text-xs font-bold uppercase text-[#666]">{new Date(concert.eventDate.split('-').reverse().join('-')).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-[10px] text-[#444]">{concert.eventDate.split('-')[2]}</span>
                        </div>

                        {/* INFOS */}
                        <div className="flex-grow min-w-0">
                            <h3 className="text-2xl font-black italic uppercase text-white truncate mb-1">
                                {concert.artist.name}
                            </h3>
                            <div className="flex flex-col gap-1 text-sm text-[#a0a0a0]">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#4d94ff]"/>
                                    <span className="truncate">{concert.venue.name}, {concert.venue.city.name} ({concert.venue.city.country.code})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#666]"/>
                                    <span>{formatDate(concert.eventDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* ACTION */}
                        <Button 
                            onClick={() => handleSelect(concert)}
                            className="w-full md:w-auto h-12 px-6 bg-[#252525] hover:bg-[#4d94ff] text-white hover:text-black font-bold uppercase tracking-widest transition-all"
                        >
                            Voir la setlist <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                    </div>
                ))}
            </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
