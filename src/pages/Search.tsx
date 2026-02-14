import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search as SearchIcon, Music, Loader2, Calendar, MapPin, Check, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Concert {
  id: string;
  artist: { name: string };
  venue: { name: string; city?: { name?: string; country?: { name?: string } } };
  eventDate: string;
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [selectedConcerts, setSelectedConcerts] = useState<Set<string>>(new Set());
  const [artistName, setArtistName] = useState('');

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) {
      toast.error("Entrez un nom d'artiste");
      return;
    }

    setLoading(true);
    setArtistName(q.trim());
    setConcerts([]);
    setSelectedConcerts(new Set());
    
    try {
      console.log(`🔍 Recherche concerts pour: ${q}`);
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        toast.error(`Aucun concert trouvé pour "${q}"`);
        setConcerts([]);
      } else {
        // Filtrer uniquement les concerts futurs
        const now = new Date();
        const futureConcerts = data.results.filter((concert: Concert) => {
          const concertDate = parseDate(concert.eventDate);
          return concertDate >= now;
        });
        
        if (futureConcerts.length === 0) {
          toast.warning(`Aucun concert à venir trouvé pour "${q}"`);
          setConcerts([]);
        } else {
          console.log(`✅ ${futureConcerts.length} concert(s) trouvé(s)`);
          setConcerts(futureConcerts);
          toast.success(`${futureConcerts.length} concert(s) à venir trouvé(s)`);
        }
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      toast.error('Erreur lors de la recherche');
      setConcerts([]);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateStr: string): Date => {
    // Format Setlist.fm : "DD-MM-YYYY"
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateStr);
  };

  const formatDate = (dateStr: string): string => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const toggleConcert = (id: string) => {
    const newSet = new Set(selectedConcerts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedConcerts(newSet);
  };

  const handleSelectAll = () => {
    if (selectedConcerts.size === concerts.length) {
      setSelectedConcerts(new Set());
    } else {
      setSelectedConcerts(new Set(concerts.map(c => c.id)));
    }
  };

  const handleGeneratePlaylist = () => {
    if (selectedConcerts.size === 0) {
      toast.error("Sélectionnez au moins un concert");
      return;
    }

    const selectedData = concerts
      .filter(c => selectedConcerts.has(c.id))
      .map(c => ({
        id: c.id,
        artist: c.artist.name,
        venue: c.venue.name,
        eventDate: c.eventDate,
        isFuture: true // Mode iTunes pour concerts futurs
      }));

    localStorage.setItem('selected_upcoming', JSON.stringify(selectedData));
    navigate('/generate?mode=upcoming');
  };

  const getLocationString = (concert: Concert): string => {
    const parts = [];
    if (concert.venue?.city?.name) parts.push(concert.venue.city.name);
    if (concert.venue?.city?.country?.name) parts.push(concert.venue.city.country.name);
    return parts.join(', ') || 'Lieu non spécifié';
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      
      <div className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 pb-20">
        
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase mb-4">
            Recherche de <span className="text-[#4d94ff]">Concerts</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Trouvez les prochains concerts d'un artiste et générez une playlist de ses meilleurs morceaux
          </p>
        </div>

        {/* Formulaire de recherche */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }} 
          className="relative group max-w-2xl mx-auto mb-12"
        >
          <SearchIcon className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 sm:w-6 sm:h-6 group-focus-within:text-[#4d94ff] transition-colors z-10" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Metallica, Gojira, Bad Bunny..." 
            className="h-16 sm:h-20 pl-12 sm:pl-16 pr-32 sm:pr-40 bg-white/5 border-2 border-white/10 text-base sm:text-xl rounded-full focus:ring-2 focus:ring-[#4d94ff]/50 focus:border-[#4d94ff] transition-all shadow-2xl placeholder:text-gray-600"
            disabled={loading}
          />
          <Button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 px-6 sm:px-10 rounded-full bg-[#4d94ff] hover:bg-white hover:text-black font-bold uppercase transition-all text-sm sm:text-lg shadow-[0_0_30px_rgba(77,148,255,0.4)] hover:shadow-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'GO'}
          </Button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#4d94ff] mx-auto mb-4" />
            <p className="text-gray-400">Recherche des concerts à venir...</p>
          </div>
        )}

        {/* Résultats */}
        {!loading && concerts.length > 0 && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 sm:p-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">{artistName}</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  {concerts.length} concert{concerts.length > 1 ? 's' : ''} à venir
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline"
                  onClick={handleSelectAll}
                  className="text-xs border-[#404040] text-[#a0a0a0] hover:bg-[#3d3d3d] hover:text-white"
                >
                  {selectedConcerts.size === concerts.length ? (
                    <><XCircle className="w-3 h-3 mr-1.5" /> Tout désélectionner</>
                  ) : (
                    <><Check className="w-3 h-3 mr-1.5" /> Tout sélectionner</>
                  )}
                </Button>
                <Button 
                  onClick={handleGeneratePlaylist}
                  disabled={selectedConcerts.size === 0}
                  className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-6 disabled:opacity-50"
                >
                  Créer Playlist ({selectedConcerts.size})
                </Button>
              </div>
            </div>

            {/* Liste des concerts */}
            <div className="space-y-2">
              {concerts.map((concert) => {
                const isSelected = selectedConcerts.has(concert.id);
                
                return (
                  <div
                    key={concert.id}
                    onClick={() => toggleConcert(concert.id)}
                    className={`
                      flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer transition-colors border-l-2 rounded-r-lg
                      ${isSelected 
                        ? 'bg-[#4d94ff]/10 border-[#4d94ff]' 
                        : 'bg-[#2d2d2d] border-transparent hover:bg-[#3d3d3d]'}
                    `}
                  >
                    <div className={`
                      w-4 h-4 sm:w-5 sm:h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-[#4d94ff] border-[#4d94ff]' : 'border-[#404040]'}
                    `}>
                      {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
                    </div>
                    
                    <Music className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-[#4d94ff]' : 'text-gray-500'}`} />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm sm:text-base font-bold truncate ${isSelected ? 'text-[#4d94ff]' : 'text-white'}`}>
                        {concert.venue.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-[#a0a0a0] mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {formatDate(concert.eventDate)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {getLocationString(concert)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && query && concerts.length === 0 && (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-400">Aucun concert à venir</h3>
            <p className="text-gray-500 mb-8">
              Aucun concert trouvé pour "{artistName}"
            </p>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="border-[#404040] text-white hover:bg-[#2d2d2d]"
            >
              Retour à l'accueil
            </Button>
          </div>
        )}

        {/* Barre flottante mobile */}
        {selectedConcerts.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-[#2d2d2d] border-t border-[#404040] p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-40">
            <Button 
              onClick={handleGeneratePlaylist}
              className="w-full bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold h-12"
            >
              Créer Playlist ({selectedConcerts.size} concert{selectedConcerts.size > 1 ? 's' : ''})
            </Button>
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
