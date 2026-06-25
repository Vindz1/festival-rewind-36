import { useEffect, useState } from 'react';
import { Music, Calendar, ArrowRight, MapPin, Loader2, CalendarRange, X, RefreshCw, AlertTriangle, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from "@/AuthContext";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';

export default function MyConcerts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // États des données
  const [activeTab, setActiveTab] = useState<'past' | 'future'>(
    searchParams.get('tab') === 'future' ? 'future' : 'past'
  );
  const [concerts, setConcerts] = useState<any[]>([]);
  const [upcomingConcerts, setUpcomingConcerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // États de sélection — tableaux ordonnés (l'ordre est utilisé dans la playlist générée)
  const [selectedConcerts, setSelectedConcerts] = useState<string[]>([]);
  const [selectedUpcoming, setSelectedUpcoming] = useState<string[]>([]);

  // État du modal "Réorganiser" — null si fermé, sinon indique sur quel onglet
  const [reorderingTab, setReorderingTab] = useState<null | 'past' | 'future'>(null);

  // Infos de chargement (détection des chargements partiels dus au rate-limit Setlist.fm)
  const [pastLoadInfo, setPastLoadInfo] = useState<{
    fetched: number;
    total: number;
    partial: boolean;
  } | null>(null);
  const [reloading, setReloading] = useState(false);

  // États des filtres par plage de dates (un par onglet)
  const [pastDateFrom, setPastDateFrom] = useState<string>('');
  const [pastDateTo, setPastDateTo] = useState<string>('');
  const [futureDateFrom, setFutureDateFrom] = useState<string>('');
  const [futureDateTo, setFutureDateTo] = useState<string>('');

  // État Premium (pour les pubs)
  const [isPremium, setIsPremium] = useState(false);

  // Helpers pour éviter les crashs si l'API renvoie des formats bizarres
  const getArtistName = (c: any) => c.artist?.name || c.artist || 'Artiste inconnu';
  const getVenueName = (c: any) => c.venue?.name || c.venue_name || '—';
  const getEventDate = (c: any) => c.eventDate || c.event_date || 'À venir';

  /**
   * Parse une date au format Setlist.fm "dd-MM-yyyy" vers un objet Date JS.
   * Retourne null si la date est invalide ou absente (concerts futurs "À venir").
   */
  const parseEventDate = (str: string): Date | null => {
    if (!str || str === 'À venir') return null;
    // Format Setlist.fm : "dd-MM-yyyy"
    const m = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      return isNaN(d.getTime()) ? null : d;
    }
    // Fallback : format ISO "yyyy-MM-dd" (concerts Supabase manuels)
    const iso = new Date(str);
    return isNaN(iso.getTime()) ? null : iso;
  };

  // 1. Vérifier le statut Premium au chargement
  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then(sub => {
        setIsPremium(sub.subscription_type === 'premium');
      });
    }
  }, [user]);

  // 2. Charger les concerts depuis Setlist.fm (via votre API locale).
  // Extrait en fonction nommée pour pouvoir être ré-appelé via le bouton "Recharger".
  const fetchAllConcerts = async (isReload = false) => {
    const username =
      localStorage.getItem('setlistfm_username') ||
      localStorage.getItem('setlist_username') ||
      localStorage.getItem('setlistUsername') ||
      searchParams.get('username');

    console.log('🔍 Username Setlist.fm:', username);

    if (!username) {
      console.warn('⚠️ Pas de username Setlist.fm');
      setLoading(false);
      return;
    }

    if (isReload) {
      setReloading(true);
    } else {
      setLoading(true);
    }

    try {
      // A. CHARGEMENT "I WAS THERE" (Passés)
      console.log('📡 Appel API: /api/search?action=user&username=' + username);
      try {
        const res = await fetch(`/api/search?action=user&username=${username}`);
        console.log('📡 Réponse API status:', res.status);

        if (res.ok) {
          const data = await res.json();
          const fetched = data.results?.length || 0;
          const total = data.total || fetched;
          const partial = !!data.partial && fetched < total;

          console.log(`✅ Concerts passés reçus: ${fetched} / total annoncé: ${total}${partial ? ' (PARTIEL)' : ''}`);

          const concertsWithSets = JSON.parse(JSON.stringify(data.results || []));
          setConcerts(concertsWithSets);
          setPastLoadInfo({ fetched, total, partial });

          // ⚠️ Alerter si chargement partiel (rate-limit Setlist.fm)
          if (partial) {
            const missing = total - fetched;
            toast.warning(
              `${fetched} concerts chargés sur ${total} — ${missing} n'ont pas pu être récupérés (Setlist.fm a rate-limité). Cliquez sur "Recharger" dans 1 minute.`,
              { duration: 10000 }
            );
          } else if (isReload) {
            toast.success(`Tous les concerts sont chargés (${fetched}/${total})`);
          }
        } else {
          console.error('❌ Erreur API:', res.status, res.statusText);
          const errorData = await res.text();
          console.error('❌ Détails:', errorData);
          if (isReload) toast.error('Erreur lors du rechargement');
        }
      } catch (e) {
        console.error('❌ Erreur Past:', e);
      }

      // B. CHARGEMENT "I'M GOING" (Futurs)
      let upcoming: any[] = [];
      console.log('📡 Appel API: /api/upcoming-shows?username=' + username);
      try {
        const resUpcoming = await fetch(`/api/upcoming-shows?username=${username}`);
        console.log('📡 Réponse API upcoming status:', resUpcoming.status);

        if (resUpcoming.ok) {
          const data = await resUpcoming.json();
          console.log('✅ Concerts futurs reçus:', data.results?.length || 0);
          upcoming = data.results || [];
        }
      } catch (e) {
        console.error('❌ Erreur Future:', e);
      }

      // C. MERGE SUPABASE
      if (user) {
        console.log('📡 Vérification Supabase pour user:', user.id);
        const { data: sbData, error } = await supabase
          .from('upcoming_concerts')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Erreur Supabase:', error);
        } else {
          console.log('✅ Concerts Supabase:', sbData?.length || 0);
          if (sbData) upcoming = [...upcoming, ...sbData];
        }
      }

      // D. DÉDOUBLONNAGE
      const uniqueUpcoming = Array.from(
        new Map(upcoming.map((item) => [getArtistName(item), item])).values()
      );
      setUpcomingConcerts(uniqueUpcoming);
    } catch (error) {
      console.error('❌ Erreur générale:', error);
      toast.error('Erreur lors du chargement des concerts');
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    fetchAllConcerts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  // Toggle d'une sélection ordonnée (ajoute en fin si absent, retire sinon)
  const toggleSelection = (current: string[], setFunc: (l: string[]) => void, id: string) => {
    if (current.includes(id)) {
      setFunc(current.filter((x) => x !== id));
    } else {
      setFunc([...current, id]);
    }
  };

  /**
   * Sélectionne tous les concerts d'une liste dont la date est dans la plage.
   * Préserve l'ordre naturel de la liste (chronologique côté Setlist.fm).
   * Si une borne est vide, elle est ignorée (open-ended range).
   * Les concerts sans date valide sont ignorés.
   */
  const selectInDateRange = (
    list: any[],
    from: string,
    to: string,
    setFunc: (s: string[]) => void
  ) => {
    if (!from && !to) {
      toast.warning('Renseignez au moins une date');
      return;
    }

    const fromDate = from ? new Date(from + 'T00:00:00') : null;
    const toDate = to ? new Date(to + 'T23:59:59') : null;

    if (fromDate && toDate && fromDate > toDate) {
      toast.error('La date de début doit être avant la date de fin');
      return;
    }

    const matchedIds = list
      .filter((c) => {
        const d = parseEventDate(getEventDate(c));
        if (!d) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      })
      .map((c) => c.id);

    if (matchedIds.length === 0) {
      toast.warning('Aucun concert dans cette plage de dates');
      return;
    }

    setFunc(matchedIds);
    toast.success(`${matchedIds.length} concert(s) sélectionné(s)`);
  };

  // Helpers pour le modal de réorganisation
  const moveSelected = (
    current: string[],
    setFunc: (l: string[]) => void,
    idx: number,
    direction: -1 | 1
  ) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= current.length) return;
    const next = [...current];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setFunc(next);
  };

  const removeFromSelection = (current: string[], setFunc: (l: string[]) => void, id: string) => {
    setFunc(current.filter((x) => x !== id));
  };

  const handleGenerate = (isUpcoming: boolean) => {
    const selected = isUpcoming ? selectedUpcoming : selectedConcerts;
    const list = isUpcoming ? upcomingConcerts : concerts;

    if (selected.length === 0) return toast.error('Sélectionnez au moins un concert');

    // On préserve l'ORDRE de la sélection (ordre d'ajout ou ordre après réorganisation)
    const dataToSave = selected
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

  // Composant réutilisable pour le filtre par plage de dates
  const DateRangeFilter = ({
    list,
    from,
    to,
    setFrom,
    setTo,
    currentSelection,
    setSelection,
    accentColor,
  }: {
    list: any[];
    from: string;
    to: string;
    setFrom: (v: string) => void;
    setTo: (v: string) => void;
    currentSelection: string[];
    setSelection: (s: string[]) => void;
    accentColor: string;
  }) => (
    <div className="bg-[#252525] border border-[#404040] rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarRange className="w-4 h-4 text-[#a0a0a0]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#a0a0a0]">
          Sélection par plage de dates
        </h3>
      </div>

      <p className="text-xs text-[#666] mb-3 leading-relaxed">
        Pratique pour les festivals : sélectionnez d'un coup tous les concerts entre deux dates.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] block mb-1">
              Du
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4d94ff] [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] block mb-1">
              Au
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#4d94ff] [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => selectInDateRange(list, from, to, setSelection)}
            className={`${accentColor} font-bold text-xs sm:text-sm whitespace-nowrap`}
          >
            Sélectionner la plage
          </Button>
          {currentSelection.length > 0 && (
            <Button
              onClick={() => setSelection([])}
              variant="outline"
              className="border-[#404040] bg-transparent hover:bg-[#3d3d3d] text-[#a0a0a0] text-xs sm:text-sm whitespace-nowrap"
              title="Tout désélectionner"
            >
              <X className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Vider</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // AFFICHER USERNAME POUR DÉBUG
  const debugUsername =
    localStorage.getItem('setlistfm_username') ||
    localStorage.getItem('setlist_username') ||
    localStorage.getItem('setlistUsername') ||
    searchParams.get('username');

  if (loading) return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />

      <div className="flex-grow max-w-[1200px] mx-auto w-full px-4 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-black italic uppercase text-white">Mes Concerts</h1>
          {!debugUsername && (
            <div className="text-sm text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/30">
              ⚠️ Aucun compte Setlist.fm relié.{' '}
              <button onClick={() => navigate('/')} className="underline font-bold">
                Relier maintenant
              </button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mb-6">
          <TabsList className="bg-[#2d2d2d] border-b border-[#404040] w-full justify-start p-0 h-auto rounded-none">
            <TabsTrigger
              value="past"
              className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#4d94ff] text-[#a0a0a0] data-[state=active]:text-white font-bold uppercase tracking-wider"
            >
              I Was There{' '}
              {pastLoadInfo?.partial ? (
                <span
                  className="ml-2 bg-red-500/20 text-red-400 border border-red-500/40 px-2 rounded-full text-xs"
                  title={`Chargement partiel : ${pastLoadInfo.fetched} sur ${pastLoadInfo.total}`}
                >
                  {pastLoadInfo.fetched}/{pastLoadInfo.total}
                </span>
              ) : (
                <span className="ml-2 bg-[#333] px-2 rounded-full text-xs text-white">
                  {concerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="future"
              className="px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#00ff00] text-[#a0a0a0] data-[state=active]:text-white font-bold uppercase tracking-wider"
            >
              I'm Going{' '}
              <span className="ml-2 bg-[#333] px-2 rounded-full text-xs text-white">
                {upcomingConcerts.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ONGLET PASSÉ */}
          <TabsContent value="past" className="mt-6">
            {/* Bannière chargement partiel */}
            {pastLoadInfo?.partial && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-400 text-sm">
                      Chargement partiel — {pastLoadInfo.fetched} concerts sur {pastLoadInfo.total}
                    </p>
                    <p className="text-xs text-red-400/80 mt-1">
                      Setlist.fm a temporairement limité nos requêtes. Attendez 1 minute et cliquez sur Recharger.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => fetchAllConcerts(true)}
                  disabled={reloading}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold whitespace-nowrap"
                >
                  {reloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rechargement…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" /> Recharger
                    </>
                  )}
                </Button>
              </div>
            )}

            {concerts.length > 0 && (
              <DateRangeFilter
                list={concerts}
                from={pastDateFrom}
                to={pastDateTo}
                setFrom={setPastDateFrom}
                setTo={setPastDateTo}
                currentSelection={selectedConcerts}
                setSelection={setSelectedConcerts}
                accentColor="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white"
              />
            )}

            <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden shadow-2xl">
              {concerts.length === 0 ? (
                <div className="p-12 text-center text-[#a0a0a0]">
                  Aucun concert trouvé sur votre profil Setlist.fm
                </div>
              ) : (
                <div className="divide-y divide-[#404040]">
                  {concerts.map((c, index) => (
                    <div key={c.id}>
                      <div
                        onClick={() => toggleSelection(selectedConcerts, setSelectedConcerts, c.id)}
                        className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                          selectedConcerts.includes(c.id) ? 'bg-[#4d94ff]/10' : 'hover:bg-[#3d3d3d]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedConcerts.includes(c.id)}
                          readOnly
                          className="w-5 h-5 rounded border-[#404040] accent-[#4d94ff]"
                        />
                        <div className="flex-1">
                          <p className="text-white font-bold text-lg">{getArtistName(c)}</p>
                          <div className="flex items-center gap-4 text-sm text-[#a0a0a0] mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {getVenueName(c)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {getEventDate(c)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(index + 1) % 5 === 0 && !isPremium && (
                        <div className="px-4 py-2 bg-[#1a1a1a]">
                          <SmartAd artistName={getArtistName(c)} index={index} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Barre de génération flottante */}
            {selectedConcerts.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full z-40">
                <div className="max-w-[1200px] mx-auto flex justify-between items-center gap-3 text-white">
                  <span className="font-bold text-sm sm:text-base">
                    {selectedConcerts.length} concert(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2">
                    {selectedConcerts.length > 1 && (
                      <Button
                        onClick={() => setReorderingTab('past')}
                        variant="outline"
                        className="border-[#404040] bg-transparent hover:bg-[#3d3d3d] text-white font-bold text-xs sm:text-sm"
                        title="Réorganiser l'ordre des concerts dans la playlist"
                      >
                        <ArrowUpDown className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Réorganiser</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => handleGenerate(false)}
                      className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold shadow-lg shadow-blue-500/20 text-xs sm:text-sm"
                    >
                      Générer Playlist <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ONGLET FUTUR */}
          <TabsContent value="future" className="mt-6">
            {upcomingConcerts.length > 0 && (
              <DateRangeFilter
                list={upcomingConcerts}
                from={futureDateFrom}
                to={futureDateTo}
                setFrom={setFutureDateFrom}
                setTo={setFutureDateTo}
                currentSelection={selectedUpcoming}
                setSelection={setSelectedUpcoming}
                accentColor="bg-[#00ff00] hover:bg-[#33ff33] text-black"
              />
            )}

            <div className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden shadow-2xl">
              {upcomingConcerts.length === 0 ? (
                <div className="p-12 text-center text-[#a0a0a0]">Aucun concert à venir.</div>
              ) : (
                <div className="divide-y divide-[#404040]">
                  {upcomingConcerts.map((c, index) => (
                    <div key={c.id}>
                      <div
                        onClick={() => toggleSelection(selectedUpcoming, setSelectedUpcoming, c.id)}
                        className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                          selectedUpcoming.includes(c.id) ? 'bg-[#00ff00]/10' : 'hover:bg-[#3d3d3d]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUpcoming.includes(c.id)}
                          readOnly
                          className="w-5 h-5 rounded border-[#404040] accent-[#00ff00]"
                        />
                        <div className="flex-1">
                          <p className="text-white font-bold text-lg">{getArtistName(c)}</p>
                          <div className="flex items-center gap-4 text-sm text-[#a0a0a0] mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {getVenueName(c)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {getEventDate(c)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(index + 1) % 5 === 0 && !isPremium && (
                        <div className="px-4 py-2 bg-[#1a1a1a]">
                          <SmartAd artistName={getArtistName(c)} index={index} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedUpcoming.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-[#2d2d2d] border-t border-[#404040] p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full z-40">
                <div className="max-w-[1200px] mx-auto flex justify-between items-center gap-3 text-white">
                  <span className="font-bold text-sm sm:text-base">
                    {selectedUpcoming.length} concert(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2">
                    {selectedUpcoming.length > 1 && (
                      <Button
                        onClick={() => setReorderingTab('future')}
                        variant="outline"
                        className="border-[#404040] bg-transparent hover:bg-[#3d3d3d] text-white font-bold text-xs sm:text-sm"
                        title="Réorganiser l'ordre des concerts dans la playlist"
                      >
                        <ArrowUpDown className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Réorganiser</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => handleGenerate(true)}
                      className="bg-[#00ff00] hover:bg-[#33ff33] text-black font-bold shadow-lg shadow-green-500/20 text-xs sm:text-sm"
                    >
                      Préparer Playlist <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL DE RÉORGANISATION */}
      {reorderingTab && (() => {
        const isPast = reorderingTab === 'past';
        const ids = isPast ? selectedConcerts : selectedUpcoming;
        const setIds = isPast ? setSelectedConcerts : setSelectedUpcoming;
        const sourceList = isPast ? concerts : upcomingConcerts;
        const accentColor = isPast ? '#4d94ff' : '#00ff00';
        const accentText = isPast ? 'text-[#4d94ff]' : 'text-[#00ff00]';

        // Hydrate les IDs en objets concert dans l'ordre actuel
        const orderedItems = ids
          .map((id) => sourceList.find((c) => c.id === id))
          .filter(Boolean);

        return (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setReorderingTab(null)}
          >
            <div
              className="bg-[#2d2d2d] border border-[#404040] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#404040]">
                <div className="flex items-center gap-3">
                  <ArrowUpDown className={`w-5 h-5 ${accentText}`} />
                  <div>
                    <h2 className="text-lg font-black uppercase italic text-white">
                      Réorganiser ma sélection
                    </h2>
                    <p className="text-xs text-[#a0a0a0] mt-0.5">
                      L'ordre des concerts ici sera l'ordre dans la playlist générée
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReorderingTab(null)}
                  className="text-[#a0a0a0] hover:text-white transition-colors p-1"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Liste */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2">
                {orderedItems.length === 0 ? (
                  <p className="text-center text-[#a0a0a0] py-8">
                    Aucun concert dans la sélection.
                  </p>
                ) : (
                  orderedItems.map((c: any, idx) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 sm:gap-3 p-3 bg-[#1a1a1a] border border-[#404040] rounded-lg"
                    >
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-full font-black text-xs flex items-center justify-center ${accentText} bg-[#2d2d2d] border border-current`}
                      >
                        {idx + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate text-sm sm:text-base">
                          {getArtistName(c)}
                        </p>
                        <p className="text-xs text-[#a0a0a0] truncate">
                          {getEventDate(c)} · {getVenueName(c)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => moveSelected(ids, setIds, idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-[#3d3d3d] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Monter"
                        >
                          <ChevronUp className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => moveSelected(ids, setIds, idx, 1)}
                          disabled={idx === orderedItems.length - 1}
                          className="p-1 rounded hover:bg-[#3d3d3d] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Descendre"
                        >
                          <ChevronDown className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromSelection(ids, setIds, c.id)}
                        className="flex-shrink-0 p-1.5 rounded hover:bg-red-500/20 text-[#a0a0a0] hover:text-red-400 transition-colors ml-1"
                        title="Retirer de la sélection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#404040] flex justify-end gap-2">
                <Button
                  onClick={() => setReorderingTab(null)}
                  className="bg-transparent border border-[#404040] hover:bg-[#3d3d3d] text-white font-bold"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    setReorderingTab(null);
                    handleGenerate(!isPast);
                  }}
                  disabled={orderedItems.length === 0}
                  style={{ backgroundColor: accentColor }}
                  className="text-white font-bold shadow-lg disabled:opacity-50"
                >
                  {isPast ? 'Générer Playlist' : 'Préparer Playlist'}{' '}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}
