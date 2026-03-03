import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ANGRY_BURGER_LINEUP, ArtistData } from '@/data/AngryBurger'; 
import { Footer } from '@/components/Footer';

const AngryBurgerPage = () => {
  const navigate = useNavigate();
  const [artists] = useState<ArtistData[]>(ANGRY_BURGER_LINEUP);
   
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
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setSelectedDays(newDays);
    
    // Auto-select/deselect artists
    const newSelectedArtists = new Set(selectedArtists);
    artists.forEach(artist => {
      if (artist.day === day) {
        if (newDays.has(day)) {
          newSelectedArtists.add(artist.id);
        } else {
          newSelectedArtists.delete(artist.id);
        }
      }
    });
    setSelectedArtists(newSelectedArtists);
  };

  const toggleStage = (stage: string) => {
    const newStages = new Set(selectedStages);
    if (newStages.has(stage)) {
      newStages.delete(stage);
    } else {
      newStages.add(stage);
    }
    setSelectedStages(newStages);
  };

  const toggleArtist = (artistId: string) => {
    const newSelected = new Set(selectedArtists);
    if (newSelected.has(artistId)) {
      newSelected.delete(artistId);
    } else {
      newSelected.add(artistId);
    }
    setSelectedArtists(newSelected);
  };

  const selectAll = () => {
    setSelectedArtists(new Set(artists.map(a => a.id)));
    setSelectedDays(new Set(availableDays));
  };

  const deselectAll = () => {
    setSelectedArtists(new Set());
    setSelectedDays(new Set());
    setSelectedStages(new Set());
  };

  const handleGenerate = () => {
    if (selectedArtists.size === 0) {
      toast.error("Sélectionnez au moins un artiste pour générer une playlist !");
      return;
    }

    const selectedArtistData = artists
      .filter(a => selectedArtists.has(a.id))
      .map(a => ({
        id: a.id,
        artist: a.name,
        eventDate: `${a.day} - Angry Burger Festival 2026`
      }));

    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArtistData));
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
      
      <main className="pt-20 pb-24 lg:pb-12 max-w-[1400px] mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 bg-[#2d2d2d] border border-[#404040] rounded-xl p-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-[#00cc00] text-black text-[10px] font-bold rounded-full uppercase tracking-wider">
                Line-up Officiel
              </span>
              <span className="text-[#a0a0a0] text-xs font-medium">
                {artists.length} Groupes confirmés
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
              ANGRY BURGER <span className="text-[#00cc00]">FESTIVAL</span>
            </h1>
            <p className="text-[#a0a0a0] mt-2 font-medium flex items-center gap-2">
              7 - 9 AOÛT 2026 • CHÂTEAU-GONTIER, FR
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={deselectAll}
              className="border-[#404040] text-white hover:bg-[#3d3d3d] flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Effacer
            </Button>
            <Button 
              onClick={handleGenerate}
              className="bg-[#00cc00] hover:bg-[#00ff00] text-black font-bold px-8 shadow-[0_0_20px_rgba(0,204,0,0.3)]"
            >
              GÉNÉRER MA PLAYLIST
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-6`}>
            <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-5 sticky top-24">
              <h2 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-wide">
                <Filter className="w-4 h-4 text-[#00cc00]" /> Filtrer par
              </h2>

              <div className="space-y-8">
                {/* Jours */}
                <div>
                  <p className="text-[10px] font-bold text-[#a0a0a0] mb-4 uppercase tracking-[0.2em]">Jours</p>
                  <div className="space-y-3">
                    {availableDays.map(day => (
                      <div key={day} className="flex items-center space-x-3 cursor-pointer group" onClick={() => toggleDay(day)}>
                        <Checkbox 
                          checked={selectedDays.has(day)}
                          className="border-[#404040] data-[state=checked]:bg-[#00cc00] data-[state=checked]:border-[#00cc00]"
                        />
                        <span className={`text-sm transition-colors ${selectedDays.has(day) ? 'text-white font-semibold' : 'text-[#a0a0a0] group-hover:text-white'}`}>
                          {day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bouton Tout Sélectionner */}
                <Button 
                  variant="ghost" 
                  onClick={selectAll}
                  className="w-full justify-start px-0 text-[#00cc00] hover:bg-transparent hover:text-[#00ff00] text-xs font-bold"
                >
                  + TOUT SÉLECTIONNER
                </Button>
              </div>
            </div>
          </aside>

          {/* Artists Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredArtists.map((artist) => {
                const isSelected = selectedArtists.has(artist.id);
                return (
                  <div 
                    key={artist.id}
                    onClick={() => toggleArtist(artist.id)}
                    className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'bg-[#00cc00]/10 border-[#00cc00] shadow-[0_0_15px_rgba(0,204,0,0.1)]' 
                        : 'bg-[#2d2d2d] border-[#404040] hover:border-[#505050]'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-[#00cc00] border-[#00cc00]' : 'bg-[#1a1a1a] border-[#404040]'
                    }`}>
                      {isSelected ? (
                        <Check className="w-5 h-5 text-black" />
                      ) : (
                        <span className="text-[#404040] font-bold text-xs group-hover:text-[#606060]">AB</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs sm:text-sm font-medium truncate ${isSelected ? 'text-[#00cc00]' : 'text-white'}`}>
                        {artist.name}
                      </h3>
                      <div className="flex gap-2 text-[10px] text-[#a0a0a0] mt-0.5">
                        <span className="truncate">{artist.day}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Bar */}
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

export default AngryBurgerPage;
