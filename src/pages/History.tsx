import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { Calendar, Music, TrendingUp, Trash2, Crown, Download, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';
import { checkExportQuota } from '@/lib/subscription';

interface PlaylistHistory {
  id: string;
  playlist_name: string;
  track_count: number;
  top_artists: string[];
  source_type: 'concert' | 'upcoming';
  created_at: string;
}

interface ExportHistory {
  id: string;
  playlist_name: string;
  track_count: number;
  created_at: string;
}

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [playlists, setPlaylists] = useState<PlaylistHistory[]>([]);
  const [exports, setExports] = useState<ExportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [quota, setQuota] = useState({ remaining: 0, used: 0 });
  const [activeTab, setActiveTab] = useState<'playlists' | 'exports'>('playlists');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Charger le quota
      const quotaData = await checkExportQuota(user.id);
      setIsPremium(quotaData.isPremium);
      setQuota({ remaining: quotaData.remaining, used: quotaData.used });

      // Charger l'historique des playlists générées (TOUJOURS, même en gratuit)
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (playlistError) throw playlistError;
      setPlaylists(playlistData || []);

      // Charger l'historique des exports
      const { data: exportData, error: exportError } = await supabase
        .from('playlist_exports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (exportError) throw exportError;
      setExports(exportData || []);

    } catch (error) {
      console.error('Erreur chargement historique:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!confirm('Supprimer cette playlist de l\'historique ?')) return;

    try {
      const { error } = await supabase
        .from('playlists_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setPlaylists(prev => prev.filter(p => p.id !== id));
      toast.success('Playlist supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-[#4d94ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      
      <div className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 pb-20">
        
        {/* En-tête */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase mb-4">Mon Historique</h1>
          <p className="text-sm sm:text-base text-gray-400">
            {isPremium ? 'Toutes vos playlists générées et vos exports' : 'Vos exports de l\'année'}
          </p>
        </div>

        {/* Stats Quota */}
        <div className="grid gap-4 sm:gap-6 mb-8 sm:mb-12 grid-cols-1 sm:grid-cols-3">
          
          {/* Total Playlists */}
          <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#333] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <Music className="w-8 h-8 sm:w-10 sm:h-10 text-[#4d94ff]" />
              <span className="text-2xl sm:text-3xl font-black">{playlists.length}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold uppercase tracking-wider">
              Playlists générées
            </p>
          </div>

          {/* Exports cette année */}
          <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border border-[#333] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <Download className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
              <span className="text-2xl sm:text-3xl font-black">{exports.length}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold uppercase tracking-wider">
              Exports cette année
            </p>
          </div>

          {/* Quota restant */}
          <div className={`bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border rounded-2xl p-5 sm:p-6 ${
            isPremium ? 'border-yellow-500/30' : quota.remaining === 0 ? 'border-red-500/30' : 'border-[#333]'
          }`}>
            <div className="flex items-center justify-between mb-3">
              {isPremium ? (
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
              ) : (
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
              )}
              <span className={`text-2xl sm:text-3xl font-black ${
                isPremium ? 'text-yellow-500' : quota.remaining === 0 ? 'text-red-400' : 'text-white'
              }`}>
                {isPremium ? '∞' : quota.remaining}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold uppercase tracking-wider">
              {isPremium ? 'Exports illimités' : 'Exports restants'}
            </p>
          </div>

        </div>

        {/* Message Premium */}
        {!isPremium && (
          <div className="mb-8 p-4 sm:p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm sm:text-base text-white mb-1">
                  Passez Premium pour débloquer l'historique complet
                </p>
                <p className="text-xs sm:text-sm text-yellow-200">
                  Exports illimités + historique complet + zéro pub
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/subscription')}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 rounded-lg whitespace-nowrap w-full sm:w-auto"
            >
              Voir les offres
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[#333] mb-6 sm:mb-8">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('playlists')}
              className={`pb-3 sm:pb-4 border-b-2 font-bold text-sm sm:text-base whitespace-nowrap transition-colors ${
                activeTab === 'playlists' 
                  ? 'border-[#4d94ff] text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Playlists générées ({playlists.length})
              {!isPremium && <Crown className="inline-block w-3 h-3 ml-1 text-yellow-500" />}
            </button>
            <button 
              onClick={() => setActiveTab('exports')}
              className={`pb-3 sm:pb-4 border-b-2 font-bold text-sm sm:text-base whitespace-nowrap transition-colors ${
                activeTab === 'exports' 
                  ? 'border-[#4d94ff] text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Exports ({exports.length})
            </button>
          </div>
        </div>

        {/* Liste des playlists OU exports */}
        {activeTab === 'playlists' ? (
          // ONGLET PLAYLISTS
          isPremium ? (
            // PREMIUM : Afficher l'historique complet
            playlists.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-400">Aucune playlist générée</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">
                  Commencez par créer votre première playlist !
                </p>
                <Button 
                  onClick={() => navigate('/my-concerts')}
                  className="bg-[#4d94ff] hover:bg-[#6ba6ff] text-white font-bold px-6 sm:px-8 rounded-lg"
                >
                  Mes concerts
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {playlists.map((playlist) => (
                  <div 
                    key={playlist.id}
                    className="bg-[#252525] border border-[#333] hover:border-[#4d94ff]/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-xl font-bold mb-2 truncate">{playlist.playlist_name}</h3>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {playlist.track_count} morceaux
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {formatDate(playlist.created_at)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                            playlist.source_type === 'concert' 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : 'bg-green-500/10 text-green-400'
                          }`}>
                            {playlist.source_type === 'concert' ? 'Concert passé' : 'À venir'}
                          </span>
                        </div>

                        {/* Top artistes */}
                        {playlist.top_artists && playlist.top_artists.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="truncate">
                              {playlist.top_artists.slice(0, 3).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                          onClick={() => deletePlaylist(playlist.id)}
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // GRATUIT : Afficher incitation Premium (les données restent sauvegardées en DB)
            <div className="bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] border-2 border-yellow-500/30 rounded-3xl p-8 sm:p-12 text-center">
              <div className="max-w-2xl mx-auto">
                <Crown className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-500 mx-auto mb-6" />
                
                <h2 className="text-2xl sm:text-4xl font-black italic uppercase mb-4 text-white">
                  Historique Premium
                </h2>
                
                <p className="text-sm sm:text-lg text-gray-300 mb-8">
                  L'historique complet de vos playlists générées est réservé aux membres Premium. 
                  <span className="block mt-2 text-yellow-400 font-semibold">
                    {playlists.length > 0 ? (
                      <>Vos {playlists.length} playlist{playlists.length > 1 ? 's' : ''} {playlists.length > 1 ? 'sont' : 'est'} sauvegardée{playlists.length > 1 ? 's' : ''} et {playlists.length > 1 ? 'seront' : 'sera'} visible{playlists.length > 1 ? 's' : ''} dès votre passage Premium !</>
                    ) : (
                      <>Toutes vos futures playlists seront automatiquement sauvegardées !</>
                    )}
                  </span>
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-8">
                  <h3 className="font-bold text-lg sm:text-xl mb-4 text-white">
                    Avec Premium, débloquez :
                  </h3>
                  <ul className="space-y-3 text-left max-w-md mx-auto">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-black text-sm font-black">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-200">
                        <strong className="text-white">Historique complet</strong> de toutes vos playlists
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-black text-sm font-black">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-200">
                        <strong className="text-white">Exports illimités</strong> (vs 2/an en gratuit)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-black text-sm font-black">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-200">
                        <strong className="text-white">Zéro publicité</strong> sur tout le site
                      </span>
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={() => navigate('/subscription')}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-10 py-6 rounded-full shadow-[0_10px_40px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_50px_rgba(234,179,8,0.4)] transition-all uppercase"
                >
                  <Crown className="mr-2 w-6 h-6" />
                  Passer Premium
                </Button>

                <p className="text-xs sm:text-sm text-gray-500 mt-6">
                  Dès 4,99€/mois • Sans engagement • Annulation à tout moment
                </p>
              </div>
            </div>
          )
        ) : (
          // ONGLET EXPORTS (accessible à tous)
          exports.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-400">Aucun export cette année</h3>
              <p className="text-sm sm:text-base text-gray-500">
                Les exports sont enregistrés quand vous cliquez sur "Copier" dans la page de génération.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {exports.map((exportItem) => (
                <div 
                  key={exportItem.id}
                  className="bg-[#252525] border border-[#333] rounded-xl sm:rounded-2xl p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold mb-2 truncate">{exportItem.playlist_name}</h3>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {exportItem.track_count} morceaux
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                          {formatDate(exportItem.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>

      <Footer />
    </div>
  );
}
