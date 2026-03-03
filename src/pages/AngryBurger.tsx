import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Check, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { ANGRY_BURGER_LINEUP, ArtistData } from '@/data/AngryBurger'; 
import { Footer } from '@/components/Footer';

const AngryBurgerPage = () => {
  const navigate = useNavigate();
  const [artists] = useState<ArtistData[]>(ANGRY_BURGER_LINEUP);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const uniqueDays = Array.from(new Set(artists.map(a => a.day)));
    setAvailableDays(uniqueDays);
  }, [artists]);

  const toggleDay = (day: string) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(day)) newDays.delete(day);
    else newDays.add(day);
    setSelectedDays(newDays);
    
    const newSelection = new Set<string>();
    artists.forEach(artist => {
      if (newDays.has(artist.day)) newSelection.add(artist.id);
    });
    setSelectedArtists(newSelection);
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
        eventDate: a.day + " - Angry Burger Festival 2026"
      }));
    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArray));
    navigate('/generate?mode=upcoming');
  };

  const filteredArtists = artists.filter(artist => 
    selectedDays.size === 0 || selectedDays.has(artist.day)
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header />
      <main className="pt-20 pb-20 max-w-[1400px] mx-auto px-4">
        <div className="bg-[#2d2d2d] border border-orange-500 rounded-xl p-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-orange-500 mb-2 uppercase">
            ANGRY BURGER FESTIVAL 2026
          </h1>
          <p className="text-xs sm:text-sm text-[#a0a0a0]">Line-up Officiel • {artists.length} Groupes</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <aside className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 h-fit sticky top-20">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Filter className="w-4 h-4" /> FILTRES</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#a0a0a0] mb-2 uppercase tracking-wider">Jours</p>
                <div className="flex flex-col gap-2">
                  {availableDays.map(day => (
                    <div key={day} className="flex items-center gap-2 cursor-pointer group" onClick={() => toggleDay(day)}>
                      <Checkbox checked={selectedDays.has(day)} className="border-[#404040] data-[state=checked]:bg-orange-500" />
                      <span className={`text-sm ${selectedDays.has(day) ? 'text-white font-medium' : 'text-[#a0a0a0]'}`}>{day}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleGenerate} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold">CRÉER PLAYLIST</Button>
            </div>
          </aside>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredArtists.map((artist) => {
              const isSelected = selectedArtists.has(artist.id);
              return (
                <div key={artist.id} onClick={() => toggleArtist(artist.id)} 
                     className={`p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-orange-500/10 border-orange-500' : 'bg-[#2d2d2d] border-[#404040] hover:border-[#505050]'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-medium ${isSelected ? 'text-orange-500' : 'text-white'}`}>{artist.name}</h3>
                      <p className="text-[10px] text-[#a0a0a0] uppercase">{artist.day}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AngryBurgerPage;
