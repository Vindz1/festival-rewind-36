import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Flame, Filter, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArtistCard } from '@/components/ArtistCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { festivals, getFestivalById, stages, Artist } from '@/data/festivals';

const Concerts = () => {
  const [searchParams] = useSearchParams();
  const festivalIds = searchParams.get('festivals')?.split(',') || [];
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [activeStageFilter, setActiveStageFilter] = useState<string | null>(null);

  const selectedFestivals = useMemo(() => 
    festivalIds.map(id => getFestivalById(id)).filter(Boolean) as typeof festivals,
    [festivalIds]
  );

  const allArtists = useMemo(() => {
    const artists: (Artist & { festivalYear: number })[] = [];
    selectedFestivals.forEach(festival => {
      festival.artists.forEach(artist => {
        artists.push({ ...artist, festivalYear: festival.year });
      });
    });
    return artists;
  }, [selectedFestivals]);

  const filteredArtists = useMemo(() => {
    if (!activeStageFilter) return allArtists;
    return allArtists.filter(a => a.stage === activeStageFilter);
  }, [allArtists, activeStageFilter]);

  const toggleArtist = (id: string) => {
    setSelectedArtists((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedArtists(filteredArtists.map(a => a.id));
  };

  const clearAll = () => {
    setSelectedArtists([]);
  };

  if (selectedFestivals.length === 0) {
    return (
      <div className="min-h-screen bg-background noise flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl text-foreground mb-4">Aucun festival sélectionné</h1>
          <Link to="/festivals">
            <Button variant="fire">Choisir des festivals</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background noise">
      <Header />

      <main className="pt-24 pb-32">
        <div className="container px-4">
          {/* Back link */}
          <Link 
            to="/festivals" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux festivals
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-2">
              VOS <span className="text-gradient-fire">CONCERTS</span>
            </h1>
            <p className="text-muted-foreground">
              {selectedFestivals.map(f => `${f.name} ${f.year}`).join(', ')}
            </p>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              Filtrer par scène :
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stages).map(([key, stage]) => (
                <Badge
                  key={key}
                  variant={activeStageFilter === key ? stage.color : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => setActiveStageFilter(activeStageFilter === key ? null : key)}
                >
                  {stage.name}
                  {activeStageFilter === key && <X className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Tout sélectionner
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Tout désélectionner
            </Button>
            <span className="text-sm text-muted-foreground ml-auto">
              {selectedArtists.length} / {filteredArtists.length} sélectionné{selectedArtists.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Artists Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredArtists.map((artist, index) => (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ArtistCard
                    artist={artist}
                    isSelected={selectedArtists.includes(artist.id)}
                    onToggle={() => toggleArtist(artist.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      {selectedArtists.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 glass border-t border-border"
        >
          <div className="container px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-fire flex items-center justify-center shadow-fire">
                  <Flame className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {selectedArtists.length} concert{selectedArtists.length > 1 ? 's' : ''} sélectionné{selectedArtists.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Générez votre playlist souvenir
                  </div>
                </div>
              </div>
              <Link to={`/generate?artists=${selectedArtists.join(',')}`}>
                <Button variant="fire" className="gap-2">
                  Générer la playlist
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Concerts;
