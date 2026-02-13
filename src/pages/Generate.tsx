import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Copy, ExternalLink, Check, ArrowLeft, Loader2, AlertCircle, Music } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';
import { getUserSubscription } from '@/lib/subscription';

interface Track {
  artist: string;
  name: string;
}

interface ConcertData {
  id?: string;
  artist: string | { name: string };
  venue?: string;
  eventDate?: string;
  isFuture?: boolean;
  sets?: any;
  tracks?: Track[];
}

export default function Generate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [songs, setSongs] = useState<Track[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [mainArtist, setMainArtist] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analyse...');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    processGeneration();
  }, [location.state]);

  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then(sub => {
        setIsPremium(sub.subscription_type === 'premium');
      }).catch(err => {
        console.error('Erreur récupération subscription:', err);
      });
    }
  }, [user]);

  const processGeneration = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const stateData = location.state;
      const mode = searchParams.get('mode');
      
      let dataToUse: ConcertData[] = [];
      let type: 'festival' | 'past' | 'future' | null = null;
      let pName = "Ma Setlist";

      console.log('🔍 State data:', stateData);
      console.log('🔍 Mode:', mode);

      // PRIORITÉ 1 : Hellfest/Festival (FUTUR = iTunes uniquement)
      if (stateData?.artists && Array.isArray(stateData.artists)) {
        console.log('✅ Mode: Hellfest/Festival → iTunes uniquement');
        type = 'festival';
        dataToUse = stateData.artists.map((artistName: string) => ({
          artist: artistName,
          isFuture: true,
          id: artistName.toLowerCase().replace(/\s+/g, '-')
        }));
        pName = stateData.eventName || "Festival Playlist";
      } 
      // PRIORITÉ 2 : I'm Going (FUTUR = iTunes uniquement)
      else if (mode === 'upcoming') {
        console.log('✅ Mode: I\'m Going → iTunes uniquement');
        type = 'future';
        const futureRaw = localStorage.getItem('selected_upcoming');
        if (futureRaw) {
          const parsed = JSON.parse(futureRaw);
          dataToUse = parsed.map((c: any) => ({
            ...c,
            artist: c.artist?.name || c.artist,
            isFuture: true
          }));
          pName = parsed.length === 1 
            ? `${dataToUse[0].artist} - Warmup` 
            : "Ma Sélection Future";
        }
      }
      // PRIORITÉ 3 : I Was There (PASSÉ = Setlist.fm STRICT)
      else {
        console.log('✅ Mode: I Was There → Setlist.fm uniquement');
        type = 'past';
        const pastRaw = localStorage.getItem('selected_concerts');
        if (pastRaw) {
          const parsed = JSON.parse(pastRaw);
          dataToUse = parsed.map((c: any) => ({
            ...c,
            artist: c.artist?.name || c.artist,
            isFuture: false
          }));
          pName = parsed.length === 1 
            ? `${dataToUse[0].artist} Live` 
            : "Mes Concerts (Passés)";
        }
      }

      console.log('📊 Data to use:', dataToUse);
      console.log('📊 Type:', type);

      if (!type || dataToUse.length === 0) {
        throw new Error("Aucun concert ou artiste sélectionné.");
      }

      setPlaylistName(pName);

      // === EXTRACTION DES MORCEAUX ===
      const isFutureMode = type === 'festival' || type === 'future';
      setLoadingMessage(
        isFutureMode 
          ? `Récupération du Top 10 pour ${dataToUse.length} artiste(s)...` 
          : "Extraction des setlists réelles..."
      );

      const finalTracks: Track[] = [];
      let processedCount = 0;
      const concertsWithoutSetlist: string[] = [];

      for (const item of dataToUse) {
        processedCount++;
        const currentArtist = typeof item.artist === 'string' 
          ? item.artist 
          : item.artist?.name || "Artiste Inconnu";

        console.log(`🎵 Processing ${processedCount}/${dataToUse.length}: ${currentArtist}`);
        setLoadingMessage(`${processedCount}/${dataToUse.length} - ${currentArtist}...`);
        
        try {
          if (item.isFuture) {
            // ========== MODE FUTUR : ITUNES UNIQUEMENT ==========
            console.log('  → Mode FUTUR : iTunes');
            const top = await fetchItunes(currentArtist, 10);
            console.log(`  ✅ iTunes: ${top.length} tracks`);
            finalTracks.push(...top);
          } else {
            // ========== MODE PASSÉ : SETLIST.FM STRICT ==========
            console.log('  → Mode PASSÉ : Setlist.fm strict');
            const tracks = extractFromSetlist(item, currentArtist);
            console.log(`  ✅ Setlist: ${tracks.length} tracks`);
            
            if (tracks.length > 0) {
              finalTracks.push(...tracks);
            } else {
              // Pas de fallback iTunes ! On note juste le concert sans setlist
              concertsWithoutSetlist.push(currentArtist);
              console.warn(`  ⚠️ Aucune setlist pour ${currentArtist}`);
            }
          }
        } catch (err) {
          console.error(`  ❌ Erreur pour ${currentArtist}:`, err);
        }
      }

      console.log('📝 Total tracks before dedup:', finalTracks.length);

      // Déduplication
      const uniqueTracks = deduplicateTracks(finalTracks);
      console.log('📝 Total tracks after dedup:', uniqueTracks.length);

      // Message d'erreur adapté
      if (uniqueTracks.length === 0) {
        if (isFutureMode) {
          throw new Error("Impossible de récupérer les morceaux. Vérifiez les noms d'artistes.");
        } else {
          throw new Error(
            concertsWithoutSetlist.length > 0
              ? `Aucune setlist renseignée sur Setlist.fm pour : ${concertsWithoutSetlist.join(', ')}`
              : "Aucune setlist trouvée pour ces concerts."
          );
        }
      }

      // Message d'avertissement si certains concerts n'ont pas de setlist
      if (!isFutureMode && concertsWithoutSetlist.length > 0) {
        toast.warning(
          `${concertsWithoutSetlist.length} concert(s) sans setlist : ${concertsWithoutSetlist.join(', ')}`,
          { duration: 5000 }
        );
      }

      setSongs(uniqueTracks);
      setMainArtist(uniqueTracks[0].artist);

      // Sauvegarde historique
      if (user) {
        try {
          await saveToHistory(user.id, {
            name: pName,
            songs: uniqueTracks,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.error('Erreur sauvegarde historique:', err);
        }
      }

      // Nettoyage localStorage
      if (type === 'festival') {
        localStorage.removeItem('selected_concerts');
        localStorage.removeItem('selected_upcoming');
      } else if (type === 'past') {
        localStorage.removeItem('selected_concerts');
      } else if (type === 'future') {
        localStorage.removeItem('selected_upcoming');
      }

      toast.success(`${uniqueTracks.length} morceaux prêts ! 🎉`);

    } catch (err: any) {
      console.error('❌ Erreur génération:', err);
      setErrorMsg(err.message || "Une erreur est survenue.");
      toast.error('Erreur de génération');
    } finally {
      setLoading(false);
    }
  };

  // === EXTRACTION SETLIST.FM ===
  const extractFromSetlist = (concert: ConcertData, defaultArtist: string): Track[] => {
    const result: Track[] = [];
    
    console.log('🔍 Extraction setlist pour:', defaultArtist);
    console.log('🔍 Structure concert:', { 
      hasTracksArray: !!concert.tracks,
      hasSets: !!concert.sets,
      setsStructure: concert.sets 
    });
    
    // Cas 1 : Tracks déjà formatées
    if (concert.tracks && Array.isArray(concert.tracks)) {
      console.log('✅ Cas 1: tracks déjà formatées');
      return concert.tracks.filter(t => 
        t.name && 
        t.name.trim() !== '' && 
        t.name.toLowerCase() !== 'titre inconnu' &&
        t.name.toLowerCase() !== 'unknown'
      );
    }

    // Cas 2 : Structure brute Setlist.fm
    if (concert.sets?.set) {
      const sets = Array.isArray(concert.sets.set) 
        ? concert.sets.set 
        : [concert.sets.set];
      
      console.log(`✅ Cas 2: ${sets.length} set(s) trouvé(s)`);
      
      sets.forEach((s: any, setIndex: number) => {
        if (!s.song) {
          console.log(`  ⚠️ Set ${setIndex} sans songs`);
          return;
        }
        
        const songs = Array.isArray(s.song) ? s.song : [s.song];
        console.log(`  → Set ${setIndex}: ${songs.length} song(s)`);
        
        songs.forEach((song: any) => {
          // Filtrer les tapes, inconnus, etc.
          if (song.tape) {
            console.log(`    ⏭️ Skip (tape):`, song.name);
            return;
          }
          if (!song.name || song.name.trim() === '') {
            console.log(`    ⏭️ Skip (empty name)`);
            return;
          }
          if (song.name.toLowerCase().includes('unknown')) {
            console.log(`    ⏭️ Skip (unknown):`, song.name);
            return;
          }
          
          result.push({
            artist: song.cover?.name || defaultArtist,
            name: song.name.trim()
          });
        });
      });
    }

    console.log(`✅ Extraction terminée: ${result.length} track(s)`);
    return result;
  };

  // === ITUNES API ===
  const fetchItunes = async (artist: string, limit: number = 10): Promise<Track[]> => {
    try {
      const searchLimit = Math.max(limit * 5, 50);
      
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${searchLimit}&country=US`
      );
      
      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.warn(`Aucun résultat iTunes pour: ${artist}`);
        return [];
      }
      
      const normalizedSearchArtist = normalizeString(artist);
      
      const scoredResults = data.results
        .map((item: any) => {
          const normalizedArtistName = normalizeString(item.artistName);
          let score = 0;
          
          if (normalizedArtistName === normalizedSearchArtist) {
            score += 100;
          } else if (normalizedArtistName.includes(normalizedSearchArtist)) {
            score += 50;
          } else {
            return { ...item, score: 0 };
          }
          
          return { ...item, score };
        })
        .filter(item => item.score > 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      console.log(`  📊 iTunes ${artist}: ${data.results.length} bruts → ${scoredResults.length} filtrés`);
      
      return scoredResults.map((item: any) => ({
        artist: item.artistName,
        name: item.trackName
      }));
    } catch (err) {
      console.error(`Erreur iTunes pour ${artist}:`, err);
      return [];
    }
  };

  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  };

  const deduplicateTracks = (tracks: Track[]): Track[] => {
    const seen = new Set<string>();
    const unique: Track[] = [];

    tracks.forEach(track => {
      const normalizedName = normalizeString(track.name);
      const normalizedArtist = normalizeString(track.artist);
      const key = `${normalizedArtist}|||${normalizedName}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(track);
      }
    });

    return unique;
  };

  const handleCopy = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Liste copiée !");
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Erreur copie:', err);
      toast.error("Erreur lors de la copie");
    });
  };

  const handleDownload = () => {
    const text = songs.map(s => `${s.artist} - ${s.name}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlistName.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Fichier téléchargé !");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12 mb-4" />
        <p className="text-[#a0a0a0] font-mono uppercase tracking-widest text-xs">
          {loadingMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col font-sans">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-20">
        
        {errorMsg ? (
          <div className="bg-[#252525] border border-red-500/30 p-12 rounded-3xl text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black italic uppercase mb-4">Oups !</h2>
            <p className="text-[#a0a0a0] mb-8 font-medium leading-relaxed">{errorMsg}</p>
            <Button 
              onClick={() => navigate(-1)} 
              className="bg-white text-black hover:bg-[#4d94ff] hover:text-white rounded-none px-8 font-black italic uppercase"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Retour
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-8xl font-black italic uppercase mb-4 tracking-tighter leading-none">
                C'est prêt !
              </h1>
              <div className="inline-block bg-[#4d94ff] text-white px-6 py-2 text-xl md:text-2xl font-black italic uppercase skew-x-[-12deg] shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
                {songs.length} MORCEAUX
              </div>
              <p className="text-[#666] mt-6 font-bold uppercase tracking-widest text-sm">
                {playlistName}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-[#252525] border border-[#333] rounded-3xl p-10 flex flex-col justify-between shadow-xl group hover:border-[#4d94ff] transition-all">
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#00ff00] text-black w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic">
                      1
                    </span> 
                    Copier
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Copiez la liste pour l'importer via TuneMyMusic.
                  </p>
                </div>
                <Button 
                  onClick={handleCopy} 
                  className={`w-full h-24 text-2xl font-black italic uppercase transition-all rounded-none shadow-[8px_8px_0px_rgba(0,0,0,0.3)] ${
                    copied 
                      ? 'bg-[#00ff00] text-black' 
                      : 'bg-[#4d94ff] text-white hover:bg-white hover:text-black'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 w-6 h-6" /> Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 w-6 h-6" /> Copier
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl p-10 flex flex-col justify-between shadow-xl group hover:border-white transition-all">
                <div>
                  <h3 className="text-3xl font-black italic uppercase mb-4 flex items-center gap-3">
                    <span className="bg-[#4d94ff] text-white w-10 h-10 rounded-full flex items-center justify-center text-lg not-italic">
                      2
                    </span> 
                    Importer
                  </h3>
                  <p className="text-[#a0a0a0] mb-8 text-sm font-bold uppercase tracking-tight leading-relaxed">
                    Sur TuneMyMusic, choisissez "Texte" et collez.
                  </p>
                </div>
                <a 
                  href="https://www.tunemymusic.com/fr/transfer" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-2 w-full py-8 bg-white text-black font-black italic uppercase transition-all hover:bg-[#4d94ff] hover:text-white text-xl shadow-[8px_8px_0px_rgba(77,148,255,0.2)]"
                >
                  TuneMyMusic
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            <details className="bg-[#252525] border border-[#333] rounded-xl overflow-hidden mb-8">
              <summary className="cursor-pointer p-6 font-black uppercase text-lg hover:bg-[#2d2d2d] transition-colors flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Music className="w-5 h-5" /> Liste complète
                </span>
                <span className="text-[#666] text-sm">{songs.length} titres</span>
              </summary>
              <div className="p-6 pt-0 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {songs.map((song, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded bg-[#1a1a1a] hover:bg-[#2d2d2d] transition-colors"
                    >
                      <span className="text-[#666] font-mono text-sm min-w-[2rem]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{song.name}</p>
                        <p className="text-sm text-[#a0a0a0] truncate">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            <div className="text-center">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-[#333] text-white hover:bg-[#2d2d2d]"
              >
                <Download className="mr-2 w-4 h-4" />
                Télécharger (.txt)
              </Button>
            </div>

            {!isPremium && mainArtist && (
              <div className="mt-20 pt-10 border-t border-[#333]">
                <SmartAd artistName={mainArtist} index={0} />
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
