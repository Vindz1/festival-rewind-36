import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ArrowRight,
  MapPin,
  Loader2,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  ListOrdered,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';

export default function MyConcerts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // --- Données ---
  const [activeTab, setActiveTab] = useState<'past' | 'future'>(
    searchParams.get('tab') === 'future' ? 'future' : 'past'
  );
  const [concerts, setConcerts] = useState<any[]>([]);
  const [upcomingConcerts, setUpcomingConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Sélection (tableau ORDONNÉ = ordre de la playlist) ---
  const [selectedConcerts, setSelectedConcerts] = useState<string[]>([]);
  const [selectedUpcoming, setSelectedUpcoming] = useState<string[]>([]);

  // --- Recherche ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Modal de réorganisation ---
  const [reorderOpen, setReorderOpen] = useState<null | 'past' | 'future'>(null);

  // --- Premium ---
  const [isPremium, setIsPremium] = useState(false);

  // --- Helpers ---
  const getArtistName = (c: any) =>
    c?.artist?.name || c?.artist || 'Artiste inconnu';
  const getVenueName = (c: any) => c?.venue?.name || c?.venue_name || '—';
  const getEventDate = (c: any) => c?.eventDate || c?.event_date || 'À venir';

  // 1. Vérification Premium
  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then((sub) => {
        setIsPremium(sub.subscription_type === 'premium');
      });
    }
  }, [user]);

  // 2. Chargement concerts (cache + split par date)
  useEffect(() => {
    const username =
      localStorage.getItem('setlistfm_username') ||
      localStorage.getItem('setlist_username') ||
      localStorage.getItem('setlistUsername') ||
      searchParams.get('username');

    if (!username) {
      setLoading(false);
      return;
    }

    const CACHE_KEY_PAST = `cache_concerts_past_${username}`;
    const CACHE_KEY_FUTURE = `cache_concerts_future_${username}`;
    const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

    const readCache = (key: string): any[] | null => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return data;
      } catch {
        return null;
      }
    };

    const writeCache = (key: string, data: any[]) => {
      try {
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
      } catch (e) {
        console.warn('Cache localStorage indisponible:', e);
      }
    };

    const parseSetlistDate = (s: string): Date | null => {
      if (!s || typeof s !== 'string') return null;
      const parts = s.split('-');
      if (parts.length !== 3) return null;
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y) return null;
      return new Date(y, m - 1, d);
    };

    const cachedPast = readCache(CACHE_KEY_PAST);
    const cachedFuture = readCache(CACHE_KEY_FUTURE);

    if (cachedPast) setConcerts(cachedPast);
    if (cachedFuture) setUpcomingConcerts(cachedFuture);
    if (cachedPast || cachedFuture) setLoading(false);

    const fetchAllConcerts = async () => {
      if (!cachedPast && !cachedFuture) setLoading(true);

      const futureFromAttended: any[] = [];

      try {
        // === PASSÉS ===
        try {
          const res = await fetch(`/api/search?action=user&username=${username}`);
          if (res.ok) {
            const data = await res.json();
            const all = JSON.parse(JSON.stringify(data.results || []));

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const trulyPast: any[] = [];
            for (const c of all) {
              const dt = parseSetlistDate(c.eventDate);
              if (dt && dt >= today) futureFromAttended.push(c);
              else trulyPast.push(c);
            }
            console.log(
              '✅ Split → passés:',
              trulyPast.length,
              '| futurs:',
              futureFromAttended.length
            );

            if (
              !cachedPast ||
              trulyPast.length >= cachedPast.length - futureFromAttended.length
            ) {
              setConcerts(trulyPast);
              writeCache(CACHE_KEY_PAST, trulyPast);
            }
          }
        } catch (e) {
          console.error('❌ Erreur Past:', e);
        }

        // === FUTURS (scraping) ===
        let upcoming: any[] = [];
        try {
          const resUp = await fetch(`/api/upcoming-shows?username=${username}`);
          if (resUp.ok) {
            const data = await resUp.json();
            upcoming = data.results || [];
          }
        } catch (e) {
          console.error('❌ Erreur Future:', e);
        }

        // === MERGE Supabase (concerts futurs ajoutés à la main) ===
        if (user) {
          const { data: sbData } = await supabase
            .from('upcoming_concerts')
            .select('*')
            .eq('user_id', user.id);
          if (sbData) upcoming = [...upcoming, ...sbData];
        }

        // === MERGE des futurs venus de /attended (priorité = données plus riches) ===
        upcoming = [...futureFromAttended, ...upcoming];

        const uniqueUpcoming = Array.from(
          new Map(upcoming.map((item) => [getArtistName(item), item])).values()
        );

        if (!cachedFuture || uniqueUpcoming.length >= cachedFuture.length) {
          setUpcomingConcerts(uniqueUpcoming);
          writeCache(CACHE_KEY_FUTURE, uniqueUpcoming);
        }
      } catch (error) {
        console.error('❌ Erreur générale:', error);
        if (!cachedPast && !cachedFuture) {
          toast.error('Erreur lors du chargement des concerts');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllConcerts();
  }, [user, searchParams]);

  // --- Filtrage par recherche ---
  const matchesSearch = (c: any, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    return (
      getArtistName(c).toLowerCase().includes(q) ||
      getVenueName(c).toLowerCase().includes(q) ||
      getEventDate(c).toLowerCase().includes(q)
    );
  };

  const filteredConcerts = useMemo(
    () => concerts.filter((c) => matchesSearch(c, searchQuery)),
    [concerts, searchQuery]
  );

  const filteredUpcoming = useMemo(
    () => upcomingConcerts.filter((c) => matchesSearch(c, searchQuery)),
    [upcomingConcerts, searchQuery]
  );

  // --- Sélection : ajoute en fin, retire si déjà présent ---
  const toggleSelection = (
    current: string[],
    setter: (s: string[]) => void,
    id: string
  ) => {
    if (current.includes(id)) {
      setter(current.filter((x) => x !== id));
    } else {
      setter([...current, id]);
    }
  };

  // --- Déplacer un item dans la sélection ---
  const moveItem = (
    current: string[],
    setter: (s: string[]) => void,
    id: string,
    direction: -1 | 1
  ) => {
    const idx = current.indexOf(id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= current.length) return;
    const next = [...current];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setter(next);
  };

  // --- Retirer de la sélection ---
  const removeFromSelection = (
    current: string[],
    setter: (s: string[]) => void,
    id: string
  ) => {
    setter(current.filter((x) => x !== id));
  };

  // --- Génération (respecte l'ordre de sélection) ---
  const handleGenerate = (isUpcoming: boolean) => {
    const selectedIds = isUpcoming ? selectedUpcoming : selectedConcerts;
    const list = isUpcoming ? upcomingConcerts : concerts;

    if (selectedIds.length === 0)
      return toast.error('Sélectionnez au moins un concert');

    const dataToSave = selectedIds
      .map((id) => list.find((c) => c.id === id))
      .filter(Boolean)
      .map((c: any) => ({
        id: c.id,
        artist: getArtistName(c),
        venue: getVenueName(c),
        eventDate: getEventDate(c),
        sets: c.sets,
        tracks: c.tracks,
      }));

    localStorage.setItem(
      isUpcoming ? 'selected_upcoming' : 'selected_concerts',
      JSON.stringify(dataToSave)
    );
    navigate(isUpcoming ? '/generate?mode=upcoming' : '/generate');
  };

  const debugUsername =
    localStorage.getItem('setlistfm_username') ||
    localStorage.getItem('setlist_username') ||
    localStorage.getItem('setlistUsername') ||
    searchParams.get('username');

  if (loading)
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12" />
      </div>
    );

  // --- Items affichés dans le modal de réorganisation ---
  const reorderItems =
    reorderOpen === 'past'
      ? selectedConcerts
          .map((id) => concerts.find((c) => c.id === id))
          .filter(Boolean)
      : reorderOpen === 'future'
      ? selectedUpcoming
          .map((id) => upcomingConcerts.find((c) => c.id === id))
          .filter(Boolean)
      : [];

  const reorderCurrent =
    reorderOpen === 'past' ? selectedConcerts : selectedUpcoming;
  const reorderSetter =
    reorderOpen === 'past' ? setSelectedConcerts : setSelectedUpcoming;
  const reorderAccent = reorderOpen === 'past' ? '#4d94ff' : '#00ff00';
  const reorderTextOnAccent = reorderOpen === 'future' ? '#000' : '#fff';

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />

      <div className="flex-grow max-w-[1200px] mx-auto w-full px-4 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-black italic uppercase text-white">
            Mes Concerts
          </h1>
          {!debugUsername && (
            <div className="text-sm text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/30">
              ⚠️ Aucun compte Setlist.fm relié.{' '}
              <button
                onClick={() => navigate('/')}
                className="underline font-bold"
              >
                Relier maintenant
              </button>
            </div>
          )}
        </div>

        {/* CHAMP DE RECHERCHE */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0a0] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un artiste, un lieu, une date..."
            className="w-full h-11 bg-[#3d3d3d] border border-[#404040] rounded-xl pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-[#4d94ff]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v: any) => setActiveTab(v)}
          className="mb-6"
        >
          <TabsList className="bg-[#2d2d2d] border-b border-[#404040] w-full justify-start p-0 h-auto rounded-none">
            <TabsTrigger
              value="past"
              className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#4d94ff] text-[#a0a0a0] data-[state=active]:text-white font-bold uppercase tracking-wider"
            >
              I Was There{' '}
              <span className="ml-2 bg-[#333] px-2 rounded-full text-xs text-white">
                {searchQuery
                  ? `${filteredConcerts.length}/${concerts.length}`
                  : concerts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="future"
              className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#00ff00] text-[#a0a0a0] data-[state=active]:text-white font-bold uppercase tracking-wider"
            >
              I'm Going{' '}
              <span className="ml-2 bg-[#333] px-2 rounded-full text-xs text-white">
                {searchQuery
                  ? `${filteredUpcoming.length}/${upcomingConcerts.length}`
                  : upcomingConcerts.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ONGLET PASSÉ */}
          <TabsContent value="past" className="mt-6">
            <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden shadow-2xl">
              {filteredConcerts.length === 0 ? (
                <div className="p-12 text-center text-[#a0a0a0]">
                  {searchQuery
                    ? `Aucun résultat pour « ${searchQuery} »`
                    : 'Aucun concert trouvé sur votre profil Setlist.fm'}
                </div>
              ) : (
                <div className="divide-y divide-[#404040]">
                  {filteredConcerts.map((c, index) => {
                    const isSelected = selectedConcerts.includes(c.id);
                    const order = isSelected
                      ? selectedConcerts.indexOf(c.id) + 1
                      : null;
                    return (
                      <div key={c.id}>
                        <div
                          onClick={() =>
                            toggleSelection(
                              selectedConcerts,
                              setSelectedConcerts,
                              c.id
                            )
                          }
                          className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#4d94ff]/10'
                              : 'hover:bg-[#3d3d3d]'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-5 h-5 rounded border-[#404040] accent-[#4d94ff]"
                            />
                            {order !== null && (
                              <span className="absolute -top-2 -right-2 bg-[#4d94ff] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                                {order}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-lg truncate">
                              {getArtistName(c)}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-[#a0a0a0] mt-1">
                              <span className="flex items-center gap-1 min-w-0 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {getVenueName(c)}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3" />
                                {getEventDate(c)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* PUB tous les 5 items */}
                        {(index + 1) % 5 === 0 && !isPremium && (
                          <div className="px-4 py-2 bg-[#1a1a1a]">
                            <SmartAd
                              artistName={getArtistName(c)}
                              index={index}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Barre flottante */}
            {selectedConcerts.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-3 sm:p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full z-40">
                <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 text-white">
                  <span className="font-bold text-sm sm:text-base text-center sm:text-left">
                    {selectedConcerts.length} concert(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setReorderOpen('past')}
                      className="flex-1 sm:flex-none bg-transparent border-[#4d94ff] text-[#4d94ff] hover:bg-[#4d94ff]/10 hover:text-[#4d94ff]"
                    >
                      <ListOrdered className="mr-2 w-4 h-4" />
                      Réorganiser
                    </Button>
                    <Button
                      onClick={() => handleGenerate(false)}
                      className="flex-1 sm:flex-none bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold shadow-lg shadow-blue-500/20"
                    >
                      <span className="sm:hidden">Générer</span>
                      <span className="hidden sm:inline">Générer Playlist</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ONGLET FUTUR */}
          <TabsContent value="future" className="mt-6">
            <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden shadow-2xl">
              {filteredUpcoming.length === 0 ? (
                <div className="p-12 text-center text-[#a0a0a0]">
                  {searchQuery
                    ? `Aucun résultat pour « ${searchQuery} »`
                    : 'Aucun concert à venir.'}
                </div>
              ) : (
                <div className="divide-y divide-[#404040]">
                  {filteredUpcoming.map((c, index) => {
                    const isSelected = selectedUpcoming.includes(c.id);
                    const order = isSelected
                      ? selectedUpcoming.indexOf(c.id) + 1
                      : null;
                    return (
                      <div key={c.id}>
                        <div
                          onClick={() =>
                            toggleSelection(
                              selectedUpcoming,
                              setSelectedUpcoming,
                              c.id
                            )
                          }
                          className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#00ff00]/10'
                              : 'hover:bg-[#3d3d3d]'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-5 h-5 rounded border-[#404040] accent-[#00ff00]"
                            />
                            {order !== null && (
                              <span className="absolute -top-2 -right-2 bg-[#00ff00] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                                {order}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-lg truncate">
                              {getArtistName(c)}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-[#a0a0a0] mt-1">
                              <span className="flex items-center gap-1 min-w-0 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {getVenueName(c)}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3" />
                                {getEventDate(c)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(index + 1) % 5 === 0 && !isPremium && (
                          <div className="px-4 py-2 bg-[#1a1a1a]">
                            <SmartAd
                              artistName={getArtistName(c)}
                              index={index}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedUpcoming.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-3 sm:p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full z-40">
                <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 text-white">
                  <span className="font-bold text-sm sm:text-base text-center sm:text-left">
                    {selectedUpcoming.length} concert(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setReorderOpen('future')}
                      className="flex-1 sm:flex-none bg-transparent border-[#00ff00] text-[#00ff00] hover:bg-[#00ff00]/10 hover:text-[#00ff00]"
                    >
                      <ListOrdered className="mr-2 w-4 h-4" />
                      Réorganiser
                    </Button>
                    <Button
                      onClick={() => handleGenerate(true)}
                      className="flex-1 sm:flex-none bg-[#00ff00] hover:bg-[#33ff33] text-black font-bold shadow-lg shadow-green-500/20"
                    >
                      <span className="sm:hidden">Préparer</span>
                      <span className="hidden sm:inline">Préparer Playlist</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL DE RÉORGANISATION */}
      <Dialog
        open={reorderOpen !== null}
        onOpenChange={(open) => !open && setReorderOpen(null)}
      >
        <DialogContent className="bg-[#2d2d2d] border-[#404040] text-white max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">
              Ordre de la playlist
            </DialogTitle>
            <p className="text-sm text-[#a0a0a0]">
              Le premier en haut sera joué en premier.
            </p>
          </DialogHeader>

          <div className="space-y-2 overflow-y-auto flex-1 py-2 pr-1">
            {reorderItems.length === 0 ? (
              <p className="text-center text-[#a0a0a0] py-8">
                Aucune sélection.
              </p>
            ) : (
              reorderItems.map((c: any, idx: number) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-[#3d3d3d] p-3 rounded-lg"
                >
                  <span
                    className="font-bold w-6 text-center shrink-0"
                    style={{ color: reorderAccent }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{getArtistName(c)}</p>
                    <p className="text-xs text-[#a0a0a0] truncate">
                      {getEventDate(c)} · {getVenueName(c)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() =>
                        moveItem(reorderCurrent, reorderSetter, c.id, -1)
                      }
                      disabled={idx === 0}
                      aria-label="Monter"
                      className="p-1 rounded hover:bg-[#4d4d4d] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        moveItem(reorderCurrent, reorderSetter, c.id, 1)
                      }
                      disabled={idx === reorderItems.length - 1}
                      aria-label="Descendre"
                      className="p-1 rounded hover:bg-[#4d4d4d] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      removeFromSelection(reorderCurrent, reorderSetter, c.id)
                    }
                    aria-label="Retirer"
                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-[#4d4d4d] shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {reorderItems.length > 0 && (
            <Button
              onClick={() => {
                const isUpcoming = reorderOpen === 'future';
                setReorderOpen(null);
                handleGenerate(isUpcoming);
              }}
              className="font-bold w-full"
              style={{
                backgroundColor: reorderAccent,
                color: reorderTextOnAccent,
              }}
            >
              {reorderOpen === 'future' ? 'Préparer Playlist' : 'Générer Playlist'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
