import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription, UserSubscription } from '@/lib/subscription';
import { Music, Loader2, Play, ArrowRight, Lock, Crown, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Footer } from '@/components/Footer';
import { saveToHistory } from '@/lib/history';
import { SmartAd } from '@/components/SmartAd';

interface TrackInfo {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  spotifyUri?: string;
  year?: string;
}

interface ArtistWithTracks {
  artistName: string;
  artistId: string;
  artistImage?: string;
  tracks: {
    id: string;
    name: string;
    uri: string;
    album: string;
    albumImage?: string;
    duration: number;
    preview_url?: string;
  }[];
}

export default function Generate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode');
  const isUpcomingMode = mode === 'upcoming';
  
  const { user } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [tracksWithInfo, setTracksWithInfo] = useState<TrackInfo[]>([]);
  
  // États pour le mode "upcoming"
  const [artistsWithTracks, setArtistsWithTracks] = useState<ArtistWithTracks[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [playlistName, setPlaylistName] = useState(
    isUpcomingMode 
      ? `Upcoming - ${new Date().getFullYear()}`
      : `Setlist Live - ${new Date().getFullYear()}`
  );

  // Charger les infos d'abonnement
  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then((sub) => {
        setSubscription(sub);
        setLoadingSubscription(false);
      });
    } else {
      setLoadingSubscription(false);
    }
  }, [user]);

  const canExport = user && (loadingSubscription || subscription?.can_export);

  // Étape 1 : Récupérer les chansons
  useEffect(() => {
    if (isExporting) {
      console.log('⏸️ Export en cours, skip du chargement');
      return;
    }
    
    if (isUpcomingMode) {
      fetchTopTracks();
    } else {
      const fetchSongs = async () => {
        setLoading(true);
        
        const savedConcerts = localStorage.getItem('selected_concerts');
        if (!savedConcerts) {
          toast.error('Aucun concert sélectionné');
          setLoading(false);
          return;
        }
        
        const selectedConcerts = JSON.parse(savedConcerts);
        console.log('📋 Concerts chargés depuis localStorage:', selectedConcerts);
        
        if (selectedConcerts.length === 0) {
          toast.error('Aucun concert sélectionné');
          setLoading(false);
          return;
        }
        
        const all: any[] = [];
        for (const c of selectedConcerts) {
          try {
            const res = await fetch(`/api/search?action=songs&setlistId=${c.id}`);
            const data = await res.json();
            if (data.songs) {
              data.songs.forEach((s: string) => all.push({ 
                artist: c.artist || data.artist, 
                title: s 
              }));
            }
          } catch (error) {
            console.error(`Erreur pour ${c.artist}:`, error);
          }
        }
        
        console.log('🎵 Total songs:', all.length);
        setSongs(all);
        setLoading(false);
      };
      
      fetchSongs();
    }
  }, [isUpcomingMode, isExporting]);

  const fetchTopTracks = async () => {
    setLoading(true);
    try {
      const selected = localStorage.getItem('selected_upcoming');
      if (!selected) {
        toast.error('Aucun artiste sélectionné');
        setLoading(false);
        return;
      }

      const artists = JSON.parse(selected);
      const artistNames = artists.map((a: any) => a.artist);

      console.log('Fetching top tracks for:', artistNames);

      const response = await fetch('/api/top-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artists: artistNames })
      });

      if (!response.ok) throw new Error('Erreur API');

      const data = await response.json();
      console.log('Top tracks received:', data);

      setArtistsWithTracks(data.artists || []);
      
      const allArtistIds = (data.artists || []).map((a: ArtistWithTracks) => a.artistId);
      setSelectedArtists(new Set(allArtistIds));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      toast.error('Erreur lors du chargement des tracks');
      setLoading(false);
    }
  };

  const fetchDetailedInfo = async () => {
    if (tracksWithInfo.length > 0) {
      setShowPreview(true);
      return;
    }

    setSearching(true);
    const detailedTracks: TrackInfo[] = [];

    try {
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        setExportProgress(Math.round(((i + 1) / songs.length) * 100));
        detailedTracks.push({
          title: song.title,
          artist: song.artist,
        });
      }
      setTracksWithInfo(detailedTracks);
      setShowPreview(true);
    } catch (err) {
      console.error('Erreur lors de la prévisualisation:', err);
    } finally {
      setSearching(false);
      setExportProgress(0);
    }
  };

  // --- EXPORT SPOTIFY ---
  // --- EXPORT SPOTIFY ---
  const forceExport = () => {
    console.log('🔥 FORCE EXPORT APPELÉ');
    setIsExporting(true);
    
    if (!user) {
      alert('Connectez-vous d\'abord !');
      setIsExporting(false);
      return;
    }

    // --- VÉRIFICATION DES QUOTAS ---
    if (subscription?.subscription_type === 'premium') {
        console.log("👑 Utilisateur PREMIUM : Export illimité autorisé.");
    } else {
        // Logique pour les utilisateurs GRATUITS
        const today = new Date().toISOString().split('T')[0];
        const lastExportDate = localStorage.getItem('last_export_date');
        let dailyCount = parseInt(localStorage.getItem('daily_export_count') || '0');

        if (lastExportDate !== today) {
            dailyCount = 0;
            localStorage.setItem('last_export_date', today);
        }

        if (dailyCount >= 2 && !subscription?.can_export) {
            toast.error("Limite quotidienne atteinte (2/2). Passez Premium !");
            setIsExporting(false);
            // On pourrait rediriger vers /subscription ici
            setTimeout(() => navigate('/subscription'), 1500);
            return;
        }

        // On incrémente le compteur
        localStorage.setItem('daily_export_count', (dailyCount + 1).toString());
    }
    
    // --- SUITE NORMALE DE L'EXPORT ---
    const client_id = "927dd1fd048148d3b71cb0b9e109af6e";
    const redirectUri = "https://festivalrewind.vercel.app/spotify-callback";
    
    if (isUpcomingMode) {
      const selectedTracks = artistsWithTracks
        .filter(artist => selectedArtists.has(artist.artistId))
        .flatMap(artist => 
          artist.tracks.map(track => ({
            title: track.name,
            artist: artist.artistName,
            uri: track.uri
          }))
        );
        
      console.log('💾 Sauvegarde tracks upcoming:', selectedTracks.length);
      localStorage.setItem('pending_songs', JSON.stringify(selectedTracks));
    } else {
      console.log('💾 Sauvegarde songs setlist:', songs.length);
      localStorage.setItem('pending_songs', JSON.stringify(songs));
    }
    
    localStorage.setItem('playlist_name', playlistName || 'Setlist Live');
    // --- AJOUT DE L'HISTORIQUE ---
    // On prépare la liste des tracks pour l'historique
    let tracksForHistory = [];
    if (isUpcomingMode) {
         tracksForHistory = artistsWithTracks
        .filter(artist => selectedArtists.has(artist.artistId))
        .flatMap(artist => artist.tracks.map(t => ({ artist: artist.artistName })));
    } else {
         tracksForHistory = songs.map(s => ({ artist: s.artist }));
    }
    
    if (user) {
        // On n'attend pas le 'await' pour ne pas ralentir la redirection
        saveToHistory({
            userId: user.id,
            playlistName: playlistName,
            tracks: tracksForHistory,
            sourceType: isUpcomingMode ? 'upcoming' : 'concert',
            platform: 'spotify'
        });
    }
    // -----------------------------
    const url = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=playlist-modify-public%20playlist-modify-private`;
    
    console.log('🚀 REDIRECTION VERS:', url);
    window.location.href = url;
  };

  // --- EXPORT UNIVERSEL (CSV) ---
  const handleUniversalExport = () => {
    if (tracksWithInfo.length === 0 && songs.length === 0) {
      toast.error("Aucun titre à exporter");
      return;
    }

    // Utiliser tracksWithInfo si dispo (plus complet), sinon songs (plus basique)
    const listToExport = tracksWithInfo.length > 0 ? tracksWithInfo : songs;
    // --- AJOUT DE L'HISTORIQUE ---
    if (user) {
        saveToHistory({
            userId: user.id,
            playlistName: playlistName,
            tracks: listToExport.map(t => ({ artist: t.artist })),
            sourceType: isUpcomingMode ? 'upcoming' : 'concert',
            platform: 'csv'
        });
    }
    // -----------------------------
    const csvHeader = "Title,Artist\n";
    const csvRows = listToExport.map(track => {
      // Nettoyage des virgules
      const cleanTitle = track.title.replace(/,/g, '');
      const cleanArtist = track.artist.replace(/,/g, '');
      return `${cleanTitle},${cleanArtist}`;
    }).join("\n");

    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${playlistName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Fichier exporté !");
  };

  const toggleArtist = (artistId: string) => {
    const newSelection = new Set(selectedArtists);
    if (newSelection.has(artistId)) {
      newSelection.delete(artistId);
    } else {
      newSelection.add(artistId);
    }
    setSelectedArtists(newSelection);
  };

  const totalSelectedTracks = artistsWithTracks
    .filter(artist => selectedArtists.has(artist.artistId))
    .reduce((sum, artist) => sum + artist.tracks.length, 0);


  // --- RENDU ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-[#4d94ff]" />
          <p className="text-xl text-[#a0a0a0]">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-[#4d94ff] selection:text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8 pt-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* BOUTON RETOUR */}
        <div className="mb-6">
            <Button 
                variant="ghost" 
                onClick={() => navigate(isUpcomingMode ? '/my-concerts?tab=future' : '/my-concerts?tab=past')}
                className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d2d] gap-2 pl-0"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour à la sélection
            </Button>
        </div>
          
        {/* CONTENU PRINCIPAL */}
        <div className="space-y-8">
            
            <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold italic tracking-tight">
                    <span className="text-[#4d94ff] drop-shadow-[0_0_15px_rgba(77,148,255,0.5)]">
                        {isUpcomingMode ? totalSelectedTracks : songs.length}
                    </span> TITRES
                </h1>
                <p className="text-[#a0a0a0]">
                   {isUpcomingMode ? 'Top tracks sélectionnés' : 'Setlists récupérées'}
                </p>
            </div>

            {!user && (
                <Alert className="max-w-xl mx-auto bg-[#2d2d2d] border-[#404040]">
                <Lock className="h-4 w-4 text-[#a0a0a0]" />
                <AlertDescription className="text-gray-300">
                    <strong>Connectez-vous</strong> pour exporter.
                    <Link to="/auth" className="ml-2 underline text-[#4d94ff]">Se connecter</Link>
                </AlertDescription>
                </Alert>
            )}

            <div className="max-w-xl mx-auto">
                <label className="block text-sm font-medium mb-2 text-gray-400">Nom de la playlist</label>
                <div className="relative">
                    <input
                        type="text"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        className="w-full pl-4 pr-10 py-4 bg-[#2d2d2d] border border-[#404040] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#4d94ff]"
                    />
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4d94ff] w-5 h-5 opacity-50" />
                </div>
            </div>

            {/* LISTE ARTISTES (UPCOMING) */}
            {isUpcomingMode && (
                <div className="space-y-4">
                    {artistsWithTracks.map((artist) => {
                    const isSelected = selectedArtists.has(artist.artistId);
                    return (
                        <div
                        key={artist.artistId}
                        onClick={() => toggleArtist(artist.artistId)}
                        className={`bg-[#2d2d2d] border rounded-xl p-4 cursor-pointer ${isSelected ? 'border-[#4d94ff] bg-[#4d94ff]/5' : 'border-[#404040]'}`}
                        >
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-bold text-white">{artist.artistName}</h3>
                                {isSelected && <CheckCircle2 className="w-5 h-5 text-[#4d94ff]" />}
                            </div>
                        </div>
                    );
                    })}
                </div>
            )}

           {/* LISTE PREVIEW (PAST) */}
            {!isUpcomingMode && showPreview && (
                <div className="bg-[#2d2d2d] rounded-3xl border border-[#404040] p-6 shadow-2xl animate-in slide-in-from-bottom-8">
                    <h2 className="text-xl font-bold mb-6 text-white border-b border-[#404040] pb-4">
                        Prévisualisation ({tracksWithInfo.length} titres)
                    </h2>
                    
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {tracksWithInfo.map((track, index) => (
                        /* IMPORTANT : On met la "key" sur cette div enveloppe 
                           pour qu'elle contienne le morceau + la pub potentielle 
                        */
                        <div key={index}>
                            
                            {/* --- LE MORCEAU (Ton design actuel) --- */}
                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#3d3d3d] transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                                        {track.title}
                                    </p>
                                    <p className="text-xs text-[#a0a0a0] truncate">
                                        {track.artist}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-600 font-mono w-6 text-right">
                                    {index + 1}
                                </div>
                            </div>

                            {/* --- LA PUB INTELLIGENTE (Nouveau) --- */}
                            {/* On affiche une pub tous les 8 morceaux, SAUF si Premium */}
                            {(index + 1) % 8 === 0 && subscription?.subscription_type !== 'premium' && (
                                <SmartAd artistName={track.artist} index={index} />
                            )}
                            
                        </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="sticky bottom-6 z-10 max-w-xl mx-auto space-y-4 pb-4 px-2">
                
                {/* 1. BOUTON PRÉVISUALISER (Optionnel : S'affiche si on a des chansons mais qu'on a pas encore cliqué) */}
                {!isUpcomingMode && !showPreview && songs.length > 0 && (
                    <>
                        <Button 
                            onClick={fetchDetailedInfo} 
                            disabled={searching}
                            variant="outline"
                            className="w-full h-14 text-md font-bold border-[#4d94ff]/50 text-[#4d94ff] hover:bg-[#4d94ff] hover:text-white bg-[#1a1a1a]/90 backdrop-blur mb-2"
                        >
                        {searching ? (
                            <>
                            <Loader2 className="mr-3 animate-spin" /> Analyse... {exportProgress}%
                            </>
                        ) : (
                            <>
                            <Play className="mr-3 w-4 h-4" /> Voir le détail des titres avant export
                            </>
                        )}
                        </Button>
                        {searching && <Progress value={exportProgress} className="w-full h-1.5 bg-[#2d2d2d] [&>div]:bg-[#4d94ff]" />}
                    </>
                )}

                {/* 2. BOUTONS D'EXPORT (S'affichent DÈS QU'IL Y A DES DONNÉES) */}
                {/* Condition changée : soit on est en Upcoming, soit on a des chansons dans la liste */}
                {(isUpcomingMode || songs.length > 0) && (
                    <div className="space-y-3 animate-in slide-in-from-bottom-4 fade-in">
                        
                        {/* A. Spotify */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-[#4d94ff]/20 blur-xl rounded-full animate-pulse"></div>
                            <Button 
                                onClick={forceExport}
                                // En Upcoming : désactivé si 0 artiste. En Past : désactivé si chargement
                                disabled={(isUpcomingMode && selectedArtists.size === 0) || loading}
                                className="relative w-full h-16 text-xl font-bold bg-[#4d94ff] hover:bg-[#6ba6ff] text-white shadow-xl rounded-xl"
                            >
                                {!user && <Lock className="mr-3 w-5 h-5" />}
                                <div className="flex items-center gap-2">
                                    <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" className="h-6 w-auto mr-1 opacity-90" />
                                    <span>{!user ? 'Se connecter' : 'Créer la playlist'}</span>
                                </div>
                            </Button>
                        </div>

                        {/* B. Export Universel */}
                        <Button 
                            onClick={handleUniversalExport}
                            variant="ghost"
                            className="w-full h-auto py-2 text-sm font-medium text-[#a0a0a0] hover:text-white hover:bg-[#2d2d2d] border border-transparent hover:border-[#404040] rounded-lg"
                        >
                            <span className="text-lg mr-2">📂</span>
                            <span>Télécharger le fichier (Apple Music, Deezer...)</span>
                        </Button>
                    </div>
                )}

                {/* 3. Pub Premium */}
                {user && subscription?.subscription_type === 'free' && !subscription.can_export && (
                    <div className="text-center">
                        <Button variant="ghost" size="sm" className="gap-2 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10">
                            <Crown className="w-4 h-4" /> Passer à Premium
                        </Button>
                    </div>
                )}
            </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
