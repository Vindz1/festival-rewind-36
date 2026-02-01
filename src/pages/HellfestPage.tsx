import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Flame, Check, XCircle } from 'lucide-react'; // Ajout de XCircle
import { toast } from 'sonner';
import { useAuth } from "@/AuthContext";
// IMPORT CRUCIAL : On importe les données statiques
import { HELLFEST_LINEUP, ArtistData } from '@/data/hellfestData';

const HellfestPage = () => {
  const navigate = useNavigate();
  // On charge directement les données importées
  const [artists] = useState<ArtistData[]>(HELLFEST_LINEUP);
   
  // États des filtres
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
   
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());

  // Initialisation des filtres au chargement
  useEffect(() => {
    // On extrait la liste unique des jours et des scènes depuis nos données
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

  // La magie : coche automatiquement les groupes selon les filtres
  const autoSelectArtists = (days: Set<string>, stages: Set<string>) => {
    const newSelection = new Set<string>();
    
    artists.forEach(artist => {
      // Logique : 
      // Si aucun jour coché -> on considère qu'ils sont tous valides
      // Si aucun stage coché -> on considère qu'ils sont tous valides
      const dayMatch = days.size === 0 || days.has(artist.day);
      const stageMatch = stages.size === 0 || stages.has(artist.stage);
      
      // On sélectionne SEULEMENT si au moins un filtre est actif
      if ((days.size > 0 || stages.size > 0) && dayMatch && stageMatch) {
        newSelection.add(artist.id);
      }
    });
    
    // Mise à jour de la sélection
    if (days.size > 0 || stages.size > 0) {
      setSelectedArtists(newSelection);
    }
  };

  // NOUVELLE FONCTION : Tout vider
  const handleClearSelection = () => {
    setSelectedArtists(new Set());
    // Optionnel : Réinitialiser aussi les filtres si on veut repartir de zéro
    // setSelectedDays(new Set());
    // setSelectedStages(new Set());
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
        // On passe l'info "Hellfest 2026" pour que la playlist soit bien nommée plus tard
        eventDate: a.day + " - Hellfest 2026"
      }));

    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArray));
    navigate('/generate?mode=upcoming');
  };

  return (
    <div className="min-h-screen bg-background noise">
      <Header />
       
      <main className="pt-24 pb-16 container px-4 mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl md:text-7xl text-foreground mb-4">
            HELLFEST <span className="text-red-600">2026</span>
          </h1>
          <p className="text-muted-foreground">
            Programmation Officielle
          </p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
             
          {/* Sidebar Filtres */}
          <div className="space-y-8">
            <div className="bg-card border border-border p-6 rounded-xl sticky top-24">
              <div className="flex items-center gap-2 mb-4 text-xl font-display">
                <Filter className="w-5 h-5" />
                Filtres
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
                  <span className="font-bold">{selectedArtists.size} groupes</span>
                </div>
                
                {/* BOUTON TOUT DÉSELECTIONNER */}
                <Button 
                  variant="outline"
                  onClick={handleClearSelection} 
                  className="w-full mb-3 gap-2 text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10"
                  disabled={selectedArtists.size === 0}
                >
                  <XCircle className="w-4 h-4" />
                  Tout désélectionner
                </Button>

                <Button 
                  onClick={handleGenerate} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                  disabled={selectedArtists.size === 0}
                >
                  <Flame className="w-4 h-4" />
                  Créer Playlist
                </Button>
              </div>
            </div>
          </div>

          {/* Grille des Artistes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
            {artists.map((artist, index) => {
              const isSelected = selectedArtists.has(artist.id);
              // On affiche l'artiste SEULEMENT s'il correspond aux filtres actifs
              // Si aucun filtre n'est coché, on affiche tout par défaut
              const showDay = selectedDays.size === 0 || selectedDays.has(artist.day);
              const showStage = selectedStages.size === 0 || selectedStages.has(artist.stage);
               
              if (!showDay || !showStage) return null;

              return (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.005 }} // délai très court pour fluidité
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
                      <h3 className={`font-display text-lg truncate pr-2 ${isSelected ? 'text-red-500' : 'text-foreground'}`}>
                        {artist.name}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">📅 {artist.day}</span>
                        <span className="flex items-center gap-1">📍 {artist.stage}</span>
                      </div>
                    </div>
                    <div className={`
                      w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors
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
      </main>
    </div>
  );
};

export default HellfestPage;
