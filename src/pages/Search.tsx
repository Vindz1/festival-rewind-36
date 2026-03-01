import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Music, Loader2, Calendar, MapPin, Check, XCircle, AlertCircle, ListMusic, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Concert {
  id: string;
  artist: { name: string };
  venue: { name: string; city?: { name?: string; country?: { name?: string } } };
  eventDate: string;
  sets?: { set: Array<{ song: Array<{ name: string }> }> };
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialQuery = searchParams.get('q') || '';
  const urlSearchType = searchParams.get('type') || 'all';
  
  const [query, setQuery] = useState(initialQuery);
  const [localSearchType, setLocalSearchType] = useState(urlSearchType);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [selectedConcerts, setSelectedConcerts] = useState<Set<string>>(new Set());
  const [artistName, setArtistName] = useState('');
  
  // NOUVEAU: Les filtres (Checkboxes dynamiques)
  const [filterArtists, setFilterArtists] = useState<Set<string>>(new Set());
  const [filterYears, setFilterYears] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, 1, false, urlSearchType);
    }
  }, [initialQuery, urlSearchType]);

  const handleSearch = async (searchQuery?: string, pageNum: number = 1, isLoadMore: boolean = false, typeOverride?: string) => {
    const q = searchQuery || query;
    const currentTypeToUse = typeOverride || localSearchType;
    
    if (!q.trim()) {
      toast.error("Entrez une recherche");
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setArtistName(q.trim());
      setConcerts([]);
      setSelectedConcerts(new Set());
      setFilterArtists(new Set()); // Reset filtres
      setFilterYears(new Set()); // Reset filtres
    }
    
    try {
      console.log(`🔍 Recherche (Page ${pageNum}) pour: ${q} (Type: ${currentTypeToUse})`);
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&type=${currentTypeToUse}&p=${pageNum}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        if (!isLoadMore) toast.error(`Aucun résultat trouvé pour "${q}"`);
        setHasMore(false);
      } else {
        const concertsWithSetlist = data.results.filter((concert: Concert) => {
          return concert.sets && concert.sets.set && concert.sets.set.length > 0;
        });
        
        if (isLoadMore) {
          setConcerts(prev => [...prev, ...concertsWithSetlist]);
        } else {
          setConcerts(concertsWithSetlist);
          if (concertsWithSetlist.length > 0) {
            toast.success(`${concertsWithSetlist.length} concerts trouvés.`);
          } else {
            toast.warning(`Page 1 analysée: Aucune setlist pleine. Essayez "Chercher d'autres dates".`);
          }
        }

        const itemsPerPage = data.itemsPerPage || 20;
        const totalItems = data.total || 0;
        if (pageNum * itemsPerPage < totalItems || data.results.length === 20) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    handleSearch(query, nextPage, true, localSearchType);
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
      day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  const getSongCount = (concert: Concert): number => {
    if (!concert.sets || !concert.sets.set) return 0;
    return concert.sets.set.reduce((total, set) => {
      return total + (set.song ? set.song.length : 0);
    }, 0);
  };

  const toggleConcert = (id: string) => {
    const newSet = new Set(selectedConcerts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedConcerts(newSet);
  };

  const handleSelectAll = (displayedList: Concert[]) => {
    // Ne sélectionner que les concerts actuellement visibles (filtrés)
    const displayedIds = displayedList.map(c => c.id);
    const areAllSelected = displayedIds.every(id => selectedConcerts.has(id));
    
    const newSet = new Set(selectedConcerts);
    if (areAllSelected) {
      displayedIds.forEach(id => newSet.delete(id));
    } else {
      displayedIds.forEach(id => newSet.add(id));
    }
    setSelectedConcerts(newSet);
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
        eventDate: c.eventDate
      }));
    localStorage.setItem('selected_concerts', JSON.stringify(selectedData));
    navigate('/generate');
  };

  const getLocationString = (concert: Concert): string => {
    const parts = [];
    if (concert.venue?.city?.name) parts.push(concert.venue.city.name);
    if (concert.venue?.city?.country?.name) parts.push(concert.venue.city.country.name);
    return parts.join(', ') || 'Lieu non spécifié';
  };

  // ----- LOGIQUE DES FILTRES -----
  const availableArtists = Array.from(new Set(concerts.map(c => c.artist.name)));
  const availableYears = Array.from(new Set(concerts.map(c => c.eventDate.split('-')[2]))).sort().reverse();
  
  const displayedConcerts = concerts.filter(c => {
    const matchArtist = filterArtists.size === 0 || filterArtists.has(c.artist.name);
    const matchYear = filterYears.size === 0 || filterYears.has(c.eventDate.split('-')[2]);
    return matchArtist && matchYear;
  });

  const toggleFilterArtist = (name: string) => {
    const newSet = new Set(filterArtists);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setFilterArtists(newSet);
  };

  const toggleFilterYear = (year: string) => {
    const newSet = new Set(filterYears);
    if (newSet.has(year)) newSet.delete(year);
    else newSet.add(year);
    setFilterYears(newSet);
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
            Trouvez les concerts passés et revivez les setlists exactes
          </p>
        </div>

        {/* Formulaire de recherche */}
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            setPage(1); 
            navigate(`/search?type=${localSearchType}&q=${encodeURIComponent(query)}`);
            handleSearch(query, 1, false, localSearchType); 
          }} 
          className="relative max-w-3xl mx-auto mb-12 flex items-center bg-white/5 border-2 border-white/10 rounded-full focus-within:ring-2 focus-within:ring-[#4d94ff]/50 focus-within:border-[#4d94ff] transition-all shadow-2xl h-16 sm:h-20 overflow-hidden"
        >
          <select
            value={localSearchType}
            onChange={(e) => setLocalSearchType(e.target.value)}
            className="h-full bg-transparent text-[#4d94ff] font-bold px-4 sm:px-6 border-r border-white/10 focus:outline-none cursor-pointer hover:bg-white/5 transition-colors"
          >
            <option value="all" className="text-black">Tout (Mélangé)</option>
            <option value="artistName" className="text-black">Artiste Exact</option>
            <option value="tourName" className="text-black">Tournée</option>
            <option value="cityName" className="text-black">Ville</option>
          </select>
          
          <div className="relative flex-1 h-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 sm:w-6 sm:h-6 z-10" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Metallica, Lamomali..."
              className="w-full h-full pl-12 sm:pl-14 pr-32 sm:pr-40 bg-transparent border-0 text-base sm:text-xl focus-visible:ring-0 placeholder:text-gray-600 rounded-none"
              disabled={loading}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 px-6 sm:px-10 rounded-full bg-[#4d94ff] hover:bg-white hover:text-black font-bold uppercase transition-all text-sm sm:text-lg shadow-[0_0_30px_rgba(77,148,255,0.4)] hover:shadow-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'GO'}
          </Button>
        </form>

        {/* Loading Initial */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#4d94ff] mx-auto mb-4" />
            <p className="text-gray-400">Recherche en cours...</p>
          </div>
        )}

        {/* Résultats */}
        {!loading && concerts.length > 0 && (
          <div className="space-y-6">
            
            {/* Section FILTRES (Si plusieurs choix disponibles) */}
            {(availableArtists.length > 1 || availableYears.length > 1) && (
              <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4 text-[#a0a0a0] font-bold text-sm uppercase">
                  <Filter className="w-4 h-4" /> Filtres
                </div>
                
                {availableArtists.length > 1 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Filtrer par Artiste Exact :</p>
                    <div className="flex flex-wrap gap-2">
                      {availableArtists.map(a => (
                        <button
                          key={a}
                          onClick={() => toggleFilterArtist(a)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            filterArtists.has(a) ? 'bg-[#4d94ff] text-white shadow-[0_0_10px_rgba(77,148,255,0.3)]' : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#404040]'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableYears.length > 1 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Filtrer par Année :</p>
                    <div className="flex flex-wrap gap-2">
                      {availableYears.map(y => (
                        <button
                          key={y}
                          onClick={() => toggleFilterYear(y)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            filterYears.has(y) ? 'bg-[#4d94ff] text-white shadow-[0_0_10px_rgba(77,148,255,0.3)]' : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#404040]'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Toolbar Supérieure */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 sm:p-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">{artistName}</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  {displayedConcerts.length} setlist{displayedConcerts.length > 1 ? 's' : ''} affichée{displayedConcerts.length > 1 ? 's' : ''} (Pages explorées : {page})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline"
                  onClick={() => handleSelectAll(displayedConcerts)}
                  className="text-xs border-[#404040] text-[#a0a0a0] hover:bg-[#3d3d3d] hover:text-white"
                >
                  {selectedConcerts.size > 0 ? (
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
              {displayedConcerts.map((concert) => {
                const isSelected = selectedConcerts.has(concert.id);
                const songCount = getSongCount(concert);
                
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
                    
                    <ListMusic className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-[#4d94ff]' : 'text-gray-500'}`} />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm sm:text-base font-bold truncate ${isSelected ? 'text-[#4d94ff]' : 'text-white'}`}>
                        {concert.venue.name} <span className="text-[#a0a0a0] font-normal text-xs sm:text-sm">({concert.artist.name})</span>
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
                        {songCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Music className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {songCount} morceaux
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOUTON CHARGER PLUS (PAGINATION) */}
            {hasMore && (
              <div className="pt-6 text-center">
                <Button 
                  onClick={loadMore} 
                  disabled={loadingMore}
                  variant="outline"
                  className="bg-[#2d2d2d] border-[#404040] text-white hover:bg-[#3d3d3d] px-8 h-12 rounded-full"
                >
                  {loadingMore ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Chargement de la page suivante...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Chercher d'autres dates</>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-3">L'API vérifie par tranche de 20 concerts récents.</p>
              </div>
            )}
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && query && concerts.length === 0 && (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-400">Aucune setlist trouvée</h3>
            <p className="text-gray-500 mb-8">
              Il y a peut-être des concerts, mais personne n'a encore renseigné les morceaux.
            </p>
            {hasMore && (
               <Button onClick={loadMore} className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white">
                 Explorer les pages plus anciennes
               </Button>
            )}
          </div>
        )}

        {/* Pas de recherche */}
        {!loading && !artistName && (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-400">Prêt à fouiller ?</h3>
            <p className="text-gray-500">
              Utilisez la barre de recherche pour trouver des concerts passés.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
