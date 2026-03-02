import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Check, XCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { SYLAK_OPEN_AIR_LINEUP, ArtistData } from '@/data/SylakOpenAir'; 
import { Footer } from '@/components/Footer';

const SylakOpenAirPage = () => {
  const navigate = useNavigate();
  const [artists] = useState<ArtistData[]>(SYLAK_OPEN_AIR_LINEUP);
   
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
   
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const uniqueDays = Array.from(new Set(artists.map(a => a.day)));
    const uniqueStages = Array.from(new Set(artists.map(a => a.stage)));
    
    setAvailableDays(uniqueDays);
    setAvailableStages(uniqueStages);
  }, [artists]);

  const toggleDay = (day: string) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(day)) newDays.delete(day);
    else newDays.add(day);
    setSelectedDays(newDays);
  };

  const toggleStage = (stage: string) => {
    const newStages = new Set(selectedStages);
    if (newStages.has(stage)) newStages.delete(stage);
    else newStages.add(stage);
    setSelectedStages(newStages);
  };

  const toggleArtist = (id: string) => {
    const newArtists = new Set(selectedArtists);
    if (newArtists.has(id)) newArtists.delete(id);
    else newArtists.add(id);
    setSelectedArtists(newArtists);
  };

  const handleSelectAll = () => {
    if (selectedArtists.size === filteredArtists.length) {
      setSelectedArtists(new Set());
    } else {
      setSelectedArtists(new Set(filteredArtists.map(a => a.id)));
    }
  };

  const handleGenerate = () => {
    if (selectedArtists.size === 0) {
      toast.error('Sélectionnez au moins un artiste');
      return;
    }

    const selectedTracks = artists
      .filter(a => selectedArtists.has(a.id))
      .map(a => ({ artist: a.name, name: '' }));

    const playlistData = {
      playlistName: `Sylak Open Air 2026 - My Selection`,
      mainArtist: 'Sylak Open Air',
      songs: selectedTracks
    };

    localStorage.setItem('playlistData', JSON.stringify(playlistData));
    navigate('/generate');
  };

  const filteredArtists = artists.filter(artist => {
    const matchDay = selectedDays.size === 0 || selectedDays.has(artist.day);
    const matchStage = selectedStages.size === 0 || selectedStages.has(artist.stage);
    return matchDay && matchStage;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-8">
        
        {/* EN-TÊTE / HERO */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter mb-4 text-white drop-shadow-lg">
            FESTIVAL <br/>
            <span className="text-[#4d94ff]">SYLAK OPEN AIR</span>
          </h1>
          <p className="text-lg text-gray-300 font-medium mb-4">
            31 Juillet - 2 Août 2026 • Stade Régis Perrin (St-Maurice-de-Gourdans)
          </p>

          <a 
            href="https://www.sylakopenair.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold text-white transition-all backdrop-blur-sm"
          >
            <ExternalLink className="w-4 h-4 text-[#4d94ff]" />
            Site Officiel
          </a>
        </div>

        <div className="lg:hidden mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="w-full bg-[#1a1a1a] border-[#333] text-white hover:bg-[#252525]"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            {showFilters ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* FILTRES */}
          <div className={`lg:w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#4d94ff]" /> Filtres
                </h2>
                {(selectedDays.size > 0 || selectedStages.size > 0) && (
                  <button 
                    onClick={() => { setSelectedDays(new Set()); setSelectedStages(new Set()); }}
                    className="text-xs text-[#a0a0a0] hover:text-white flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" /> Effacer
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#666] uppercase tracking-wider mb-3">Jours</h3>
                  <div className="space-y-2">
                    {availableDays.map(day => (
                      <label key={day} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox 
                          checked={selectedDays.has(day)}
                          onCheckedChange={() => toggleDay(day)}
                          className="border-[#4d94ff] data-[state=checked]:bg-[#4d94ff] data-[state=checked]:text-white"
                        />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={selectedArtists.size === 0}
                className="w-full mt-8 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold h-12 shadow-lg shadow-blue-500/20"
              >
                Créer la Playlist ({selectedArtists.size})
              </Button>
            </div>
          </div>

          {/* LISTE DES ARTISTES */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  className="bg-transparent border-[#404040] text-white hover:bg-[#2d2d2d]"
                >
                  {selectedArtists.size === filteredArtists.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
                <span className="text-sm text-[#a0a0a0]">
                  {filteredArtists.length} artiste{filteredArtists.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-24 lg:pb-0">
              {filteredArtists.map(artist => {
                const isSelected = selectedArtists.has(artist.id);
                return (
                  <div 
                    key={artist.id}
                    onClick={() => toggleArtist(artist.id)}
                    className={`
                      relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 border
                      ${isSelected 
                        ? 'bg-[#4d94ff]/10 border-[#4d94ff] shadow-[0_0_15px_rgba(77,148,255,0.15)]' 
                        : 'bg-[#1a1a1a] border-[#333] hover:border-[#666] hover:bg-[#252525]'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${isSelected ? 'border-[#4d94ff] bg-[#4d94ff]' : 'border-[#404040] bg-transparent'}
                    `}>
                      {isSelected && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs sm:text-sm font-medium truncate ${isSelected ? 'text-[#4d94ff]' : 'text-white'}`}>
                        {artist.name}
                      </h3>
                      <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#a0a0a0] mt-0.5">
                        <span className="truncate">{artist.day}</span>
                        <span>•</span>
                        <span className="truncate">{artist.stage}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER MOBILE FIXE */}
      {selectedArtists.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-[#2d2d2d] border-t border-[#404040] p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-40">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">
              {selectedArtists.size} sélectionné{selectedArtists.size > 1 ? 's' : ''}
            </span>
            <Button 
              onClick={handleGenerate} 
              className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-6"
            >
              Créer Playlist
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default SylakOpenAirPage;
