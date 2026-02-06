import { useState, useEffect } from 'react';
import { Music, Calendar, Plus, Trash2, ArrowLeft, Search, Loader2, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from "@/AuthContext";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ImGoing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingConcerts, setUpcomingConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [artistSearch, setArtistSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      toast.error("Erreur lors de l'ajout");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#4d94ff]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header />
      
      <main className="pt-20 pb-16 max-w-[1200px] mx-auto px-4">
        <button 
          onClick={() => navigate('/my-concerts')}
          className="flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">I'm Going</h1>
          <p className="text-sm text-[#a0a0a0]">
            {upcomingConcerts.length} concert{upcomingConcerts.length > 1 ? 's' : ''} à venir
          </p>
        </div>

        {!showAddForm && (
          <div className="mb-6">
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un artiste
            </Button>
          </div>
        )}

        {showAddForm && (
          <div className="bg-[#2d2d2d] border border-[#404040] rounded p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Nouvel artiste</h3>
            
            {!selectedArtist ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom de l'artiste..."
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchArtist()}
                    className="bg-[#3d3d3d] border-[#404040] text-white placeholder:text-[#606060] focus:border-[#4d94ff]"
                  />
                  <Button 
                    onClick={searchArtist} 
                    disabled={searching}
                    className="bg-[#4d94ff] hover:bg-[#6ba6ff]"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() => setSelectedArtist(artist)}
                        className="flex items-center gap-3 p-3 bg-[#3d3d3d] rounded cursor-pointer hover:bg-[#454545] transition-colors"
                      >
                        {artist.images?.[0] && (
                          <img 
                            src={artist.images[0].url} 
                            alt={artist.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-white text-sm">{artist.name}</p>
                          <p className="text-xs text-[#a0a0a0]">
                            {artist.followers?.total.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#4d94ff]/10 rounded border border-[#4d94ff]/30">
                  {selectedArtist.images?.[0] && (
                    <img 
                      src={selectedArtist.images[0].url} 
                      alt={selectedArtist.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <p className="font-medium flex-1 text-white text-sm">{selectedArtist.name}</p>
                  <button
                    onClick={() => {
                      setSelectedArtist(null);
                      setSearchResults([]);
                    }}
                    className="text-xs text-[#a0a0a0] hover:text-white"
                  >
                    Changer
                  </button>
                </div>

                <Input
                  placeholder="Nom de l'événement (ex: Hellfest 2026)"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="bg-[#3d3d3d] border-[#404040] text-white placeholder:text-[#606060] focus:border-[#4d94ff]"
                />
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="bg-[#3d3d3d] border-[#404040] text-white focus:border-[#4d94ff]"
                />
                <Input
                  placeholder="Lieu (optionnel)"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="bg-[#3d3d3d] border-[#404040] text-white placeholder:text-[#606060] focus:border-[#4d94ff]"
                />
                <Input
                  placeholder="Notes (ex: Mainstage, 20h30)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#3d3d3d] border-[#404040] text-white placeholder:text-[#606060] focus:border-[#4d94ff]"
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={addConcert} 
                    className="flex-1 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white"
                  >
                    Ajouter
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedArtist(null);
                      setSearchResults([]);
                    }}
                    className="border-[#404040] text-white hover:bg-[#3d3d3d]"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {upcomingConcerts.length === 0 ? (
          <div className="bg-[#2d2d2d] border border-[#404040] rounded p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-[#606060]" />
            <p className="text-[#a0a0a0]">Aucun concert à venir</p>
          </div>
        ) : (
          <>
            <div className="bg-[#2d2d2d] border border-[#404040] rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#252525] border-b border-[#404040]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === upcomingConcerts.length}
                        onChange={() => {
                          if (selectedIds.size === upcomingConcerts.length) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(new Set(upcomingConcerts.map(c => c.id)));
                          }
                        }}
                        className="rounded border-[#404040]"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                      Artiste
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                      Événement
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#a0a0a0] uppercase tracking-wider w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#404040]">
                  {upcomingConcerts.map((concert) => (
                    <tr 
                      key={concert.id}
                      className="hover:bg-[#3d3d3d] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(concert.id)}
                          onChange={() => toggleSelection(concert.id)}
                          className="rounded border-[#404040]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-sm">{concert.artist_name}</div>
                        {concert.notes && <div className="text-xs text-[#a0a0a0] mt-0.5">{concert.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#a0a0a0]">
                        {concert.event_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#a0a0a0]">
                        {concert.event_date ? new Date(concert.event_date).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteConcert(concert.id)}
                          className="text-[#a0a0a0] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedIds.size > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                  <div className="text-white">
                    <span className="font-semibold">{selectedIds.size}</span>
                    <span className="text-[#a0a0a0] ml-1">artiste{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
                  </div>
                  <Button 
                    onClick={generatePlaylist}
                    className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white"
                  >
                    Générer la playlist
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ImGoing;
