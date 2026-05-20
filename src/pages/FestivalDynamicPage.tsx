// src/pages/FestivalDynamicPage.tsx - VERSION CORRIGÉE
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Check, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/Footer';

interface Artist {
  id: string;
  name: string;
  stage_name: string;
  stage_id: string;
  day_name: string;
  day_id: string;
}

interface Festival {
  id: string;
  name: string;
  year: number;
  location: string;
  description: string;
}

const FestivalDynamicPage = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extraire le slug de l'URL - supporte /festival/:slug et /:slug
  const getSlugFromUrl = () => {
    // Si on a params.slug (route /festival/:slug)
    if (params.slug) return params.slug;
    
    // Sinon, extraire de l'URL directement
    const pathname = location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    // Prendre le dernier segment de l'URL
    return parts[parts.length - 1] || '';
  };

  const slug = getSlugFromUrl();

  const [festival, setFestival] = useState<Festival | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  
  const [showFilters, setShowFilters] = useState(false);

  // Charger le festival et ses données
  useEffect(() => {
    if (slug) {
      console.log('Loading festival with slug:', slug);
      loadFestivalData(slug);
    }
  }, [slug]);

  const loadFestivalData = async (festivalSlug: string) => {
    setLoading(true);

    try {
      console.log('Fetching festival:', festivalSlug);
      
      // 1. Charger le festival
      const { data: festivalData, error: festivalError } = await supabase
        .from('festivals')
        .select('*')
        .eq('slug', festivalSlug)
        .eq('is_active', true)
        .single();

      if (festivalError) {
        console.error('Festival error:', festivalError);
        navigate('/festivals');
        toast.error('Festival non trouvé');
        return;
      }

      if (!festivalData) {
        console.error('No festival data');
        navigate('/festivals');
        toast.error('Festival non trouvé');
        return;
      }

      console.log('Festival found:', festivalData);
      setFestival(festivalData);

      // 2. Charger les artistes avec leurs informations de jour et scène
      const { data: artistsData, error: artistsError } = await supabase
        .from('festival_artists')
        .select(`
          id,
          name,
          stage_id,
          day_id,
          festival_stages!inner(name),
          festival_days!inner(name)
        `)
        .eq('festival_id', festivalData.id)
        .order('order_index');

      if (artistsError) {
        console.error('Artists error:', artistsError);
        toast.error('Erreur lors du chargement des artistes');
        return;
      }

      console.log('Artists loaded:', artistsData?.length || 0);

      // Transformer les données
      const transformedArtists: Artist[] = (artistsData || []).map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        stage_id: artist.stage_id,
        stage_name: artist.festival_stages.name,
        day_id: artist.day_id,
        day_name: artist.festival_days.name,
      }));

      setArtists(transformedArtists);

      // 3. Extraire les jours et scènes uniques
      const uniqueDays = Array.from(new Set(transformedArtists.map(a => a.day_name)));
      const uniqueStages = Array.from(new Set(transformedArtists.map(a => a.stage_name)));
      
      setAvailableDays(uniqueDays);
      setAvailableStages(uniqueStages);

    } catch (error) {
      console.error('Error loading festival:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

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
      const dayMatch = days.size === 0 || days.has(artist.day_name);
      const stageMatch = stages.size === 0 || stages.has(artist.stage_name);
      
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
        eventDate: `${a.day_name} - ${festival?.name} ${festival?.year}`
      }));

    localStorage.setItem('selected_upcoming', JSON.stringify(selectedArray));
    navigate('/generate?mode=upcoming');
  };

  const filteredArtists = artists.filter(artist => {
    const dayMatch = selectedDays.size === 0 || selectedDays.has(artist.day_name);
    const stageMatch = selectedStages.size === 0 || selectedStages.has(artist.stage_name);
    return dayMatch && stageMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#00ff00] text-xl mb-2">Chargement...</div>
          <div className="text-[#a0a0a0] text-sm">Slug: {slug}</div>
        </div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#ff6b6b] text-xl mb-2">Festival non trouvé</div>
          <div className="text-[#a0a0a0] text-sm">Slug recherché: {slug}</div>
          <Button 
            onClick={() => navigate('/festivals')}
            className="mt-4 bg-[#00cc00] hover:bg-[#00ff00] text-black"
          >
            Voir tous les festivals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header />
      
      <main className="pt-20 pb-20 sm:pb-16 max-w-[1400px] mx-auto px-4">
        {/* Header Festival */}
        <div className="bg-[#2d2d2d] border border-[#00cc00] rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#00ff00] mb-2">
            {festival.name.toUpperCase()} {festival.year}
          </h1>
          <p className="text-xs sm:text-sm text-[#a0a0a0]">
            {festival.location} • {artists.length} groupes
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
            bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 
            lg:sticky lg:top-20 lg:h-fit
            ${showFilters ? 'block' : 'hidden lg:block'}
          `}>
            <div className="flex items-center gap-2 mb-4 text-white font-semibold">
              <Filter className="w-4 h-4" />
              Filtres
            </div>
            
            <div className="space-y-6">
              {/* Jours */}
              {availableDays.length > 0 && (
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
              )}

              {/* Scènes */}
              {availableStages.length > 0 && (
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
                        <label htmlFor={`stage-${stage}`} className="text-sm cursor-pointer select-none text-white truncate">
                          {stage}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Grille des Artistes */}
          <div className="space-y-1">
            <div className="text-xs sm:text-sm text-[#a0a0a0] mb-3 font-semibold">
              {filteredArtists.length} groupe{filteredArtists.length > 1 ? 's' : ''} affiché{filteredArtists.length > 1 ? 's' : ''}
            </div>

            {filteredArtists.map((artist) => {
              const isSelected = selectedArtists.has(artist.id);

              return (
                <div
                  key={artist.id}
                  onClick={() => toggleArtist(artist.id)}
                  className={`
                    flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 cursor-pointer transition-colors border-l-2 rounded-r
                    ${isSelected 
                      ? 'bg-[#00cc00]/10 border-[#00cc00]' 
                      : 'bg-[#2d2d2d] border-transparent hover:bg-[#3d3d3d]'}
                  `}
                >
                  <div className={`
                    w-4 h-4 sm:w-5 sm:h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-[#00cc00] border-[#00cc00]' : 'border-[#404040]'}
                  `}>
                    {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs sm:text-sm font-medium truncate ${isSelected ? 'text-[#00ff00]' : 'text-white'}`}>
                      {artist.name}
                    </h3>
                    <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#a0a0a0] mt-0.5">
                      <span className="truncate">{artist.day_name}</span>
                      <span>•</span>
                      <span className="truncate">{artist.stage_name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
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

export default FestivalDynamicPage;
