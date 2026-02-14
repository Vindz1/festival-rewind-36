import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Music, Loader2, Calendar, MapPin, AlertCircle, ArrowRight, Info } from 'lucide-react';
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
    
    try {
      console.log(`🔍 Recherche concerts pour: ${q}`);
      
      // Appel API avec paramètre upcoming=true
      const response = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&upcoming=true`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.log('⚠️ Aucun concert trouvé, mais on peut quand même générer avec iTunes');
        setConcerts([]);
        toast.info(`Aucun concert trouvé pour "${q}", mais vous pouvez générer une playlist !`);
      } else {
        console.log(`✅ ${data.results.length} concert(s) trouvé(s)`);
        setConcerts(data.results);
        toast.success(`${data.results.length} concert(s) à venir trouvé(s)`);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      toast.warning('Impossible de récupérer les concerts, mais vous pouvez générer une playlist');
      setConcerts([]);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateStr: string): Date => {
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

  const handleGeneratePlaylist = () => {
    if (!artistName) {
      toast.error("Recherchez d'abord un artiste");
      return;
    }

    // Créer un objet "concert" fictif pour iTunes Top 10
    const concertData = [{
      id: artistName.toLowerCase().replace(/\s+/g, '-'),
      artist: artistName,
      eventDate: 'À venir',
      isFuture: true // Mode iTunes
    }];

    localStorage.setItem('selected_upcoming', JSON.stringify(concertData));
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
            Recherche <span className="text-[#4d94ff]">Artiste</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Découvrez les prochains concerts et générez une playlist des meilleurs morceaux
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
            placeholder="Metallica, Iron Maiden, Bad Bunny..." 
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
            <p className="text-gray-400">Recherche en cours...</p>
          </div>
        )}

        {/* Résultats */}
        {!loading && artistName && (
          <div className="space-y-6">
            
            {/* Card principale avec CTA */}
            <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#404040] rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Music className="w-8 h-8 text-[#4d94ff]" />
                    <h2 className="text-2xl sm:text-3xl font-black">{artistName}</h2>
                  </div>
                  <p className="text-sm sm:text-base text-gray-400 mb-4">
                    Générez une playlist avec les meilleurs morceaux de cet artiste
                  </p>
                  {concerts.length > 0 && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs sm:text-sm font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {concerts.length} concert{concerts.length > 1 ? 's' : ''} à venir
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleGeneratePlaylist}
                  size="lg"
                  className="w-full sm:w-auto bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-8 h-14 text-lg rounded-xl shadow-[0_10px_40px_rgba(77,148,255,0.3)]"
                >
                  <ArrowRight className="mr-2 w-5 h-5" />
                  Créer Playlist
                </Button>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <strong className="font-semibold">Top Tracks iTunes</strong> - La playlist contiendra les 10 morceaux les plus populaires de {artistName}
              </div>
            </div>

            {/* Liste des concerts (info seulement) */}
            {concerts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#4d94ff]" />
                  Prochains concerts
                </h3>
                <div className="space-y-2">
                  {concerts.map((concert) => (
                    <div
                      key={concert.id}
                      className="bg-[#2d2d2d] border border-[#333] hover:border-[#404040] rounded-lg p-3 sm:p-4 flex items-start gap-3 sm:gap-4 transition-colors"
                    >
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-1" />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-white truncate">
                          {concert.venue.name}
                        </h4>
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aucune recherche */}
        {!loading && !artistName && (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-400">Recherchez un artiste</h3>
            <p className="text-gray-500">
              Utilisez la barre de recherche ci-dessus pour commencer
            </p>
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
