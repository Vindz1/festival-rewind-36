import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Crown, History, Music } from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  // 1. Charger les infos
  useEffect(() => {
    if (user) {
      // Check Premium
      getUserSubscription(user.id).then(sub => {
        setIsPremium(sub.subscription_type === 'premium');
      });

      // Check Historique (Nombre de playlists créées)
      const fetchStats = async () => {
        const { count } = await supabase
          .from('playlists_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setHistoryCount(count || 0);
      };
      fetchStats();
    }
  }, [user]);

  // 2. Fonction de Déconnexion "Brutale" (Force le refresh)
  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/'; // Redirection forcée vers l'accueil
  };

  if (!user) return <div className="text-white pt-32 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      
      <div className="flex-grow max-w-4xl mx-auto w-full px-4">
        <h1 className="text-3xl font-black italic uppercase mb-8 border-b border-[#333] pb-4">Mon Profil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARTE D'IDENTITÉ */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-[#252525] p-6 rounded-2xl border border-[#333] flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-[#333] flex items-center justify-center">
                        <User className="w-10 h-10 text-[#a0a0a0]" />
                    </div>
                    <div>
                        <p className="text-sm text-[#a0a0a0] uppercase font-bold tracking-widest">Compte</p>
                        <p className="text-xl font-bold text-white">{user.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                            {isPremium ? (
                                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Membre Premium
                                </span>
                            ) : (
                                <span className="bg-[#333] text-[#a0a0a0] px-3 py-1 rounded-full text-xs font-bold uppercase">
                                    Membre Gratuit
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* STATS RAPIDES */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#2d2d2d] p-6 rounded-2xl border border-[#404040]">
                        <History className="w-8 h-8 text-[#4d94ff] mb-2" />
                        <p className="text-3xl font-black text-white">{historyCount}</p>
                        <p className="text-sm text-[#a0a0a0]">Playlists générées</p>
                    </div>
                    <div className="bg-[#2d2d2d] p-6 rounded-2xl border border-[#404040] opacity-50">
                        <Music className="w-8 h-8 text-gray-500 mb-2" />
                        <p className="text-sm text-[#a0a0a0] mt-2">Top Artistes (Bientôt)</p>
                    </div>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="space-y-4">
                <Button 
                    onClick={() => navigate('/my-concerts')}
                    className="w-full h-14 bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold"
                >
                    Mes Setlists Sauvegardées
                </Button>
                
                {!isPremium && (
                    <Button 
                        onClick={() => navigate('/subscription')}
                        className="w-full h-14 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                    >
                        Devenir PREMIUM
                    </Button>
                )}

                <Button 
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full h-14 border-red-900/50 text-red-500 hover:bg-red-950 hover:text-red-400 hover:border-red-500"
                >
                    <LogOut className="mr-2 w-4 h-4" /> Se déconnecter
                </Button>
            </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
