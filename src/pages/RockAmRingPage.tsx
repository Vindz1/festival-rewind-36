import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Check, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
// Import correct depuis la racine /data/
import { ROCK_AM_RING_LINEUP, ArtistData } from '@/data/rockAmRingData';
import { Footer } from '@/components/Footer';

const RockAmRingPage = () => {
  const navigate = useNavigate();
  const [artists] = useState<ArtistData[]>(ROCK_AM_RING_LINEUP);
   
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
    autoSelectArtists(newDays, selectedStages);
  };

  const toggleStage = (stage: string) => {
    const newStages = new Set(selectedStages);
    if (newStages.has(stage)) newStages.delete(stage);
    else newStages.add(stage);
    setSelectedStages(newStages);
    autoSelectArtists(selectedDays, newStages);
  };

  const autoSelectArtists = (days: Set<string>, stages: Set<string>) => {
    const newSelection = new Set<string>();
    
    artists.forEach(artist => {
      const dayMatch = days.size === 0 || days.has(artist.day);
      const stageMatch = stages.size === 0 || stages.has(artist.stage);
      
      if ((days.size > 0 || stages.size > 0) && dayMatch && stageMatch) {
        newSelection.add(artist.id);
      }
    });
    
    if (days.size > 0 || stages.size > 0) {
      setSelectedArtists(newSelection);
    }
  };

  const handleClearSelection = () => {
    setSelectedArtists(new Set());
  };

  const toggleArtist = (id: string) => {
    const newSet = new Set(selectedArtists);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedArtists(newSet);
  };

  const handleGenerate = () => {
    if (selectedArtists.size === 0) {
      toast.error("Sélectionnez au moins un artiste !");
      return;
    }

    const selectedArray = artists
      .filter(a => selectedArtists.has(a.id))
      .map(a => ({
        id: a.id,
        artist: a.name,
        eventDate: a.day + " - Rock am Ring 2026"
      }));

    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArray));
    navigate('/generate?mode=upcoming');
  };

  const filteredArtists = artists.filter(artist => {
    const dayMatch = selectedDays.size === 0 || selectedDays.has(artist.day);
    const stageMatch = selectedStages.size === 0 || selectedStages.has(artist.stage);
    return dayMatch && stageMatch;
  });

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header />
       
      <main className="pt-20 pb-20 sm:pb-16 max-w-[1400px] mx-auto px-4">
        {/* Header Rock am Ring */}
        <div className="bg-[#2d2d2d] border border-[#00cc00] rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#00ff00] mb-2 uppercase">
            ROCK AM RING 2026
          </h1>
          <p className="text-xs sm:text-sm text-[#a0a0a0]">
            Programmation officielle • {artists.length} groupes
          </p>
        </div>

        {/* Bouton Filtres Mobile */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full bg-[#2d2d2d] border border-[#404040] text-white hover:bg-[#3d3d3d] flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres
              {(selectedDays.size > 0 || selectedStages.size > 0) && (
                <span className="bg-[#00cc00] text-black text-xs px-2 py-0.5 rounded-full font-bold">
                  {selectedDays.size + selectedStages.size}
                </span>
              )}
            </span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">
          {/* Sidebar Filtres */}
          <div className={`
            bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 lg:sticky lg:top-20 lg:h-fit
            ${showFilters ? 'block' : 'hidden lg:block'}
          `}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-white font-bold">
                <Filter className="w-5 h-5 text-[#00ff00]" />
                Filtres
              </div>
              {(selectedDays.size > 0 || selectedStages.size > 0) && (
                <button 
                  onClick={() => {
                    setSelectedDays(new Set());
                    setSelectedStages(new Set());
                  }}
                  className="text-xs text-[#00ff00] hover:text-[#33ff33] font-medium"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Filtre Jours */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#a0a0a0] uppercase tracking-wider mb-3">Jours</h3>
              <div className="space-y-2">
                {availableDays.map(day => (
                  <label key={day} className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={selectedDays.has(day)}
                      onCheckedChange={() => toggleDay(day)}
                      className="border-[#666] data-[state=checked]:bg-[#00ff00] data-[state=checked]:border-[#00ff00] data-[state=checked]:text-black"
                    />
                    <span className="text-sm text-[#e0e0e0] group-hover:text-white transition-colors">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtre Scènes */}
            <div>
              <h3 className="text-sm font-bold text-[#a0a0a0] uppercase tracking-wider mb-3">Scènes</h3>
              <div className="space-y-2">
                {availableStages.map(stage => (
                  <label key={stage} className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={selectedStages.has(stage)}
                      onCheckedChange={() => toggleStage(stage)}
                      className="border-[#666] data-[state=checked]:bg-[#00ff00] data-[state=checked]:border-[#00ff00] data-[state=checked]:text-black"
                    />
                    <span className="text-sm text-[#e0e0e0] group-hover:text-white transition-colors">{stage}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Liste des Artistes */}
          <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Artistes ({filteredArtists.length})
                </h2>
                {selectedArtists.size > 0 && (
                  <p className="text-sm text-[#00ff00] mt-1 font-medium">
                    {selectedArtists.size} artiste{selectedArtists.size > 1 ? 's' : ''} sélectionné{selectedArtists.size > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedArtists.size > 0 && (
                  <Button 
                    variant="outline"
                    onClick={handleClearSelection}
                    className="flex-1 sm:flex-none h-9 text-xs bg-transparent border-[#404040] text-white hover:bg-[#333] hover:text-white"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Effacer
                  </Button>
                )}
                <Button 
                  onClick={handleGenerate}
                  disabled={selectedArtists.size === 0}
                  className="flex-1 sm:flex-none h-9 text-xs bg-[#00cc00] hover:bg-[#00ff00] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Générer Setlist
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
              {filteredArtists.map(artist => {
                const isSelected = selectedArtists.has(artist.id);
                return (
                  <div 
                    key={artist.id}
                    onClick={() => toggleArtist(artist.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border
                      ${isSelected 
                        ? 'bg-[#00ff00]/10 border-[#00ff00]' 
                        : 'bg-[#1a1a1a] border-[#333] hover:border-[#666] hover:bg-[#222]'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors
                      ${isSelected ? 'bg-[#00ff00] border-[#00ff00]' : 'border-[#666] bg-[#2d2d2d]'}
                    `}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs sm:text-sm font-medium truncate ${isSelected ? 'text-[#00ff00]' : 'text-white'}`}>
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

      {/* Barre flottante génération (mobile) */}
      {selectedArtists.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-[#2d2d2d] border-t border-[#404040] p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-40">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">
              {selectedArtists.size} sélectionné{selectedArtists.size > 1 ? 's' : ''}
            </span>
            <Button 
              onClick={handleGenerate} 
              className="bg-[#00cc00] hover:bg-[#00ff00] text-black font-bold px-6"
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

export default RockAmRingPage;
