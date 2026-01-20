import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Music, Check, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Simulated playlist generation
const mockTracks = [
  { id: '1', name: 'Enter Sandman', artist: 'Metallica' },
  { id: '2', name: 'Master of Puppets', artist: 'Metallica' },
  { id: '3', name: 'One', artist: 'Metallica' },
  { id: '4', name: 'Flying Whales', artist: 'Gojira' },
  { id: '5', name: 'Stranded', artist: 'Gojira' },
  { id: '6', name: 'Square Hammer', artist: 'Ghost' },
  { id: '7', name: 'Cirice', artist: 'Ghost' },
  { id: '8', name: 'Blood and Thunder', artist: 'Mastodon' },
  { id: '9', name: 'Bleed', artist: 'Meshuggah' },
  { id: '10', name: 'Dance Macabre', artist: 'Ghost' },
];

const streamingServices = [
  { id: 'spotify', name: 'Spotify', color: 'bg-green-500/20 text-green-400' },
  { id: 'apple', name: 'Apple Music', color: 'bg-pink-500/20 text-pink-400' },
  { id: 'deezer', name: 'Deezer', color: 'bg-purple-500/20 text-purple-400' },
];

const Generate = () => {
  const [searchParams] = useSearchParams();
  const artistIds = searchParams.get('artists')?.split(',') || [];
  
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tracks, setTracks] = useState<typeof mockTracks>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isExported, setIsExported] = useState(false);

  // Simulate generation process
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setTracks(mockTracks);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleExport = () => {
    if (!selectedService) return;
    setIsExported(true);
  };

  return (
    <div className="min-h-screen bg-background noise">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container px-4 max-w-3xl mx-auto">
          {/* Back link */}
          <Link 
            to="/festivals" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={isGenerating ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isGenerating ? Infinity : 0, ease: 'linear' }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-fire flex items-center justify-center shadow-glow">
                <Flame className="w-10 h-10 text-primary-foreground" />
              </div>
            </motion.div>

            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4">
              {isGenerating ? (
                <>GÉNÉRATION EN <span className="text-gradient-fire">COURS</span></>
              ) : (
                <>VOTRE <span className="text-gradient-fire">PLAYLIST</span></>
              )}
            </h1>

            {isGenerating ? (
              <p className="text-muted-foreground">
                Récupération des setlists pour {artistIds.length} concert{artistIds.length > 1 ? 's' : ''}...
              </p>
            ) : (
              <p className="text-muted-foreground">
                {tracks.length} morceaux retrouvés depuis les setlists officielles
              </p>
            )}
          </motion.div>

          {/* Progress bar */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <ProgressBar progress={progress} label="Recherche des morceaux" />
            </motion.div>
          )}

          {/* Tracks list */}
          {!isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              {/* Track list */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Music className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl">Playlist Hellfest Memories</h2>
                  <Badge variant="fire" className="ml-auto">{tracks.length} titres</Badge>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {tracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{track.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Export section */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display text-xl text-foreground mb-4">
                  Exporter vers votre plateforme
                </h3>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {streamingServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`
                        px-4 py-3 rounded-lg border-2 transition-all
                        ${selectedService === service.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <span className={`font-medium ${service.color.split(' ')[1]}`}>
                        {service.name}
                      </span>
                    </button>
                  ))}
                </div>

                {isExported ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                  >
                    <Check className="w-6 h-6 text-green-500" />
                    <div>
                      <div className="font-medium text-green-400">Playlist créée avec succès !</div>
                      <div className="text-sm text-muted-foreground">
                        Ouvrez {streamingServices.find(s => s.id === selectedService)?.name} pour l'écouter
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir
                    </Button>
                  </motion.div>
                ) : (
                  <Button
                    variant="fire"
                    size="lg"
                    className="w-full"
                    disabled={!selectedService}
                    onClick={handleExport}
                  >
                    <Flame className="w-5 h-5" />
                    Créer ma playlist sur {selectedService ? streamingServices.find(s => s.id === selectedService)?.name : '...'}
                  </Button>
                )}
              </div>

              {/* New playlist button */}
              <div className="text-center">
                <Link to="/festivals">
                  <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Créer une autre playlist
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Generate;
