import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserConcerts } from '@/hooks/useUserConcerts';
import { Music, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GeneratePlaylist() {
  const { concerts } = useUserConcerts();
  const [loading, setLoading] = useState(false);
  const [allSongs, setAllSongs] = useState<string[]>([]);
  const [step, setStep] = useState<'review' | 'exporting' | 'done'>('review');

  // Charger toutes les chansons des concerts sélectionnés
  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);
      const songList: string[] = [];
      for (const concert of concerts) {
        try {
          const res = await fetch(`/api/search?action=setlist&setlistId=${concert.setlist_id}`);
          const data = await res.json();
          if (data.setlist?.songs) {
            songList.push(...data.setlist.songs.map((s: string) => `${concert.artist_name} - ${s}`));
          }
        } catch (e) { console.error(e); }
      }
      setAllSongs(songList);
      setLoading(false);
    };
    if (concerts.length > 0) loadSongs();
  }, [concerts]);

  const handleSpotifyExport = async () => {
    setStep('exporting');
    // Simulation de l'export Spotify (en attendant tes clés Client Secret)
    setTimeout(() => {
      setStep('done');
      toast.success("Playlist créée avec succès !");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <Header />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-display mb-8 italic">Ma Time Capsule</h1>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-primary mb-4" />
            <p>Récupération de tes souvenirs musicaux...</p>
          </div>
        ) : step === 'done' ? (
          <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-primary/50">
            <CheckCircle2 className="h-20 w-20 mx-auto text-primary mb-6" />
            <h2 className="text-2xl font-bold mb-4">C'est prêt !</h2>
            <p className="mb-8 text-zinc-400">Ta playlist est maintenant disponible sur ton compte Spotify.</p>
            <Button variant="fire" onClick={() => window.open('https://open.spotify.com', '_blank')}>Ouvrir Spotify</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h3 className="text-xl font-bold mb-4">{concerts.length} Concerts sélectionnés</h3>
              <p className="text-zinc-500 mb-6">{allSongs.length} titres vont être ajoutés à ta playlist.</p>
              
              <div className="max-h-60 overflow-y-auto space-y-2 mb-8 pr-2">
                {allSongs.map((s, i) => (
                  <div key={i} className="text-sm text-zinc-400 border-b border-zinc-800 pb-1">{s}</div>
                ))}
              </div>

              <Button 
                variant="fire" 
                className="w-full h-16 text-xl font-bold" 
                onClick={handleSpotifyExport}
                disabled={allSongs.length === 0 || step === 'exporting'}
              >
                {step === 'exporting' ? <Loader2 className="animate-spin mr-2" /> : <Music className="mr-2" />}
                Générer sur Spotify
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
