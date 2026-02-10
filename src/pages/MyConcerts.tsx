import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/AuthContext';
import { supabase } from '@/supabaseClient'; // Assurez-vous que le chemin est bon (parfois @/integrations/supabase/client)
import { getUserSubscription } from '@/lib/subscription';
import { SmartAd } from '@/components/SmartAd';
import { Calendar, FileJson, Music, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function MyConcerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user) {
      // 1. Charger l'historique des playlists générées
      const fetchHistory = async () => {
        const { data, error } = await supabase
          .from('playlists_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) console.error('Erreur historique:', error);
        else setHistory(data || []);
        
        setLoading(false);
      };
      fetchHistory();

      // 2. Vérifier si l'utilisateur est Premium (pour cacher les pubs)
      getUserSubscription(user.id).then(sub => {
         setIsPremium(sub.subscription_type === 'premium');
      });
    } else {
        setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#4d94ff] w-12 h-12"/>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 pb-12">
        <div className="flex items-center justify-between mb-8 border-b border-[#333] pb-4">
            <h1 className="text-3xl font-black italic uppercase">Mes Setlists</h1>
            <Button onClick={() => navigate('/')} variant="outline" className="text-[#a0a0a0] border-[#404040] hover:text-white">
                Nouveau Concert <ArrowRight className="ml-2 w-4 h-4"/>
            </Button>
        </div>

        {history.length === 0 ? (
            <div className="text-center py-20 bg-[#252525] rounded-3xl border border-[#333]">
                <Music className="w-16 h-16 text-[#404040] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">C'est vide ici !</h3>
                <p className="text-[#a0a0a0] mb-6">Vous n'avez pas encore généré de playlist.</p>
                <Button onClick={() => navigate('/')} className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold">
                    Créer ma première playlist
                </Button>
            </div>
        ) : (
            <div className="grid gap-6">
                {history.map((playlist, index) => {
                    // On récupère le nom du premier artiste pour cibler la pub
                    const mainArtist = (playlist.top_artists && playlist.top_artists[0]) 
                                        ? playlist.top_artists[0] 
                                        : "Metallica"; 

                    return (
                        <div key={playlist.id}>
                            {/* CARTE DE LA PLAYLIST */}
                            <div className="bg-[#252525] border border-[#333] rounded-xl p-6 hover:border-[#4d94ff]/50 transition-all group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#4d94ff] transition-colors">{playlist.playlist_name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(playlist.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {playlist.platform_target === 'spotify' ? (
                                        <div className="bg-[#1DB954]/20 text-[#1DB954] p-2 rounded-full" title="Exporté sur Spotify">
                                            <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" className="w-6 h-6" alt="Spotify" />
                                        </div>
                                    ) : (
                                        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-full" title="Fichier téléchargé">
                                            <FileJson className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#333]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black text-white">{playlist.track_count}</span>
                                        <span className="text-xs text-[#a0a0a0] uppercase font-bold tracking-widest">Titres</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {playlist.top_artists?.slice(0, 3).map((artist: string, i: number) => (
                                            <span key={i} className="text-xs bg-[#1a1a1a] px-2 py-1 rounded text-[#a0a0a0] border border-[#333]">
                                                {artist}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* --- LA PUB INTELLIGENTE --- */}
                            {/* Une pub toutes les 3 cartes, SI l'utilisateur n'est pas premium */}
                            {(index + 1) % 3 === 0 && !isPremium && (
                                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
                                    <SmartAd artistName={mainArtist} index={index} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
