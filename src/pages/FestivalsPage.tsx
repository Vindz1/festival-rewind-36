import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Map, List, MapPin, Calendar, Globe as GlobeIcon, ExternalLink, Zap } from 'lucide-react';
import { FESTIVALS_2026, getAllGenres, Festival } from '@/data/festivalsData';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function FestivalsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [hoveredFestival, setHoveredFestival] = useState<Festival | null>(null);

  const genres = getAllGenres();

  const toggleGenre = (genre: string) => {
    const newSet = new Set(selectedGenres);
    if (newSet.has(genre)) newSet.delete(genre);
    else newSet.add(genre);
    setSelectedGenres(newSet);
  };

  const filteredFestivals = selectedGenres.size === 0
    ? FESTIVALS_2026
    : FESTIVALS_2026.filter(f => f.genre.some(g => selectedGenres.has(g)));

  const handleFestivalClick = (festival: Festival) => {
    // Si Hellfest, aller vers la page existante
    if (festival.id === 'hellfest-2026') {
      navigate('/hellfest-2026');
    } else {
      // Pour les autres, créer une page "coming soon" ou rediriger vers une page générique
      // TODO: À terme, toutes auront leur page dédiée
      navigate(`/festivals/${festival.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Header />

      <main className="pt-20 pb-20 max-w-[1800px] mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black italic uppercase mb-2">
                FESTIVALS <span className="text-[#4d94ff]">2026</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-400">
                {filteredFestivals.length} festivals • Metal, Rock & plus
              </p>
            </div>

            {/* Toggle Map/List */}
            <div className="flex gap-2 bg-[#2d2d2d] p-1 rounded-lg border border-[#404040]">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                  viewMode === 'map'
                    ? 'bg-[#4d94ff] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Carte</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#4d94ff] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Liste</span>
              </button>
            </div>
          </div>

          {/* Filtres genres */}
          <div className="flex flex-wrap gap-2">
            {genres.map(genre => {
              const isSelected = selectedGenres.has(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#4d94ff] text-white'
                      : 'bg-[#2d2d2d] text-gray-400 hover:text-white border border-[#404040]'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* VIEW: CARTE */}
        {viewMode === 'map' && (
          <div className="relative bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 147
              }}
            >
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#1a1a1a"
                        stroke="#333"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: '#252525' },
                          pressed: { outline: 'none' }
                        }}
                      />
                    ))
                  }
                </Geographies>

                {/* Markers avec taille fixe au zoom */}
                {filteredFestivals.map(festival => {
                  const markerSize = 8; // Taille fixe en pixels
                  
                  return (
                    <Marker
                      key={festival.id}
                      coordinates={[festival.coordinates[1], festival.coordinates[0]]}
                      onMouseEnter={() => setHoveredFestival(festival)}
                      onMouseLeave={() => setHoveredFestival(null)}
                      onClick={() => handleFestivalClick(festival)}
                    >
                      <g className="cursor-pointer" style={{ pointerEvents: 'all' }}>
                        {/* Cercle principal avec taille fixe */}
                        <circle
                          r={markerSize}
                          fill={festival.hasDetailedPage ? '#00ff00' : '#4d94ff'}
                          stroke="white"
                          strokeWidth={2}
                          className="transition-all hover:opacity-80"
                          style={{ vectorEffect: 'non-scaling-stroke' }}
                        />
                        {/* Animation pulse pour festivals avec prog complète */}
                        {festival.hasDetailedPage && (
                          <circle 
                            r={markerSize * 1.5} 
                            fill="#00ff00" 
                            opacity={0.3} 
                            className="animate-ping"
                            style={{ vectorEffect: 'non-scaling-stroke' }}
                          />
                        )}
                      </g>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>

            {/* Tooltip hover */}
            {hoveredFestival && (
              <div className="absolute bottom-4 left-4 bg-[#1a1a1a] border-2 border-[#4d94ff] rounded-xl p-4 shadow-2xl max-w-xs z-10">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold">{hoveredFestival.name}</h3>
                  {hoveredFestival.hasDetailedPage && (
                    <span className="bg-[#00ff00] text-black text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      LIVE
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {hoveredFestival.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {hoveredFestival.dates}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hoveredFestival.genre.map(g => (
                    <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-[#4d94ff]/20 text-[#4d94ff]">
                      {g}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {festival.id === 'hellfest-2026' ? 'Cliquez pour voir la programmation complète' : 'Cliquez pour voir les détails'}
                </p>
              </div>
            )}

            {/* Légende */}
            <div className="absolute top-4 right-4 bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-[#00ff00]" />
                <span>Prog complète disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4d94ff]" />
                <span>Bientôt disponible</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: LISTE */}
        {viewMode === 'list' && (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFestivals.map(festival => (
              <div
                key={festival.id}
                onClick={() => handleFestivalClick(festival)}
                className="bg-[#2d2d2d] border border-[#404040] rounded-xl p-4 sm:p-5 cursor-pointer hover:border-[#4d94ff] transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-bold group-hover:text-[#4d94ff] transition-colors">
                    {festival.name}
                  </h3>
                  {festival.id === 'hellfest-2026' ? (
                    <span className="bg-[#00ff00] text-black text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      LIVE
                    </span>
                  ) : (
                    <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full font-bold border border-yellow-500/20">
                      BIENTÔT
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{festival.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{festival.dates}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {festival.genre.map(g => (
                    <span key={g} className="text-xs px-2 py-1 rounded-full bg-[#4d94ff]/10 text-[#4d94ff] border border-[#4d94ff]/20">
                      {g}
                    </span>
                  ))}
                </div>

                {festival.lineup && festival.lineup.length > 0 && (
                  <div className="pt-3 border-t border-[#404040]">
                    <p className="text-xs text-gray-500 mb-1">Headliners :</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {festival.lineup.slice(0, 3).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
