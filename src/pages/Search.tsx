import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Music, Loader2, ArrowRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Track {
  artist: string;
  name: string;
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artistName, setArtistName] = useState('');

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const fetchItunes = async (artist: string, limit: number = 10): Promise<Track[]> => {
    try {
      const searchLimit = Math.max(limit * 5, 50);
      
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${searchLimit}&country=US`
      );
      
      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [];
      }
      
      const normalizedSearchArtist = normalizeString(artist);
      
      const scoredResults = data.results
        .map((item: any) => {
          const normalizedArtistName = normalizeString(item.artistName);
          let score = 0;
          
          if (normalizedArtistName === normalizedSearchArtist) {
            score += 100;
          } else if (normalizedArtistName.includes(normalizedSearchArtist)) {
            score += 50;
          } else {
            return { ...item, score: 0 };
          }
          
          return { ...item, score };
        })
        .filter(item => item.score > 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return scoredResults.map((item: any) => ({
        artist: item.artistName,
        name: item.trackName
      }));
    } catch (err) {
      console.error(`Erreur iTunes pour ${artist}:`, err);
      return [];
    }
  };

  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) {
      toast.error("Entrez un nom d'artiste");
      return;
    }

    setLoading(true);
    setArtistName(q.trim());
    
    try {
      console.log(`🔍 Recherche iTunes pour: ${q}`);
      const results = await fetchItunes(q.trim(), 10);
      
      if (results.length === 0) {
        toast.error(`Aucun résultat trouvé pour "${q}"`);
        setTracks([]);
      } else {
        console.log(`✅ ${results.length} morceaux trouvés`);
        setTracks(results);
        toast.success(`${results.length} morceaux trouvés pour ${q}`);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      toast.error('Erreur lors de la recherche');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlaylist = () => {
    if (tracks.length === 0) {
      toast.error("Aucun morceau à exporter");
      return;
    }

    // Créer un objet "concert" fictif pour iTunes
    const concertData = [{
      id: artistName.toLowerCase().replace(/\s+/g, '-'),
      artist: artistName,
      eventDate: new Date().toLocaleDateString('fr-FR'),
      isFuture: true, // Mode iTunes
      tracks: tracks
    }];

    localStorage.setItem('selected_upcoming', JSON.stringify(concertData));
    navigate('/generate?mode=upcoming');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 pb-20">
        
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase mb-4">
            Recherche de <span className="text-[#4d94ff]">Concert</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Trouvez n'importe quel artiste et générez une playlist de ses meilleurs morceaux
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

        {/* Résultats */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#4d94ff] mx-auto mb-4" />
            <p className="text-gray-400">Recherche en cours...</p>
          </div>
        )}

        {!loading && tracks.length > 0 && (
          <div className="space-y-6">
            {/* Header résultats */}
            <div className="flex items-center justify-between bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 sm:p-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">{artistName}</h2>
                <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top {tracks.length} morceaux
                </p>
              </div>
              <Button 
                onClick={handleGeneratePlaylist}
                className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-6 sm:px-8 rounded-lg"
              >
                <ArrowRight className="mr-2 w-4 h-4" />
                Créer Playlist
              </Button>
            </div>

            {/* Liste des morceaux */}
            <div className="space-y-2">
              {tracks.map((track, idx) => (
                <div 
                  key={idx}
                  className="bg-[#252525] border border-[#333] hover:border-[#4d94ff]/50 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all"
                >
                  <span className="text-[#666] font-mono text-xs sm:text-sm min-w-[2rem]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <Music className="w-4 h-4 sm:w-5 sm:h-5 text-[#4d94ff]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm sm:text-base text-white truncate">{track.name}</p>
                    <p className="text-xs sm:text-sm text-[#a0a0a0] truncate">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA fixe mobile */}
            <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-[#2d2d2d] border-t border-[#404040] p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-40">
              <Button 
                onClick={handleGeneratePlaylist}
                className="w-full bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold h-12"
              >
                Créer Playlist ({tracks.length} morceaux)
              </Button>
            </div>
          </div>
        )}

        {!loading && query && tracks.length === 0 && (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-400">Aucun résultat</h3>
            <p className="text-gray-500 mb-8">
              Impossible de trouver des morceaux pour "{artistName}"
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

      </div>

      <Footer />
    </div>
  );
}
