import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { HELLFEST_LINEUP, ArtistData } from '@/data/hellfestData';

const HellfestPage = () => {
  const navigate = useNavigate();
  const [artists] = useState<ArtistData[]>(HELLFEST_LINEUP);
   
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
   
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());

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
        eventDate: a.day + " - Hellfest 2026"
      }));

    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArray));
    navigate('/generate?mode=upcoming');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header />
       
      <main className="pt-20 pb-16 max-w-[1400px] mx-auto px-4">
        {/* Hellfest header - Style officiel vert */}
        <div className="bg-[#2d2d2d] border border-[#00cc00] rounded p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#00ff00] mb-2">
            HELLFEST 2026
          </h1>
          <p className="text-sm text-[#a0a0a0]">
            Programmation officielle • {artists.length} groupes
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Filtres */}
          <div className="bg-[#2d2d2d] border border-[#404040] rounded p-4 h-fit sticky top-20">
            <div className="flex items-center gap-2 mb-4 text-white font-semibold">
              <Filter className="w-4 h-4" />
              Filtres
            </div>
             
            <div className="space-y-6">
              {/* Jours */}
              <div>
                <h3 className="text-xs font-semibold text-[#a0a0a0] mb-2 uppercase tracking-wider">Jours</h3>
                <div className="space-y-1.5">
                  {availableDays.map(day => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`day-${day}`} 
                        checked={selectedDays.has(day)}
                        onCheckedChange={() => toggleDay(day)}
                        className="border-[#404040] data-[state=checked]:bg-[#4d94ff] data-[state=checked]:border-[#4d94ff]"
                      />
                      <label htmlFor={`day-${day}`} className="text-sm cursor-pointer select-none text-white">
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scènes */}
              <div>
                <h3 className="text-xs font-semibold text-[#a0a0a0] mb-2 uppercase tracking-wider">Scènes</h3>
                <div className="space-y-1.5">
                  {availableStages.map(stage => (
                    <div key={stage} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`stage-${stage}`}
                        checked={selectedStages.has(stage)}
                        onCheckedChange={() => toggleStage(stage)}
                        className="border-[#404040] data-[state=checked]:bg-[#4d94ff] data-[state=checked]:border-[#4d94ff]"
                      />
                      <label htmlFor={`stage-${stage}`} className="text-sm cursor-pointer select-none text-white">
                        {stage}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#404040]">
              <div className="text-sm text-white font-semibold mb-3">
                {selectedArtists.size} groupe{selectedArtists.size > 1 ? 's' : ''}
              </div>
              
              <Button 
                variant="outline"
                onClick={handleClearSelection} 
                className="w-full mb-2 text-xs border-[#404040] text-[#a0a0a0] hover:bg-[#3d3d3d] hover:text-white"
                disabled={selectedArtists.size === 0}
              >
                <XCircle className="w-3 h-3 mr-1.5" />
                Tout désélectionner
              </Button>

              <Button 
                onClick={handleGenerate} 
                className="w-full bg-[#00cc00] hover:bg-[#00ff00] text-black font-semibold"
                disabled={selectedArtists.size === 0}
              >
                Créer Playlist
              </Button>
            </div>
          </div>

          {/* Grille des Artistes - Table style */}
          <div className="space-y-1">
            {artists.map((artist) => {
              const isSelected = selectedArtists.has(artist.id);
              const showDay = selectedDays.size === 0 || selectedDays.has(artist.day);
              const showStage = selectedStages.size === 0 || selectedStages.has(artist.stage);
               
              if (!showDay || !showStage) return null;

              return (
                <div
                  key={artist.id}
                  onClick={() => toggleArtist(artist.id)}
                  className={`
                    flex items-center gap-3 p-3 cursor-pointer transition-colors border-l-2
                    ${isSelected 
                      ? 'bg-[#00cc00]/10 border-[#00cc00]' 
                      : 'bg-[#2d2d2d] border-transparent hover:bg-[#3d3d3d]'}
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-[#00cc00] border-[#00cc00]' : 'border-[#404040]'}
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-black" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-[#00ff00]' : 'text-white'}`}>
                      {artist.name}
                    </h3>
                    <div className="flex gap-3 text-xs text-[#a0a0a0] mt-0.5">
                      <span>{artist.day}</span>
                      <span>•</span>
                      <span>{artist.stage}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HellfestPage;
