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
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Music } from 'lucide-react';
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
    order_index: 0
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

  const createFestival = async () => {
    const { data, error } = await supabase
      .from('festivals')
      .insert(newFestival)
      .select()
      .single();

    if (error) {
      toast.error('Erreur lors de la création du festival');
      console.error(error);
    } else {
      toast.success('Festival créé avec succès !');
      loadFestivals();
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
        order_index: 0
      });
    }
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

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header />
      
      <main className="pt-20 pb-20 max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="bg-[#2d2d2d] border border-[#00cc00] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#00ff00] mb-2">
                Administration des Festivals
              </h1>
              <p className="text-sm text-[#a0a0a0]">
                Gérez vos festivals, scènes, jours et artistes
              </p>
            </div>

            {/* Bouton Nouveau Festival */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#00cc00] hover:bg-[#00ff00] text-black font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Festival
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2d2d2d] border-[#404040] text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-[#00ff00]">Créer un nouveau festival</DialogTitle>
                  <DialogDescription className="text-[#a0a0a0]">
                    Remplissez les informations du festival
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-[#a0a0a0] mb-1 block">Nom du festival</label>
                    <Input
                      value={newFestival.name}
                      onChange={(e) => setNewFestival({ ...newFestival, name: e.target.value })}
                      placeholder="Hellfest"
                      className="bg-[#1a1a1a] border-[#404040] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-[#a0a0a0] mb-1 block">Slug (URL)</label>
                    <Input
                      value={newFestival.slug}
                      onChange={(e) => setNewFestival({ ...newFestival, slug: e.target.value })}
                      placeholder="hellfest-2026"
                      className="bg-[#1a1a1a] border-[#404040] text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[#a0a0a0] mb-1 block">Année</label>
                      <Input
                        type="number"
                        value={newFestival.year}
                        onChange={(e) => setNewFestival({ ...newFestival, year: parseInt(e.target.value) })}
                        className="bg-[#1a1a1a] border-[#404040] text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#a0a0a0] mb-1 block">Lieu</label>
                      <Input
                        value={newFestival.location}
                        onChange={(e) => setNewFestival({ ...newFestival, location: e.target.value })}
                        placeholder="Clisson, France"
                        className="bg-[#1a1a1a] border-[#404040] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[#a0a0a0] mb-1 block">Date de début</label>
                      <Input
                        type="date"
                        value={newFestival.start_date}
                        onChange={(e) => setNewFestival({ ...newFestival, start_date: e.target.value })}
                        className="bg-[#1a1a1a] border-[#404040] text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#a0a0a0] mb-1 block">Date de fin</label>
                      <Input
                        type="date"
                        value={newFestival.end_date}
                        onChange={(e) => setNewFestival({ ...newFestival, end_date: e.target.value })}
                        className="bg-[#1a1a1a] border-[#404040] text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-[#a0a0a0] mb-1 block">Description</label>
                    <Textarea
                      value={newFestival.description}
                      onChange={(e) => setNewFestival({ ...newFestival, description: e.target.value })}
                      placeholder="Description du festival..."
                      className="bg-[#1a1a1a] border-[#404040] text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-[#a0a0a0] mb-1 block">URL de l'image</label>
                    <Input
                      value={newFestival.image_url}
                      onChange={(e) => setNewFestival({ ...newFestival, image_url: e.target.value })}
                      placeholder="https://..."
                      className="bg-[#1a1a1a] border-[#404040] text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={newFestival.is_active}
                      onCheckedChange={(checked) => setNewFestival({ ...newFestival, is_active: checked as boolean })}
                      className="border-[#404040] data-[state=checked]:bg-[#00cc00] data-[state=checked]:border-[#00cc00]"
                    />
                    <label htmlFor="is_active" className="text-sm text-white cursor-pointer">
                      Festival actif (visible sur le site)
                    </label>
                  </div>

                  <Button onClick={createFestival} className="w-full bg-[#00cc00] hover:bg-[#00ff00] text-black font-bold">
                    Créer le festival
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Liste des festivals */}
        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          
          {/* Sidebar - Liste des festivals */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-[#a0a0a0] py-8">Chargement...</div>
            ) : festivals.length === 0 ? (
              <div className="text-center text-[#a0a0a0] py-8">
                Aucun festival. Créez-en un !
              </div>
            ) : (
              festivals.map((festival) => (
                <Card
                  key={festival.id}
                  className={`cursor-pointer transition-colors ${
                    selectedFestival?.id === festival.id
                      ? 'bg-[#00cc00]/10 border-[#00cc00]'
                      : 'bg-[#2d2d2d] border-[#404040] hover:bg-[#3d3d3d]'
                  }`}
                  onClick={() => setSelectedFestival(festival)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className={`text-lg ${selectedFestival?.id === festival.id ? 'text-[#00ff00]' : 'text-white'}`}>
                          {festival.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-[#a0a0a0] mt-1">
                          {festival.year} • {festival.location}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {!festival.is_active && (
                          <span className="text-xs px-2 py-1 rounded bg-[#ff6b6b]/20 text-[#ff6b6b]">
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
              {/* Actions du festival */}
              <Card className="bg-[#2d2d2d] border-[#404040]">
                <CardHeader>
                  <CardTitle className="text-[#00ff00]">{selectedFestival.name}</CardTitle>
                  <CardDescription className="text-[#a0a0a0]">
                    {selectedFestival.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => toggleFestivalActive(selectedFestival)}
                      className="border-[#404040] text-white hover:bg-[#3d3d3d]"
                    >
                      {selectedFestival.is_active ? 'Masquer' : 'Afficher'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#404040] text-white hover:bg-[#3d3d3d]"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteFestival(selectedFestival.id)}
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
                <TabsList className="bg-[#2d2d2d] border border-[#404040]">
                  <TabsTrigger value="days" className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black">
                    <Calendar className="w-4 h-4 mr-2" />
                    Jours ({days.length})
                  </TabsTrigger>
                  <TabsTrigger value="stages" className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black">
                    <MapPin className="w-4 h-4 mr-2" />
                    Scènes ({stages.length})
                  </TabsTrigger>
                  <TabsTrigger value="artists" className="data-[state=active]:bg-[#00cc00] data-[state=active]:text-black">
                    <Users className="w-4 h-4 mr-2" />
                    Artistes ({artists.length})
                  </TabsTrigger>
                </TabsList>

                {/* Contenu des onglets - À compléter */}
                <TabsContent value="days" className="mt-4">
                  <Card className="bg-[#2d2d2d] border-[#404040]">
                    <CardHeader>
                      <CardTitle className="text-white">Jours du festival</CardTitle>
                      <CardDescription className="text-[#a0a0a0]">
                        Gérez les jours de votre festival
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {days.length === 0 ? (
                        <p className="text-[#a0a0a0] text-center py-4">Aucun jour configuré</p>
                      ) : (
                        <div className="space-y-2">
                          {days.map(day => (
                            <div key={day.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded">
                              <span className="text-white">{day.name}</span>
                              <span className="text-[#a0a0a0] text-sm">{day.date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stages" className="mt-4">
                  <Card className="bg-[#2d2d2d] border-[#404040]">
                    <CardHeader>
                      <CardTitle className="text-white">Scènes du festival</CardTitle>
                      <CardDescription className="text-[#a0a0a0]">
                        Gérez les scènes de votre festival
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stages.length === 0 ? (
                        <p className="text-[#a0a0a0] text-center py-4">Aucune scène configurée</p>
                      ) : (
                        <div className="space-y-2">
                          {stages.map(stage => (
                            <div key={stage.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded">
                              <span className="text-white">{stage.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="artists" className="mt-4">
                  <Card className="bg-[#2d2d2d] border-[#404040]">
                    <CardHeader>
                      <CardTitle className="text-white">Artistes du festival</CardTitle>
                      <CardDescription className="text-[#a0a0a0]">
                        Total: {artists.length} artistes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {artists.length === 0 ? (
                        <p className="text-[#a0a0a0] text-center py-4">Aucun artiste</p>
                      ) : (
                        <div className="max-h-96 overflow-y-auto space-y-1">
                          {artists.map(artist => (
                            <div key={artist.id} className="flex items-center justify-between p-2 hover:bg-[#1a1a1a] rounded text-sm">
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
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-[#a0a0a0]">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un festival pour voir les détails</p>
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
