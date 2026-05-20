// src/pages/AdminFestivals.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Music, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Festival {
  id: string;
  name: string;
  slug: string;
  year: number;
  location: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  order_index: number;
  latitude?: number;
  longitude?: number;
  genres?: string[];
  headliners?: string[];
}

interface FestivalDay {
  id: string;
  festival_id: string;
  name: string;
  date: string;
  order_index: number;
}

interface FestivalStage {
  id: string;
  festival_id: string;
  name: string;
  order_index: number;
}

interface FestivalArtist {
  id: string;
  festival_id: string;
  stage_id: string;
  day_id: string;
  name: string;
  order_index: number;
  notes: string;
}

const AdminFestivals = () => {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [days, setDays] = useState<FestivalDay[]>([]);
  const [stages, setStages] = useState<FestivalStage[]>([]);
  const [artists, setArtists] = useState<FestivalArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // États pour les formulaires
  const [newFestival, setNewFestival] = useState({
    name: '',
    slug: '',
    year: new Date().getFullYear(),
    location: '',
    description: '',
    image_url: '',
    start_date: '',
    end_date: '',
    is_active: true,
    order_index: 0,
    latitude: '',
    longitude: '',
    genres: '',
    headliners: ''
  });

  // Charger les festivals
  useEffect(() => {
    loadFestivals();
  }, []);

  // Charger les détails quand un festival est sélectionné
  useEffect(() => {
    if (selectedFestival) {
      loadFestivalDetails(selectedFestival.id);
    }
  }, [selectedFestival]);

  const loadFestivals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('festivals')
      .select('*')
      .order('order_index');

    if (error) {
      toast.error('Erreur lors du chargement des festivals');
      console.error(error);
    } else {
      setFestivals(data || []);
    }
    setLoading(false);
  };

  const loadFestivalDetails = async (festivalId: string) => {
    // Charger les jours
    const { data: daysData } = await supabase
      .from('festival_days')
      .select('*')
      .eq('festival_id', festivalId)
      .order('order_index');
    setDays(daysData || []);

    // Charger les scènes
    const { data: stagesData } = await supabase
      .from('festival_stages')
      .select('*')
      .eq('festival_id', festivalId)
      .order('order_index');
    setStages(stagesData || []);

    // Charger les artistes
    const { data: artistsData } = await supabase
      .from('festival_artists')
      .select('*')
      .eq('festival_id', festivalId)
      .order('order_index');
    setArtists(artistsData || []);
  };

  const resetForm = () => {
    setNewFestival({
      name: '',
      slug: '',
      year: new Date().getFullYear(),
      location: '',
      description: '',
      image_url: '',
      start_date: '',
      end_date: '',
      is_active: true,
      order_index: 0,
      latitude: '',
      longitude: '',
      genres: '',
      headliners: ''
    });
    setIsEditMode(false);
  };

  const createFestival = async () => {
    // Préparer les données avec les arrays
    const festivalData = {
      ...newFestival,
      latitude: newFestival.latitude ? parseFloat(newFestival.latitude) : null,
      longitude: newFestival.longitude ? parseFloat(newFestival.longitude) : null,
      genres: newFestival.genres ? newFestival.genres.split(',').map(g => g.trim()) : [],
      headliners: newFestival.headliners ? newFestival.headliners.split(',').map(h => h.trim()) : []
    };

    if (isEditMode && selectedFestival) {
      // Mode édition
      const { error } = await supabase
        .from('festivals')
        .update(festivalData)
        .eq('id', selectedFestival.id);

      if (error) {
        toast.error('Erreur lors de la mise à jour du festival');
        console.error(error);
      } else {
        toast.success('Festival mis à jour avec succès !');
        loadFestivals();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      // Mode création
      const { error } = await supabase
        .from('festivals')
        .insert(festivalData);

      if (error) {
        toast.error('Erreur lors de la création du festival');
        console.error(error);
      } else {
        toast.success('Festival créé avec succès !');
        loadFestivals();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const editFestival = (festival: Festival) => {
    setIsEditMode(true);
    setSelectedFestival(festival);
    setNewFestival({
      name: festival.name,
      slug: festival.slug,
      year: festival.year,
      location: festival.location,
      description: festival.description,
      image_url: festival.image_url,
      start_date: festival.start_date,
      end_date: festival.end_date,
      is_active: festival.is_active,
      order_index: festival.order_index,
      latitude: festival.latitude?.toString() || '',
      longitude: festival.longitude?.toString() || '',
      genres: festival.genres?.join(', ') || '',
      headliners: festival.headliners?.join(', ') || ''
    });
    setIsDialogOpen(true);
  };

  const deleteFestival = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce festival ? Toutes les données associées seront supprimées.')) {
      return;
    }

    const { error } = await supabase
      .from('festivals')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    } else {
      toast.success('Festival supprimé');
      loadFestivals();
      if (selectedFestival?.id === id) {
        setSelectedFestival(null);
      }
    }
  };

  const toggleFestivalActive = async (festival: Festival) => {
    const { error } = await supabase
      .from('festivals')
      .update({ is_active: !festival.is_active })
      .eq('id', festival.id);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      toast.success(festival.is_active ? 'Festival masqué' : 'Festival affiché');
      loadFestivals();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      <main className="pt-20 pb-20 max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-[#00ff00] rounded-2xl p-6 mb-6 shadow-[0_0_30px_rgba(0,255,0,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black italic uppercase mb-2">
                🎸 ADMIN <span className="text-[#00ff00]">FESTIVALS</span>
              </h1>
              <p className="text-sm text-gray-400">
                Gérez vos festivals, coordonnées GPS, headliners et genres
              </p>
            </div>

            {/* Bouton Nouveau Festival */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  className="bg-gradient-to-r from-[#00cc00] to-[#00ff00] hover:from-[#00ff00] hover:to-[#00cc00] text-black font-bold shadow-lg shadow-green-500/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Festival
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-[#00ff00] text-2xl font-bold">
                    {isEditMode ? '✏️ Modifier le festival' : '➕ Créer un nouveau festival'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Remplissez toutes les informations du festival
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {/* Nom & Slug */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Nom du festival *</label>
                      <Input
                        value={newFestival.name}
                        onChange={(e) => setNewFestival({ ...newFestival, name: e.target.value })}
                        placeholder="Hellfest"
                        className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Slug (URL) *</label>
                      <Input
                        value={newFestival.slug}
                        onChange={(e) => setNewFestival({ ...newFestival, slug: e.target.value })}
                        placeholder="hellfest-2026"
                        className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                      />
                    </div>
                  </div>

                  {/* Année & Lieu */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Année *</label>
                      <Input
                        type="number"
                        value={newFestival.year}
                        onChange={(e) => setNewFestival({ ...newFestival, year: parseInt(e.target.value) })}
                        className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Lieu *</label>
                      <Input
                        value={newFestival.location}
                        onChange={(e) => setNewFestival({ ...newFestival, location: e.target.value })}
                        placeholder="Clisson, France"
                        className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                      />
                    </div>
                  </div>

                  {/* NOUVEAUTÉ: Coordonnées GPS */}
                  <div className="bg-[#00ff00]/5 border border-[#00ff00]/30 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-[#00ff00] mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      📍 Coordonnées GPS (pour la carte)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Latitude</label>
                        <Input
                          type="number"
                          step="any"
                          value={newFestival.latitude}
                          onChange={(e) => setNewFestival({ ...newFestival, latitude: e.target.value })}
                          placeholder="47.0867"
                          className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Longitude</label>
                        <Input
                          type="number"
                          step="any"
                          value={newFestival.longitude}
                          onChange={(e) => setNewFestival({ ...newFestival, longitude: e.target.value })}
                          placeholder="-1.2806"
                          className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Trouvez les coordonnées sur <a href="https://maps.google.com" target="_blank" className="text-[#00ff00] underline">Google Maps</a> (clic droit → copier les coordonnées)
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Date de début *</label>
                      <Input
                        type="date"
                        value={newFestival.start_date}
                        onChange={(e) => setNewFestival({ ...newFestival, start_date: e.target.value })}
                        className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Date de fin *</label>
                      <Input
                        type="date"
                        value={newFestival.end_date}
                        onChange={(e) => setNewFestival({ ...newFestival, end_date: e.target.value })}
                        className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                      />
                    </div>
                  </div>

                  {/* NOUVEAUTÉ: Genres */}
                  <div className="bg-[#4d94ff]/5 border border-[#4d94ff]/30 rounded-xl p-4">
                    <label className="text-sm font-bold text-[#4d94ff] mb-2 block flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      🎸 Genres musicaux
                    </label>
                    <Input
                      value={newFestival.genres}
                      onChange={(e) => setNewFestival({ ...newFestival, genres: e.target.value })}
                      placeholder="Metal, Hard Rock, Punk"
                      className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#4d94ff]"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Séparez les genres par des virgules
                    </p>
                  </div>

                  {/* NOUVEAUTÉ: Headliners */}
                  <div className="bg-[#ff6b6b]/5 border border-[#ff6b6b]/30 rounded-xl p-4">
                    <label className="text-sm font-bold text-[#ff6b6b] mb-2 block flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      🎤 Headliners
                    </label>
                    <Textarea
                      value={newFestival.headliners}
                      onChange={(e) => setNewFestival({ ...newFestival, headliners: e.target.value })}
                      placeholder="Iron Maiden, Bring Me The Horizon, Limp Bizkit"
                      className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#ff6b6b] min-h-[80px]"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Listez les artistes principaux séparés par des virgules
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-bold text-gray-300 mb-2 block">Description</label>
                    <Textarea
                      value={newFestival.description}
                      onChange={(e) => setNewFestival({ ...newFestival, description: e.target.value })}
                      placeholder="Description du festival..."
                      className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                      rows={3}
                    />
                  </div>

                  {/* URL Image */}
                  <div>
                    <label className="text-sm font-bold text-gray-300 mb-2 block">URL de l'image</label>
                    <Input
                      value={newFestival.image_url}
                      onChange={(e) => setNewFestival({ ...newFestival, image_url: e.target.value })}
                      placeholder="https://..."
                      className="bg-[#0a0a0a] border-[#333] text-white focus:border-[#00ff00]"
                    />
                  </div>

                  {/* Checkbox Actif */}
                  <div className="flex items-center space-x-2 p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
                    <Checkbox
                      id="is_active"
                      checked={newFestival.is_active}
                      onCheckedChange={(checked) => setNewFestival({ ...newFestival, is_active: checked as boolean })}
                      className="border-[#333] data-[state=checked]:bg-[#00cc00] data-[state=checked]:border-[#00cc00]"
                    />
                    <label htmlFor="is_active" className="text-sm text-white cursor-pointer flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#00ff00]" />
                      Festival actif (visible sur le site public)
                    </label>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={createFestival} 
                      className="flex-1 bg-gradient-to-r from-[#00cc00] to-[#00ff00] hover:from-[#00ff00] hover:to-[#00cc00] text-black font-bold h-12"
                    >
                      {isEditMode ? '💾 Mettre à jour' : '✨ Créer le festival'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      variant="outline"
                      className="border-[#333] text-gray-400 hover:bg-[#2d2d2d] h-12 px-8"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Liste des festivals */}
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          
          {/* Sidebar - Liste des festivals */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Chargement...</div>
            ) : festivals.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-[#1a1a1a] rounded-xl border border-[#333]">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun festival. Créez-en un !</p>
              </div>
            ) : (
              festivals.map((festival) => (
                <Card
                  key={festival.id}
                  className={`cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedFestival?.id === festival.id
                      ? 'bg-[#00ff00]/10 border-2 border-[#00ff00] shadow-[0_0_20px_rgba(0,255,0,0.3)]'
                      : 'bg-[#1a1a1a] border-2 border-[#333] hover:border-[#00ff00]/50'
                  }`}
                  onClick={() => setSelectedFestival(festival)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className={`text-lg font-black ${selectedFestival?.id === festival.id ? 'text-[#00ff00]' : 'text-white'}`}>
                          {festival.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {festival.year} • {festival.location}
                        </CardDescription>
                        
                        {/* Affichage des genres */}
                        {festival.genres && festival.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {festival.genres.slice(0, 3).map((genre, i) => (
                              <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-[#4d94ff]/20 text-[#4d94ff] border border-[#4d94ff]/30">
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {festival.is_active ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]/50 font-bold flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            LIVE
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/50">
                            Masqué
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>

          {/* Détails du festival sélectionné */}
          {selectedFestival ? (
            <div className="space-y-6">
              {/* Carte d'infos principale style HELLFEST */}
              <Card className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-[#333] overflow-hidden">
                <CardHeader className="relative">
                  {selectedFestival.is_active && (
                    <div className="absolute top-4 right-4 bg-[#00ff00] text-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg">
                      <Zap className="w-3 h-3" />
                      LIVE
                    </div>
                  )}
                  
                  <CardTitle className="text-3xl font-black italic uppercase text-white mb-2">
                    {selectedFestival.name}
                  </CardTitle>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedFestival.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(selectedFestival.start_date)} - {formatDate(selectedFestival.end_date)}
                      </span>
                    </div>
                    
                    {/* Affichage coordonnées GPS */}
                    {selectedFestival.latitude && selectedFestival.longitude && (
                      <div className="flex items-center gap-2 text-[#00ff00] text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>
                          GPS: {selectedFestival.latitude.toFixed(4)}, {selectedFestival.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  {selectedFestival.genres && selectedFestival.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedFestival.genres.map((genre, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1.5 rounded-full bg-[#4d94ff]/20 text-[#4d94ff] border border-[#4d94ff]/50 text-sm font-bold"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Headliners */}
                  {selectedFestival.headliners && selectedFestival.headliners.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#333]">
                      <p className="text-xs text-gray-500 mb-2">Headliners :</p>
                      <p className="text-base font-bold text-white leading-relaxed">
                        {selectedFestival.headliners.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {selectedFestival.description && (
                    <CardDescription className="text-gray-400 mt-4">
                      {selectedFestival.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => editFestival(selectedFestival)}
                      className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    
                    <Button
                      onClick={() => toggleFestivalActive(selectedFestival)}
                      variant="outline"
                      className="border-[#333] text-white hover:bg-[#2d2d2d]"
                    >
                      {selectedFestival.is_active ? 'Masquer' : 'Afficher'}
                    </Button>
                    
                    <Button
                      onClick={() => deleteFestival(selectedFestival.id)}
                      variant="outline"
                      className="border-[#ff6b6b] text-[#ff6b6b] hover:bg-[#ff6b6b]/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Onglets : Jours / Scènes / Artistes */}
              <Tabs defaultValue="days" className="w-full">
                <TabsList className="bg-[#1a1a1a] border border-[#333] p-1">
                  <TabsTrigger 
                    value="days" 
                    className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black font-bold"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Jours ({days.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stages" 
                    className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black font-bold"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Scènes ({stages.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="artists" 
                    className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black font-bold"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Artistes ({artists.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="days" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333]">
                    <CardHeader>
                      <CardTitle className="text-white">Jours du festival</CardTitle>
                      <CardDescription className="text-gray-400">
                        Gérez les jours de votre festival
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {days.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">Aucun jour configuré</p>
                      ) : (
                        <div className="space-y-2">
                          {days.map(day => (
                            <div key={day.id} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#333]">
                              <span className="text-white font-bold">{day.name}</span>
                              <span className="text-gray-400 text-sm">{formatDate(day.date)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stages" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333]">
                    <CardHeader>
                      <CardTitle className="text-white">Scènes du festival</CardTitle>
                      <CardDescription className="text-gray-400">
                        Gérez les scènes de votre festival
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stages.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">Aucune scène configurée</p>
                      ) : (
                        <div className="space-y-2">
                          {stages.map(stage => (
                            <div key={stage.id} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#333]">
                              <span className="text-white font-bold">{stage.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="artists" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333]">
                    <CardHeader>
                      <CardTitle className="text-white">Artistes du festival</CardTitle>
                      <CardDescription className="text-gray-400">
                        Total: {artists.length} artistes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {artists.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">Aucun artiste</p>
                      ) : (
                        <div className="max-h-96 overflow-y-auto space-y-1">
                          {artists.map(artist => (
                            <div key={artist.id} className="flex items-center justify-between p-2 hover:bg-[#0a0a0a] rounded text-sm border border-transparent hover:border-[#333]">
                              <span className="text-white">{artist.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-[#1a1a1a] rounded-2xl border-2 border-[#333]">
              <div className="text-center text-gray-400">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Sélectionnez un festival pour voir les détails</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminFestivals;
