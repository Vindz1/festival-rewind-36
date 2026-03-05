import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Map, List, MapPin, Calendar, Zap, Plus, Minus } from 'lucide-react';
import { FESTIVALS_2026, Festival } from '@/data/festivalsData';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

// CARTE HAUTE DÉFINITION (50m au lieu de 110m = 2x plus de détails)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

export default function FestivalsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hoveredFestival, setHoveredFestival] = useState<Festival | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'country' | 'status'>('status');

  // ZOOM AMÉLIORÉ : zoom initial plus fort sur mobile, max à 10 au lieu de 4
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [position, setPosition] = useState({ 
    coordinates: [10, 50] as [number, number], 
    zoom: isMobile ? 1.5 : 1 // Zoom initial plus fort sur mobile
  });

  const handleFestivalClick = (festival: Festival) => {
    if (festival.hasDetailedPage) {
      navigate(`/${festival.id}`);
    } else {
      navigate(`/festivals/${festival.id}`);
    }
  };

  // ZOOM AUGMENTÉ : jusqu'à 10x au lieu de 4x
  const handleZoomIn = () => {
    if (position.zoom >= 10) return; // Max zoom augmenté de 4 à 10
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  // Tri des festivals
  const getSortedFestivals = () => {
    const festivals = [...FESTIVALS_2026];
    
    switch (sortBy) {
      case 'name':
        return festivals.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      
      case 'date':
        return festivals.sort((a, b) => {
          const dateA = new Date(a.dates.split(' - ')[0]);
          const dateB = new Date(b.dates.split(' - ')[0]);
          return dateA.getTime() - dateB.getTime();
        });
      
      case 'country':
        return festivals.sort((a, b) => {
          const countryCompare = a.country.localeCompare(b.country, 'fr');
          if (countryCompare !== 0) return countryCompare;
          return a.name.localeCompare(b.name, 'fr');
        });
      
      case 'status':
        return festivals.sort((a, b) => {
          if (a.hasDetailedPage === b.hasDetailedPage) {
            return a.name.localeCompare(b.name, 'fr');
          }
          return a.hasDetailedPage ? -1 : 1;
        });
      
      default:
        return festivals;
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
                {FESTIVALS_2026.length} festivals • Metal, Rock & plus
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
        </div>

        {/* VIEW: CARTE */}
        {viewMode === 'map' && (
          <div className="relative bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
            
            <div className="absolute inset-0">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ 
                  scale: 200, // Augmenté de 147 à 200 pour plus de détails
                  center: [10, 50] 
                }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup
                  zoom={position.zoom}
                  center={position.coordinates}
                  onMoveEnd={handleMoveEnd}
                  maxZoom={10} // Max zoom à 10
                  minZoom={1}
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map(geo => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#1a1a1a"
                          stroke="#404040" // Bordures plus visibles
                          strokeWidth={0.8 / position.zoom} // Traits plus épais
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: '#252525' },
                            pressed: { outline: 'none' }
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {FESTIVALS_2026.map(festival => (
                    <Marker
                      key={festival.id}
                      coordinates={[festival.coordinates[1], festival.coordinates[0]]}
                      onMouseEnter={() => setHoveredFestival(festival)}
                      onMouseLeave={() => setHoveredFestival(null)}
                      onClick={() => handleFestivalClick(festival)}
                      style={{ cursor: "pointer" }}
                    >
                      {festival.hasDetailedPage && (
                        <circle r={12 / position.zoom} fill="#00ff00" opacity={0.3} className="animate-ping" />
                      )}
                      <circle 
                        r={6 / position.zoom} // Marqueurs légèrement plus gros
                        fill={festival.hasDetailedPage ? '#00ff00' : '#4d94ff'}
                        stroke="#FFFFFF"
                        strokeWidth={2 / position.zoom} // Contour plus visible
                        className="transition-opacity hover:opacity-80"
                      />
                    </Marker>
                  ))}
                </ZoomableGroup>
              </ComposableMap>
            </div>

            {/* Tooltip au survol */}
            {hoveredFestival && (
              <div className="absolute top-4 left-4 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#404040] rounded-lg p-4 shadow-2xl max-w-xs z-20">
                <div className="flex items-start gap-3">
                  {hoveredFestival.hasDetailedPage ? (
                    <Zap className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <MapPin className="w-5 h-5 text-[#4d94ff] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-bold text-white mb-1">{hoveredFestival.name}</h3>
                    <p className="text-xs text-gray-400 mb-1">{hoveredFestival.location}, {hoveredFestival.country}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {hoveredFestival.dates}
                    </p>
                    {hoveredFestival.hasDetailedPage && (
                      <div className="mt-2 text-xs text-green-400 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        PROGRAMMATION LIVE
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contrôles de Zoom */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
              <button 
                onClick={handleZoomIn}
                disabled={position.zoom >= 10}
                className="bg-[#1a1a1a] hover:bg-[#333] text-white p-3 rounded-lg border border-[#404040] transition-colors shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={handleZoomOut}
                disabled={position.zoom <= 1}
                className="bg-[#1a1a1a] hover:bg-[#333] text-white p-3 rounded-lg border border-[#404040] transition-colors shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>

            {/* Indicateur de zoom actuel (utile pour debug) */}
            <div className="absolute bottom-4 left-4 bg-[#1a1a1a]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-[#404040]">
              Zoom: {position.zoom.toFixed(1)}x
            </div>
          </div>
        )}

        {/* VIEW: LISTE */}
        {viewMode === 'list' && (
          <div>
            {/* Boutons de tri */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSortBy('status')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  sortBy === 'status'
                    ? 'bg-[#4d94ff] text-white'
                    : 'bg-[#2d2d2d] text-gray-400 hover:text-white border border-[#404040]'
                }`}
              >
                Live / Bientôt
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  sortBy === 'name'
                    ? 'bg-[#4d94ff] text-white'
                    : 'bg-[#2d2d2d] text-gray-400 hover:text-white border border-[#404040]'
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortBy('date')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  sortBy === 'date'
                    ? 'bg-[#4d94ff] text-white'
                    : 'bg-[#2d2d2d] text-gray-400 hover:text-white border border-[#404040]'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('country')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  sortBy === 'country'
                    ? 'bg-[#4d94ff] text-white'
                    : 'bg-[#2d2d2d] text-gray-400 hover:text-white border border-[#404040]'
                }`}
              >
                Pays
              </button>
            </div>

            {/* Liste des festivals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSortedFestivals().map(festival => (
                <div
                  key={festival.id}
                  onClick={() => handleFestivalClick(festival)}
                  className={`bg-[#2d2d2d] border rounded-xl p-6 hover:border-[#4d94ff] transition-all cursor-pointer group ${
                    festival.hasDetailedPage ? 'border-green-500/30' : 'border-[#404040]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-white group-hover:text-[#4d94ff] transition-colors">
                      {festival.name}
                    </h3>
                    {festival.hasDetailedPage && (
                      <span className="bg-green-500/10 text-green-400 text-xs font-black px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        LIVE
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#4d94ff]" />
                      {festival.location}, {festival.country}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4d94ff]" />
                      {festival.dates}
                    </p>
                  </div>

                  {festival.hasDetailedPage && (
                    <div className="mt-4 text-xs text-green-400 font-semibold">
                      → Voir la programmation complète
                    </div>
                  )}
                  {!festival.hasDetailedPage && (
                    <div className="mt-4 text-xs text-gray-500">
                      Programmation bientôt disponible
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
