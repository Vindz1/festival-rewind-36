import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, Music, MapPin, ArrowRight, AlertCircle } from 'lucide-react';

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
        // On appelle NOTRE nouvelle API
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) throw new Error("Erreur lors de la recherche");
        
        const data = await response.json();
        setResults(data.setlist || []);
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer les résultats.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  // Fonction pour gérer le clic sur un concert trouvé
  const handleSelect = (concert: any) => {
    // On formate les données pour Generate.tsx
    const formattedConcert = {
        id: concert.id,
        artist: concert.artist,
        venue: concert.venue,
        eventDate: concert.eventDate,
        sets: concert.sets
    };

    // On passe en mode "Direct" via le state de navigation
    // C'est la méthode la plus propre pour le scénario "Je cherche -> Je clique -> Je génère"
    navigate('/generate', { 
        state: { 
            artists: [concert.artist.name], // Pour le mode "Futur/BestOf" si besoin
            eventName: `${concert.artist.name} @ ${concert.venue.name}`,
            // On passe aussi les données brutes pour le mode "Passé" (Extraction Setlist)
            // On le stocke temporairement dans le localStorage pour que Generate le retrouve comme un "concert sélectionné"
        } 
    });

    // Astuce : On force le mode "Passé" en injectant ce concert dans le stockage
    localStorage.setItem('selected_concerts', JSON.stringify([formattedConcert]));
    localStorage.removeItem('selected_upcoming');
    
    navigate('/generate');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
      <Header />
      
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pt-32 pb-20">
        <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-black italic uppercase mb-2">Résultats</h1>
            <p className="text-[#a0a0a0] text-lg">Recherche pour : <span className="text-white font-bold">"{query}"</span></p>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[#4d94ff] animate-spin mb-4"/>
                <p className="text-[#666] uppercase tracking-widest font-bold text-sm">Recherche Setlist.fm...</p>
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
                <h3 className="text-xl font-bold mb-2">Aucun résultat</h3>
                <p className="text-[#666]">Essayez avec un autre nom d'artiste.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {results.map((concert) => {
                    // Calcul de la date
                    const [d, m, y] = concert.eventDate.split('-');
                    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
                    const monthName = dateObj.toLocaleString('default', { month: 'short' });

                    // Calcul du nombre de titres (approximation)
                    const songsCount = concert.sets?.set?.reduce((acc: number, s: any) => acc + (s.song?.length || 0), 0) || 0;

                    return (
                        <div 
                            key={concert.id} 
                            onClick={() => handleSelect(concert)}
                            className="flex gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#333] hover:border-[#4d94ff] transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
                        >
                            {/* BLOC DATE (Style MyConcerts) */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-[#111] border border-[#333] rounded-lg group-hover:border-[#4d94ff]/50 transition-colors">
                                <span className="text-xl font-black text-white">{d}</span>
                                <span className="text-xs font-bold uppercase text-[#666]">{monthName}</span>
                                <span className="text-[10px] text-[#444]">{y}</span>
                            </div>

                            {/* INFOS */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h3 className="text-xl font-black italic uppercase text-white truncate group-hover:text-[#4d94ff] transition-colors">
                                    {concert.artist.name}
                                </h3>
                                <div className="flex items-center gap-2 text-[#a0a0a0] text-sm truncate mb-2">
                                    <MapPin className="w-3 h-3 text-[#666]"/>
                                    <span className="truncate">{concert.venue?.name}, {concert.venue?.city?.name}</span>
                                </div>
                                {/* Badge nombre de titres */}
                                {songsCount > 0 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#4d94ff]/10 text-[#4d94ff] border border-[#4d94ff]/20 w-fit">
                                        {songsCount} Titres
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#333] text-[#666] border border-[#444] w-fit">
                                        Setlist Vide
                                    </span>
                                )}
                            </div>

                            {/* FLÈCHE */}
                            <div className="flex items-center px-2">
                                <ArrowRight className="text-[#333] group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
