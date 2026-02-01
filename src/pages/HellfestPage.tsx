import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skull, Filter, ArrowRight, Check, Flame } from 'lucide-react'; // Skull pour l'ambiance Metal
import { toast } from 'sonner';

interface Artist {
  id: string;
  name: string;
  stage: string;
  day: string;
}

const HellfestPage = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les filtres
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());

  // Charger le lineup
  useEffect(() => {
    const fetchLineup = async () => {
      try {
        const res = await fetch('/api/hellfest-lineup');
        const data = await res.json();
        
        if (data.artists) {
          setArtists(data.artists);
          setAvailableDays(data.days || []);
          setAvailableStages(data.stages || []);
          
          // Par défaut, tout sélectionner ou rien ? Commençons par rien.
        }
      } catch (error) {
        toast.error("Impossible de charger le lineup Hellfest");
      } finally {
        setLoading(false);
      }
    };
    fetchLineup();
  }, []);

  // Gestion des filtres Jours
  const toggleDay = (day: string) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(day)) newDays.delete(day);
    else newDays.add(day);
    setSelectedDays(newDays);
    autoSelectArtists(newDays, selectedStages);
  };

  // Gestion des filtres Scènes
  const toggleStage = (stage: string) => {
    const newStages = new Set(selectedStages);
    if (newStages.has(stage)) newStages.delete(stage);
    else newStages.add(stage);
    setSelectedStages(newStages);
    autoSelectArtists(selectedDays, newStages);
  };

  // Fonction intelligente : Sélectionne les artistes selon les filtres actifs
  const autoSelectArtists = (days: Set<string>, stages: Set<string>) => {
    // Si aucun filtre n'est activé, on ne sélectionne rien automatiquement (ou tout, au choix)
    // Ici : Si on coche "Mainstage 1", ça coche tous les artistes de Mainstage 1
    
    const newSelection = new Set<string>();
    
    artists.forEach(artist => {
      const dayMatch = days.size === 0 || days.has(artist.day);
      const stageMatch = stages.size === 0 || stages.has(artist.stage);
      
      // Si les filtres correspondent, on ajoute l'artiste
      if (days.size > 0 && stages.size > 0) {
         if (dayMatch && stageMatch) newSelection.add(artist.id);
      } else if (days.size > 0) {
         if (dayMatch) newSelection.add(artist.id);
      } else if (stages.size > 0) {
         if (stageMatch) newSelection.add(artist.id);
      }
    });
    
    // Si aucun filtre coché, on garde la sélection manuelle précédente ou on vide
    if (days.size === 0 && stages.size === 0) {
        // Optionnel : ne rien faire pour laisser la sélection manuelle
    } else {
        setSelectedArtists(newSelection);
    }
  };

  // Toggle manuel d'un artiste
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

    // On prépare les données pour la page de génération
    // On utilise le même format que "selected_upcoming" pour simuler des concerts futurs
    const selectedArray = artists
      .filter(a => selectedArtists.has(a.id))
      .map(a => ({
        id: a.id,
        artist: a.name, // Le générateur a besoin de ce champ
        eventDate: a.day + " - Hellfest 2026"
      }));

    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArray));
    navigate('/generate?mode=upcoming');
  };

  // Artistes filtrés pour l'affichage (pas pour la sélection)
  // On affiche tout, mais on met en surbrillance ceux qui sont sélectionnés
  const displayedArtists = artists; 

  return (
    <div className="min-h-screen bg-background noise">
      <Header />
      
      <main className="pt-24 pb-16 container px-4 mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl md:text-7xl text-foreground mb-4">
            HELLFEST <span className="text-red-600">2026</span>
          </h1>
          <p className="text-muted-foreground">
            Composez votre programmation idéale
          </p>
        </div>

        {loading ? (
           <div className="flex justify-center py-20"><Flame className="animate-spin w-10 h-10 text-red-600"/></div>
        ) : (
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            
            {/* Sidebar Filtres */}
            <div className="space-y-8">
              <div className="bg-card border border-border p-6 rounded-xl sticky top-24">
                <div className="flex items-center gap-2 mb-4 text-xl font-display">
                  <Filter className="w-5 h-5" />
                  Filtres Rapides
                </div>
                
                <div className="space-y-6">
                  {/* Jours */}
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Jours</h3>
                    <div className="space-y-2">
                      {availableDays.map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`day-${day}`} 
                            checked={selectedDays.has(day)}
                            onCheckedChange={() => toggleDay(day)}
                          />
                          <label htmlFor={`day-${day}`} className="text-sm cursor-pointer select-none">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scènes */}
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Scènes</h3>
                    <div className="space-y-2">
                      {availableStages.map(stage => (
                        <div key={stage} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`stage-${stage}`}
                            checked={selectedStages.has(stage)}
                            onCheckedChange={() => toggleStage(stage)}
                          />
                          <label htmlFor={`stage-${stage}`} className="text-sm cursor-pointer select-none">
                            {stage}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold">{selectedArtists.size} artistes</span>
                  </div>
                  <Button 
                    onClick={handleGenerate} 
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                    disabled={selectedArtists.size === 0}
                  >
                    <Flame className="w-4 h-4" />
                    Générer la Playlist
                  </Button>
                </div>
              </div>
            </div>

            {/* Grille des Artistes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
              {displayedArtists.map((artist, index) => {
                const isSelected = selectedArtists.has(artist.id);
                return (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => toggleArtist(artist.id)}
                    className={`
                      relative p-4 rounded-lg border cursor-pointer group transition-all duration-200
                      ${isSelected 
                        ? 'bg-red-950/20 border-red-600/50' 
                        : 'bg-card border-border hover:border-red-600/30'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-display text-lg ${isSelected ? 'text-red-500' : 'text-foreground'}`}>
                          {artist.name}
                        </h3>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">📅 {artist.day}</span>
                          <span className="flex items-center gap-1">📍 {artist.stage}</span>
                        </div>
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-red-600 border-red-600 text-white' : 'border-muted-foreground/30'}
                      `}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HellfestPage;
