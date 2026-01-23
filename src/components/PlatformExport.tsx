import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Apple, Disc3, Loader2, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  artistName: string;
  songName: string;
}

interface PlatformExportProps {
  tracks: Track[];
  playlistName: string;
  onSpotifyExport: () => void;
  spotifyLoading: boolean;
  spotifyConnected: boolean;
  spotifyPlaylistUrl?: string;
}

type Platform = 'spotify' | 'apple' | 'deezer';

export const PlatformExport = ({
  tracks,
  playlistName,
  onSpotifyExport,
  spotifyLoading,
  spotifyConnected,
  spotifyPlaylistUrl,
}: PlatformExportProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('spotify');
  const [loading, setLoading] = useState(false);
  const [platformLinks, setPlatformLinks] = useState<{
    apple?: string[];
    deezer?: string[];
  }>({});

  const platforms = [
    { id: 'spotify' as Platform, name: 'Spotify', icon: Music2, color: 'text-green-500' },
    { id: 'apple' as Platform, name: 'Apple Music', icon: Apple, color: 'text-pink-500' },
    { id: 'deezer' as Platform, name: 'Deezer', icon: Disc3, color: 'text-orange-500' },
  ];

  const fetchOdesliLinks = async (platform: 'apple' | 'deezer') => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('odesli', {
        body: { 
          tracks: tracks.slice(0, 20), // Limit to 20 tracks to avoid rate limiting
          platform,
        },
      });

      if (error) throw error;
      
      if (data?.success && data?.links) {
        setPlatformLinks(prev => ({ ...prev, [platform]: data.links }));
        toast.success(`${data.links.length} morceaux trouvés sur ${platform === 'apple' ? 'Apple Music' : 'Deezer'}`);
      } else {
        throw new Error(data?.error || 'Échec de la récupération des liens');
      }
    } catch (err: any) {
      console.error('Odesli error:', err);
      toast.error('Erreur lors de la récupération des liens');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformExport = () => {
    if (selectedPlatform === 'spotify') {
      onSpotifyExport();
    } else {
      fetchOdesliLinks(selectedPlatform);
    }
  };

  const openPlatformLinks = (platform: 'apple' | 'deezer') => {
    const links = platformLinks[platform];
    if (!links || links.length === 0) return;
    
    if (platform === 'apple') {
      // Open first Apple Music link as example
      window.open(links[0], '_blank');
      toast.info('Ouvrez chaque lien pour ajouter les morceaux à votre bibliothèque');
    } else {
      // For Deezer, create a search URL with all tracks
      const searchQuery = tracks.slice(0, 10).map(t => `${t.artistName} ${t.songName}`).join(' ');
      const deezerUrl = `https://www.deezer.com/search/${encodeURIComponent(searchQuery)}`;
      window.open(deezerUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform selector */}
      <div className="flex flex-wrap gap-3 justify-center">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatform === platform.id;
          
          return (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`
                flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/10 scale-105' 
                  : 'border-border bg-card hover:border-primary/50'
                }
              `}
            >
              <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : platform.color}`} />
              <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {platform.name}
              </span>
              {isSelected && <Check className="w-5 h-5 text-primary" />}
            </button>
          );
        })}
      </div>

      {/* Export button */}
      <div className="flex justify-center">
        <AnimatePresence mode="wait">
          {selectedPlatform === 'spotify' && spotifyPlaylistUrl ? (
            <motion.a
              key="spotify-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              href={spotifyPlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="fire" size="xl" className="gap-3">
                <Music2 className="w-5 h-5" />
                Ouvrir dans Spotify
                <ExternalLink className="w-4 h-4" />
              </Button>
            </motion.a>
          ) : platformLinks[selectedPlatform as 'apple' | 'deezer']?.length ? (
            <motion.div
              key={`${selectedPlatform}-success`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button 
                variant="fire" 
                size="xl" 
                className="gap-3"
                onClick={() => openPlatformLinks(selectedPlatform as 'apple' | 'deezer')}
              >
                {selectedPlatform === 'apple' ? <Apple className="w-5 h-5" /> : <Disc3 className="w-5 h-5" />}
                Ouvrir dans {selectedPlatform === 'apple' ? 'Apple Music' : 'Deezer'}
                <ExternalLink className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div key="export-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button 
                variant="fire" 
                size="xl" 
                className="gap-3"
                onClick={handlePlatformExport}
                disabled={loading || spotifyLoading || (selectedPlatform === 'spotify' && !spotifyConnected)}
              >
                {(loading || spotifyLoading) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    {selectedPlatform === 'spotify' && <Music2 className="w-5 h-5" />}
                    {selectedPlatform === 'apple' && <Apple className="w-5 h-5" />}
                    {selectedPlatform === 'deezer' && <Disc3 className="w-5 h-5" />}
                    {selectedPlatform === 'spotify' && !spotifyConnected 
                      ? 'Connecter Spotify' 
                      : `Exporter vers ${platforms.find(p => p.id === selectedPlatform)?.name}`
                    }
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Platform-specific notes */}
      <div className="text-center text-sm text-muted-foreground">
        {selectedPlatform === 'spotify' && (
          <p>Crée automatiquement une playlist sur votre compte Spotify</p>
        )}
        {selectedPlatform === 'apple' && (
          <p>Ouvre les morceaux dans Apple Music pour les ajouter à votre bibliothèque</p>
        )}
        {selectedPlatform === 'deezer' && (
          <p>Ouvre une recherche Deezer avec vos morceaux</p>
        )}
      </div>
    </div>
  );
};