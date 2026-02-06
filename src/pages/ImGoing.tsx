import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Calendar, Plus, Trash2, ArrowLeft, Search, Loader2, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from "@/AuthContext";
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ImGoing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingConcerts, setUpcomingConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [artistSearch, setArtistSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Charger les concerts à venir
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUpcomingConcerts();
  }, [user, navigate]);

  const fetchUpcomingConcerts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('upcoming_concerts')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setUpcomingConcerts(data || []);
    } catch (error) {
      console.error('Error fetching concerts:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Rechercher un artiste sur Spotify
  const searchArtist = async () => {
    if (!artistSearch.trim()) return;
    
    setSearching(true);
    try {
      const tokenRes = await fetch('/api/spotify-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: artistSearch })
      });
      
      const data = await tokenRes.json();
      setSearchResults(data.artists || []);
    } catch (error) {
      console.error('Error searching artist:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  };

  // Ajouter un concert
  const addConcert = async () => {
    if (!selectedArtist || !user) {
      toast.error('Sélectionnez un artiste');
      return;
    }

    try {
      const { error } = await supabase
        .from('upcoming_concerts')
        .insert({
          user_id: user.id,
          artist_name: selectedArtist.name,
          artist_spotify_id: selectedArtist.id,
          event_name: eventName || null,
          event_date: eventDate || null,
          venue_name: venueName || null,
          notes: notes || null,
        });

      if (error) throw error;
      
      toast.success(`${selectedArtist.name} ajouté !`);
      
      setSelectedArtist(null);
      setArtistSearch('');
      setSearchResults([]);
      setEventName('');
      setEventDate('');
      setVenueName('');
      setNotes('');
      setShowAddForm(false);
      
      fetchUpcomingConcerts();
    } catch (error) {
      console.error('Error adding concert:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const deleteConcert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('upcoming_concerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Concert supprimé');
      fetchUpcomingConcerts();
    } catch (error) {
      console.error('Error deleting concert:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const generatePlaylist = () => {
    const selected = upcomingConcerts.filter(c => selectedIds.has(c.id));
    localStorage.setItem('upcoming_concerts_selected', JSON.stringify(selected));
    navigate('/generate?mode=upcoming');
  };


      
      <main className="pt-24 pb-16">
        <div className="container px-4 max-w-4xl mx-auto">
          {/* Back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/my-concerts')}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-5xl md:text-7xl text-foreground mb-4">
              I'M <span className="text-gradient-fire">GOING</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Ajoutez les artistes que vous allez voir
            </p>
          </motion.div>

          {/* Add button */}
          {!showAddForm && (
            <div className="text-center mb-8">
              <Button 
                variant="fire" 
                onClick={() => setShowAddForm(true)}
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                Ajouter un artiste
              </Button>
            </div>
          )}

          {/* Add form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-card border border-border rounded-xl p-6 mb-8"
            >
              <h3 className="font-display text-xl mb-4">Nouvel artiste</h3>
              
              {/* Artist search */}
              {!selectedArtist ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nom de l'artiste..."
                      value={artistSearch}
                      onChange={(e) => setArtistSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchArtist()}
                    />
                    <Button onClick={searchArtist} disabled={searching}>
                      {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((artist) => (
                        <div
                          key={artist.id}
                          onClick={() => setSelectedArtist(artist)}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                        >
                          {artist.images?.[0] && (
                            <img 
                              src={artist.images[0].url} 
                              alt={artist.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{artist.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {artist.followers?.total.toLocaleString()} followers
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected artist */}
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                    {selectedArtist.images?.[0] && (
                      <img 
                        src={selectedArtist.images[0].url} 
                        alt={selectedArtist.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <p className="font-medium flex-1">{selectedArtist.name}</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedArtist(null);
                        setSearchResults([]);
                      }}
                    >
                      Changer
                    </Button>
                  </div>

                  {/* Event details */}
                  <Input
                    placeholder="Nom de l'événement (ex: Hellfest 2026)"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                  <Input
                    placeholder="Lieu (optionnel)"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                  />
                  <Input
                    placeholder="Notes (ex: Valley Stage, Jeudi)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="fire" onClick={addConcert} className="flex-1">
                      Ajouter
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedArtist(null);
                        setSearchResults([]);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Concerts list */}
          {upcomingConcerts.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun concert à venir</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {upcomingConcerts.map((concert) => (
                  <motion.div
                    key={concert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => toggleSelection(concert.id)}
                    className={`bg-card border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                      selectedIds.has(concert.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedIds.has(concert.id) ? 'bg-gradient-fire' : 'bg-muted'
                    }`}>
                      <Music className={`w-6 h-6 ${selectedIds.has(concert.id) ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-xl truncate">{concert.artist_name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {concert.event_name && <span>{concert.event_name}</span>}
                        {concert.event_date && (
                          <>
                            {concert.event_name && <span> • </span>}
                            <span>{new Date(concert.event_date).toLocaleDateString('fr-FR')}</span>
                          </>
                        )}
                        {concert.notes && <span className="block text-xs mt-1">{concert.notes}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConcert(concert.id);
                      }}
                      className="shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </motion.div>
                ))}
              </div>

              {selectedIds.size > 0 && (
                <div className="text-center mt-8">
                  <Button variant="fire" size="lg" onClick={generatePlaylist} className="gap-2">
                    <Music className="w-5 h-5" />
                    Générer la playlist ({selectedIds.size} artiste{selectedIds.size > 1 ? 's' : ''})
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImGoing;
