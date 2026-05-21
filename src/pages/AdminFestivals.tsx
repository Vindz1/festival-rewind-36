// src/pages/AdminFestivals.tsx - VERSION COMPLÈTE
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Music, Zap, Clock } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  start_time?: string;
  end_time?: string;
  order_index: number;
  notes?: string;
}

const AdminFestivals = () => {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [days, setDays] = useState<FestivalDay[]>([]);
  const [stages, setStages] = useState<FestivalStage[]>([]);
  const [artists, setArtists] = useState<FestivalArtist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs states
  const [isFestivalDialogOpen, setIsFestivalDialogOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isArtistDialogOpen, setIsArtistDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Formulaires
  const [newFestival, setNewFestival] = useState({
    name: '', slug: '', year: new Date().getFullYear(), location: '', description: '',
    image_url: '', start_date: '', end_date: '', is_active: true, order_index: 0,
    latitude: '', longitude: '', genres: '', headliners: ''
  });

  const [newDay, setNewDay] = useState({ name: '', date: '', order_index: 0 });
  const [editingDay, setEditingDay] = useState<FestivalDay | null>(null);

  const [newStage, setNewStage] = useState({ name: '', order_index: 0 });
  const [editingStage, setEditingStage] = useState<FestivalStage | null>(null);

  const [newArtist, setNewArtist] = useState({
    name: '', day_id: '', stage_id: '', start_time: '', end_time: '', order_index: 0, notes: ''
  });
  const [editingArtist, setEditingArtist] = useState<FestivalArtist | null>(null);

  useEffect(() => {
    loadFestivals();
  }, []);

  useEffect(() => {
    if (selectedFestival) {
      loadFestivalDetails(selectedFestival.id);
    }
  }, [selectedFestival]);

  // 🆕 LOGIQUE AUTOMATIQUE : Déterminer si un festival est terminé
  const isFestivalPast = (endDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Minuit aujourd'hui
    const festivalEnd = new Date(endDate);
    festivalEnd.setHours(23, 59, 59, 999); // Fin de journée du festival
    return festivalEnd < today;
  };

  const loadFestivals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('festivals').select('*').order('order_index');
    if (error) {
      toast.error('Erreur lors du chargement des festivals');
      console.error(error);
    } else {
      setFestivals(data || []);
    }
    setLoading(false);
  };

  const loadFestivalDetails = async (festivalId: string) => {
    const { data: daysData } = await supabase.from('festival_days').select('*').eq('festival_id', festivalId).order('order_index');
    setDays(daysData || []);

    const { data: stagesData } = await supabase.from('festival_stages').select('*').eq('festival_id', festivalId).order('order_index');
    setStages(stagesData || []);

    const { data: artistsData } = await supabase.from('festival_artists').select('*').eq('festival_id', festivalId).order('order_index');
    setArtists(artistsData || []);
  };

  // ============ FESTIVALS ============
  const createOrUpdateFestival = async () => {
    const festivalData = {
      ...newFestival,
      latitude: newFestival.latitude ? parseFloat(newFestival.latitude) : null,
      longitude: newFestival.longitude ? parseFloat(newFestival.longitude) : null,
      genres: newFestival.genres ? newFestival.genres.split(',').map(g => g.trim()) : [],
      headliners: newFestival.headliners ? newFestival.headliners.split(',').map(h => h.trim()) : []
    };

    if (isEditMode && selectedFestival) {
      const { error } = await supabase.from('festivals').update(festivalData).eq('id', selectedFestival.id);
      if (error) {
        toast.error('Erreur lors de la mise à jour');
        console.error(error);
      } else {
        toast.success('Festival mis à jour !');
        loadFestivals();
        setIsFestivalDialogOpen(false);
        resetFestivalForm();
      }
    } else {
      const { error } = await supabase.from('festivals').insert(festivalData);
      if (error) {
        toast.error('Erreur lors de la création');
        console.error(error);
      } else {
        toast.success('Festival créé !');
        loadFestivals();
        setIsFestivalDialogOpen(false);
        resetFestivalForm();
      }
    }
  };

  const resetFestivalForm = () => {
    setNewFestival({
      name: '', slug: '', year: new Date().getFullYear(), location: '', description: '',
      image_url: '', start_date: '', end_date: '', is_active: true, order_index: 0,
      latitude: '', longitude: '', genres: '', headliners: ''
    });
    setIsEditMode(false);
  };

  const editFestival = (festival: Festival) => {
    setIsEditMode(true);
    setSelectedFestival(festival);
    setNewFestival({
      name: festival.name, slug: festival.slug, year: festival.year, location: festival.location,
      description: festival.description, image_url: festival.image_url,
      start_date: festival.start_date, end_date: festival.end_date,
      is_active: festival.is_active, order_index: festival.order_index,
      latitude: festival.latitude?.toString() || '', longitude: festival.longitude?.toString() || '',
      genres: festival.genres?.join(', ') || '', headliners: festival.headliners?.join(', ') || ''
    });
    setIsFestivalDialogOpen(true);
  };

  const deleteFestival = async (id: string) => {
    if (!confirm('Supprimer ce festival et toutes ses données ?')) return;
    const { error } = await supabase.from('festivals').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    } else {
      toast.success('Festival supprimé');
      loadFestivals();
      if (selectedFestival?.id === id) setSelectedFestival(null);
    }
  };

  const toggleFestivalActive = async (festival: Festival) => {
    const { error } = await supabase.from('festivals').update({ is_active: !festival.is_active }).eq('id', festival.id);
    if (error) {
      toast.error('Erreur');
    } else {
      toast.success(festival.is_active ? 'Festival masqué' : 'Festival affiché');
      loadFestivals();
    }
  };

  // ============ JOURS ============
  const createOrUpdateDay = async () => {
    if (!selectedFestival) return;
    const dayData = { ...newDay, festival_id: selectedFestival.id };

    if (editingDay) {
      const { error } = await supabase.from('festival_days').update(dayData).eq('id', editingDay.id);
      if (error) {
        toast.error('Erreur mise à jour jour');
        console.error(error);
      } else {
        toast.success('Jour mis à jour !');
        loadFestivalDetails(selectedFestival.id);
        setIsDayDialogOpen(false);
        resetDayForm();
      }
    } else {
      const { error } = await supabase.from('festival_days').insert(dayData);
      if (error) {
        toast.error('Erreur création jour');
        console.error(error);
      } else {
        toast.success('Jour créé !');
        loadFestivalDetails(selectedFestival.id);
        setIsDayDialogOpen(false);
        resetDayForm();
      }
    }
  };

  const resetDayForm = () => {
    setNewDay({ name: '', date: '', order_index: 0 });
    setEditingDay(null);
  };

  const editDay = (day: FestivalDay) => {
    setEditingDay(day);
    setNewDay({ name: day.name, date: day.date, order_index: day.order_index });
    setIsDayDialogOpen(true);
  };

  const deleteDay = async (id: string) => {
    if (!confirm('Supprimer ce jour ?')) return;
    const { error } = await supabase.from('festival_days').delete().eq('id', id);
    if (error) {
      toast.error('Erreur suppression jour');
      console.error(error);
    } else {
      toast.success('Jour supprimé');
      if (selectedFestival) loadFestivalDetails(selectedFestival.id);
    }
  };

  // ============ SCÈNES ============
  const createOrUpdateStage = async () => {
    if (!selectedFestival) return;
    const stageData = { ...newStage, festival_id: selectedFestival.id };

    if (editingStage) {
      const { error } = await supabase.from('festival_stages').update(stageData).eq('id', editingStage.id);
      if (error) {
        toast.error('Erreur mise à jour scène');
        console.error(error);
      } else {
        toast.success('Scène mise à jour !');
        loadFestivalDetails(selectedFestival.id);
        setIsStageDialogOpen(false);
        resetStageForm();
      }
    } else {
      const { error } = await supabase.from('festival_stages').insert(stageData);
      if (error) {
        toast.error('Erreur création scène');
        console.error(error);
      } else {
        toast.success('Scène créée !');
        loadFestivalDetails(selectedFestival.id);
        setIsStageDialogOpen(false);
        resetStageForm();
      }
    }
  };

  const resetStageForm = () => {
    setNewStage({ name: '', order_index: 0 });
    setEditingStage(null);
  };

  const editStage = (stage: FestivalStage) => {
    setEditingStage(stage);
    setNewStage({ name: stage.name, order_index: stage.order_index });
    setIsStageDialogOpen(true);
  };

  const deleteStage = async (id: string) => {
    if (!confirm('Supprimer cette scène ?')) return;
    const { error } = await supabase.from('festival_stages').delete().eq('id', id);
    if (error) {
      toast.error('Erreur suppression scène');
      console.error(error);
    } else {
      toast.success('Scène supprimée');
      if (selectedFestival) loadFestivalDetails(selectedFestival.id);
    }
  };

  // ============ ARTISTES ============
  const createOrUpdateArtist = async () => {
    if (!selectedFestival) return;
    const artistData = {
      name: newArtist.name,
      festival_id: selectedFestival.id,
      day_id: newArtist.day_id,
      stage_id: newArtist.stage_id,
      start_time: newArtist.start_time || null,
      end_time: newArtist.end_time || null,
      order_index: newArtist.order_index,
      notes: newArtist.notes || null
    };

    if (editingArtist) {
      const { error } = await supabase.from('festival_artists').update(artistData).eq('id', editingArtist.id);
      if (error) {
        toast.error('Erreur mise à jour artiste');
        console.error(error);
      } else {
        toast.success('Artiste mis à jour !');
        loadFestivalDetails(selectedFestival.id);
        setIsArtistDialogOpen(false);
        resetArtistForm();
      }
    } else {
      const { error } = await supabase.from('festival_artists').insert(artistData);
      if (error) {
        toast.error('Erreur création artiste');
        console.error(error);
      } else {
        toast.success('Artiste ajouté !');
        loadFestivalDetails(selectedFestival.id);
        setIsArtistDialogOpen(false);
        resetArtistForm();
      }
    }
  };

  const resetArtistForm = () => {
    setNewArtist({ name: '', day_id: '', stage_id: '', start_time: '', end_time: '', order_index: 0, notes: '' });
    setEditingArtist(null);
  };

  const editArtist = (artist: FestivalArtist) => {
    setEditingArtist(artist);
    setNewArtist({
      name: artist.name,
      day_id: artist.day_id,
      stage_id: artist.stage_id,
      start_time: artist.start_time || '',
      end_time: artist.end_time || '',
      order_index: artist.order_index,
      notes: artist.notes || ''
    });
    setIsArtistDialogOpen(true);
  };

  const deleteArtist = async (id: string) => {
    if (!confirm('Supprimer cet artiste ?')) return;
    const { error } = await supabase.from('festival_artists').delete().eq('id', id);
    if (error) {
      toast.error('Erreur suppression artiste');
      console.error(error);
    } else {
      toast.success('Artiste supprimé');
      if (selectedFestival) loadFestivalDetails(selectedFestival.id);
    }
  };

  // ============ HELPERS ============
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDayName = (dayId: string) => days.find(d => d.id === dayId)?.name || '';
  const getStageName = (stageId: string) => stages.find(s => s.id === stageId)?.name || '';

  // Organiser artistes par jour et scène
  const artistsByDayAndStage = days.map(day => ({
    day,
    stages: stages.map(stage => ({
      stage,
      artists: artists.filter(a => a.day_id === day.id && a.stage_id === stage.id).sort((a, b) => a.order_index - b.order_index)
    }))
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      <main className="pt-20 pb-20 max-w-[1600px] mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-[#00ff00] rounded-2xl p-6 mb-6 shadow-[0_0_30px_rgba(0,255,0,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black italic uppercase mb-2">
                🎸 ADMIN <span className="text-[#00ff00]">FESTIVALS</span>
              </h1>
              <p className="text-sm text-gray-400">
                Gestion complète : festivals, jours, scènes, artistes et horaires
              </p>
            </div>

            <Dialog open={isFestivalDialogOpen} onOpenChange={setIsFestivalDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => { resetFestivalForm(); setIsFestivalDialogOpen(true); }}
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
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Nom *</label>
                      <Input value={newFestival.name} onChange={(e) => setNewFestival({ ...newFestival, name: e.target.value })} placeholder="Hellfest" className="bg-[#0a0a0a] border-[#333] text-white" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Slug *</label>
                      <Input value={newFestival.slug} onChange={(e) => setNewFestival({ ...newFestival, slug: e.target.value })} placeholder="hellfest-2026" className="bg-[#0a0a0a] border-[#333] text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Année *</label>
                      <Input type="number" value={newFestival.year} onChange={(e) => setNewFestival({ ...newFestival, year: parseInt(e.target.value) })} className="bg-[#0a0a0a] border-[#333] text-white" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Lieu *</label>
                      <Input value={newFestival.location} onChange={(e) => setNewFestival({ ...newFestival, location: e.target.value })} placeholder="Clisson, France" className="bg-[#0a0a0a] border-[#333] text-white" />
                    </div>
                  </div>

                  <div className="bg-[#00ff00]/5 border border-[#00ff00]/30 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-[#00ff00] mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> 📍 GPS
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="number" step="any" value={newFestival.latitude} onChange={(e) => setNewFestival({ ...newFestival, latitude: e.target.value })} placeholder="47.0867" className="bg-[#0a0a0a] border-[#333] text-white" />
                      <Input type="number" step="any" value={newFestival.longitude} onChange={(e) => setNewFestival({ ...newFestival, longitude: e.target.value })} placeholder="-1.2806" className="bg-[#0a0a0a] border-[#333] text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Date début *</label>
                      <Input type="date" value={newFestival.start_date} onChange={(e) => setNewFestival({ ...newFestival, start_date: e.target.value })} className="bg-[#0a0a0a] border-[#333] text-white" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-300 mb-2 block">Date fin *</label>
                      <Input type="date" value={newFestival.end_date} onChange={(e) => setNewFestival({ ...newFestival, end_date: e.target.value })} className="bg-[#0a0a0a] border-[#333] text-white" />
                    </div>
                  </div>

                  <div className="bg-[#4d94ff]/5 border border-[#4d94ff]/30 rounded-xl p-4">
                    <label className="text-sm font-bold text-[#4d94ff] mb-2 block">🎸 Genres</label>
                    <Input value={newFestival.genres} onChange={(e) => setNewFestival({ ...newFestival, genres: e.target.value })} placeholder="Metal, Hard Rock, Punk" className="bg-[#0a0a0a] border-[#333] text-white" />
                  </div>

                  <div className="bg-[#ff6b6b]/5 border border-[#ff6b6b]/30 rounded-xl p-4">
                    <label className="text-sm font-bold text-[#ff6b6b] mb-2 block">🎤 Headliners</label>
                    <Textarea value={newFestival.headliners} onChange={(e) => setNewFestival({ ...newFestival, headliners: e.target.value })} placeholder="Iron Maiden, Metallica" className="bg-[#0a0a0a] border-[#333] text-white" rows={3} />
                  </div>

                  <Textarea value={newFestival.description} onChange={(e) => setNewFestival({ ...newFestival, description: e.target.value })} placeholder="Description..." className="bg-[#0a0a0a] border-[#333] text-white" rows={3} />

                  <Input value={newFestival.image_url} onChange={(e) => setNewFestival({ ...newFestival, image_url: e.target.value })} placeholder="https://..." className="bg-[#0a0a0a] border-[#333] text-white" />

                  <div className="flex items-center space-x-2 p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
                    <Checkbox id="is_active" checked={newFestival.is_active} onCheckedChange={(checked) => setNewFestival({ ...newFestival, is_active: checked as boolean })} />
                    <label htmlFor="is_active" className="text-sm cursor-pointer flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#00ff00]" /> Festival actif
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={createOrUpdateFestival} className="flex-1 bg-gradient-to-r from-[#00cc00] to-[#00ff00] text-black font-bold">
                      {isEditMode ? '💾 Mettre à jour' : '✨ Créer'}
                    </Button>
                    <Button onClick={() => { setIsFestivalDialogOpen(false); resetFestivalForm(); }} variant="outline" className="border-[#333]">
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* SIDEBAR - Liste festivals */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Chargement...</div>
            ) : festivals.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-[#1a1a1a] rounded-xl border border-[#333]">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun festival</p>
              </div>
            ) : (
              festivals.map((festival) => (
                <Card
                  key={festival.id}
                  className={`cursor-pointer transition-all ${
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
                        <CardDescription className="text-xs text-gray-400 mt-1">
                          {festival.year} • {festival.location}
                        </CardDescription>
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
                      {festival.is_active && (
                        isFestivalPast(festival.end_date) ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-600/20 text-gray-400 border border-gray-600/50 font-bold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> TERMINÉ
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]/50 font-bold flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" /> LIVE
                          </span>
                        )
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>

          {/* DÉTAILS */}
          {selectedFestival ? (
            <div className="space-y-6">
              {/* Carte info */}
              <Card className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-[#333]">
                <CardHeader className="relative">
                  {selectedFestival.is_active && (
                    isFestivalPast(selectedFestival.end_date) ? (
                      <div className="absolute top-4 right-4 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> TERMINÉ
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 bg-[#00ff00] text-black px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> LIVE
                      </div>
                    )
                  )}
                  
                  <CardTitle className="text-3xl font-black italic uppercase text-white mb-2">
                    {selectedFestival.name}
                  </CardTitle>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4" /> {selectedFestival.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedFestival.start_date)} - {formatDate(selectedFestival.end_date)}
                    </div>
                    {selectedFestival.latitude && selectedFestival.longitude && (
                      <div className="flex items-center gap-2 text-[#00ff00] text-xs">
                        <MapPin className="w-3 h-3" />
                        GPS: {selectedFestival.latitude.toFixed(4)}, {selectedFestival.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>

                  {selectedFestival.genres && selectedFestival.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedFestival.genres.map((genre, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-[#4d94ff]/20 text-[#4d94ff] border border-[#4d94ff]/50 text-sm font-bold">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedFestival.headliners && selectedFestival.headliners.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#333]">
                      <p className="text-xs text-gray-500 mb-2">Headliners :</p>
                      <p className="text-base font-bold text-white">{selectedFestival.headliners.join(', ')}</p>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => editFestival(selectedFestival)} className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold">
                      <Edit className="w-4 h-4 mr-2" /> Modifier
                    </Button>
                    <Button onClick={() => toggleFestivalActive(selectedFestival)} variant="outline" className="border-[#333] text-white">
                      {selectedFestival.is_active ? 'Masquer' : 'Afficher'}
                    </Button>
                    <Button onClick={() => deleteFestival(selectedFestival.id)} variant="outline" className="border-[#ff6b6b] text-[#ff6b6b]">
                      <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ONGLETS */}
              <Tabs defaultValue="artists" className="w-full">
                <TabsList className="bg-[#1a1a1a] border border-[#333] p-1">
                  <TabsTrigger value="days" className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black font-bold">
                    <Calendar className="w-4 h-4 mr-2" /> Jours ({days.length})
                  </TabsTrigger>
                  <TabsTrigger value="stages" className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black font-bold">
                    <MapPin className="w-4 h-4 mr-2" /> Scènes ({stages.length})
                  </TabsTrigger>
                  <TabsTrigger value="artists" className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black font-bold">
                    <Users className="w-4 h-4 mr-2" /> Artistes ({artists.length})
                  </TabsTrigger>
                </TabsList>

                {/* ONGLET JOURS */}
                <TabsContent value="days" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">Jours du festival</CardTitle>
                          <CardDescription className="text-gray-400">Configurez les jours (Vendredi, Samedi...)</CardDescription>
                        </div>
                        <Dialog open={isDayDialogOpen} onOpenChange={setIsDayDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => { resetDayForm(); setIsDayDialogOpen(true); }} className="bg-[#00cc00] hover:bg-[#00ff00] text-black font-bold">
                              <Plus className="w-4 h-4 mr-2" /> Ajouter un jour
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                            <DialogHeader>
                              <DialogTitle className="text-[#00ff00]">{editingDay ? 'Modifier le jour' : 'Ajouter un jour'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <label className="text-sm font-bold mb-2 block">Nom du jour *</label>
                                <Input value={newDay.name} onChange={(e) => setNewDay({ ...newDay, name: e.target.value })} placeholder="Vendredi" className="bg-[#0a0a0a] border-[#333]" />
                              </div>
                              <div>
                                <label className="text-sm font-bold mb-2 block">Date *</label>
                                <Input type="date" value={newDay.date} onChange={(e) => setNewDay({ ...newDay, date: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
                              </div>
                              <div>
                                <label className="text-sm font-bold mb-2 block">Ordre</label>
                                <Input type="number" value={newDay.order_index} onChange={(e) => setNewDay({ ...newDay, order_index: parseInt(e.target.value) })} className="bg-[#0a0a0a] border-[#333]" />
                              </div>
                              <div className="flex gap-3">
                                <Button onClick={createOrUpdateDay} className="flex-1 bg-[#00cc00] text-black font-bold">
                                  {editingDay ? 'Mettre à jour' : 'Créer'}
                                </Button>
                                <Button onClick={() => { setIsDayDialogOpen(false); resetDayForm(); }} variant="outline">Annuler</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {days.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">Aucun jour configuré</p>
                      ) : (
                        <div className="space-y-2">
                          {days.map(day => (
                            <div key={day.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
                              <div>
                                <p className="text-white font-bold">{day.name}</p>
                                <p className="text-gray-400 text-sm">{formatDate(day.date)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => editDay(day)} variant="outline" className="border-[#4d94ff] text-[#4d94ff]">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="sm" onClick={() => deleteDay(day.id)} variant="outline" className="border-[#ff6b6b] text-[#ff6b6b]">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ONGLET SCÈNES */}
                <TabsContent value="stages" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">Scènes du festival</CardTitle>
                          <CardDescription className="text-gray-400">Configurez les scènes (Main Stage, Valley...)</CardDescription>
                        </div>
                        <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => { resetStageForm(); setIsStageDialogOpen(true); }} className="bg-[#00cc00] hover:bg-[#00ff00] text-black font-bold">
                              <Plus className="w-4 h-4 mr-2" /> Ajouter une scène
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                            <DialogHeader>
                              <DialogTitle className="text-[#00ff00]">{editingStage ? 'Modifier la scène' : 'Ajouter une scène'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <label className="text-sm font-bold mb-2 block">Nom de la scène *</label>
                                <Input value={newStage.name} onChange={(e) => setNewStage({ ...newStage, name: e.target.value })} placeholder="Main Stage" className="bg-[#0a0a0a] border-[#333]" />
                              </div>
                              <div>
                                <label className="text-sm font-bold mb-2 block">Ordre</label>
                                <Input type="number" value={newStage.order_index} onChange={(e) => setNewStage({ ...newStage, order_index: parseInt(e.target.value) })} className="bg-[#0a0a0a] border-[#333]" />
                              </div>
                              <div className="flex gap-3">
                                <Button onClick={createOrUpdateStage} className="flex-1 bg-[#00cc00] text-black font-bold">
                                  {editingStage ? 'Mettre à jour' : 'Créer'}
                                </Button>
                                <Button onClick={() => { setIsStageDialogOpen(false); resetStageForm(); }} variant="outline">Annuler</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stages.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">Aucune scène configurée</p>
                      ) : (
                        <div className="space-y-2">
                          {stages.map(stage => (
                            <div key={stage.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
                              <p className="text-white font-bold">{stage.name}</p>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => editStage(stage)} variant="outline" className="border-[#4d94ff] text-[#4d94ff]">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="sm" onClick={() => deleteStage(stage.id)} variant="outline" className="border-[#ff6b6b] text-[#ff6b6b]">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ONGLET ARTISTES */}
                <TabsContent value="artists" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">Artistes ({artists.length})</CardTitle>
                          <CardDescription className="text-gray-400">Programmation complète avec horaires</CardDescription>
                        </div>
                        <Dialog open={isArtistDialogOpen} onOpenChange={setIsArtistDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              onClick={() => { resetArtistForm(); setIsArtistDialogOpen(true); }} 
                              disabled={days.length === 0 || stages.length === 0}
                              className="bg-[#00cc00] hover:bg-[#00ff00] text-black font-bold disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4 mr-2" /> Ajouter un artiste
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-[#00ff00]">{editingArtist ? 'Modifier l\'artiste' : 'Ajouter un artiste'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <label className="text-sm font-bold mb-2 block">Nom de l'artiste *</label>
                                <Input value={newArtist.name} onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })} placeholder="Iron Maiden" className="bg-[#0a0a0a] border-[#333]" />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-bold mb-2 block">Jour *</label>
                                  <Select value={newArtist.day_id} onValueChange={(value) => setNewArtist({ ...newArtist, day_id: value })}>
                                    <SelectTrigger className="bg-[#0a0a0a] border-[#333]">
                                      <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#333]">
                                      {days.map(day => (
                                        <SelectItem key={day.id} value={day.id}>{day.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-bold mb-2 block">Scène *</label>
                                  <Select value={newArtist.stage_id} onValueChange={(value) => setNewArtist({ ...newArtist, stage_id: value })}>
                                    <SelectTrigger className="bg-[#0a0a0a] border-[#333]">
                                      <SelectValue placeholder="Choisir..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#333]">
                                      {stages.map(stage => (
                                        <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-bold mb-2 block flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Heure début
                                  </label>
                                  <Input type="time" value={newArtist.start_time} onChange={(e) => setNewArtist({ ...newArtist, start_time: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
                                </div>
                                <div>
                                  <label className="text-sm font-bold mb-2 block flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Heure fin
                                  </label>
                                  <Input type="time" value={newArtist.end_time} onChange={(e) => setNewArtist({ ...newArtist, end_time: e.target.value })} className="bg-[#0a0a0a] border-[#333]" />
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-bold mb-2 block">Ordre de passage</label>
                                <Input type="number" value={newArtist.order_index} onChange={(e) => setNewArtist({ ...newArtist, order_index: parseInt(e.target.value) })} className="bg-[#0a0a0a] border-[#333]" />
                              </div>

                              <div>
                                <label className="text-sm font-bold mb-2 block">Notes (optionnel)</label>
                                <Textarea value={newArtist.notes} onChange={(e) => setNewArtist({ ...newArtist, notes: e.target.value })} placeholder="Headliner, set spécial..." className="bg-[#0a0a0a] border-[#333]" rows={2} />
                              </div>

                              <div className="flex gap-3">
                                <Button onClick={createOrUpdateArtist} className="flex-1 bg-[#00cc00] text-black font-bold">
                                  {editingArtist ? 'Mettre à jour' : 'Ajouter'}
                                </Button>
                                <Button onClick={() => { setIsArtistDialogOpen(false); resetArtistForm(); }} variant="outline">Annuler</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {days.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Créez d'abord des jours dans l'onglet "Jours"</p>
                        </div>
                      ) : stages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Créez d'abord des scènes dans l'onglet "Scènes"</p>
                        </div>
                      ) : artists.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Aucun artiste ajouté</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {artistsByDayAndStage.map(({ day, stages: stageGroups }) => (
                            <div key={day.id} className="bg-[#0a0a0a] rounded-xl p-4 border border-[#333]">
                              <h3 className="text-xl font-black mb-4 text-[#00ff00]">
                                {day.name} - {formatDate(day.date)}
                              </h3>
                              
                              {stageGroups.map(({ stage, artists: stageArtists }) => 
                                stageArtists.length > 0 ? (
                                  <div key={stage.id} className="mb-4 last:mb-0">
                                    <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                                      <MapPin className="w-3 h-3" /> {stage.name}
                                    </h4>
                                    <div className="space-y-1">
                                      {stageArtists.map(artist => (
                                        <div key={artist.id} className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded border border-[#333] hover:border-[#00ff00]/50 transition-colors">
                                          <div className="flex items-center gap-3">
                                            {artist.start_time && (
                                              <span className="text-xs text-[#00ff00] font-mono">
                                                {artist.start_time}{artist.end_time && ` - ${artist.end_time}`}
                                              </span>
                                            )}
                                            <span className="text-white font-semibold">{artist.name}</span>
                                            {artist.notes && (
                                              <span className="text-xs text-gray-500 italic">({artist.notes})</span>
                                            )}
                                          </div>
                                          <div className="flex gap-2">
                                            <Button size="sm" onClick={() => editArtist(artist)} variant="ghost" className="h-7 w-7 p-0 text-[#4d94ff]">
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button size="sm" onClick={() => deleteArtist(artist.id)} variant="ghost" className="h-7 w-7 p-0 text-[#ff6b6b]">
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null
                              )}
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
                <p className="text-lg">Sélectionnez un festival</p>
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
