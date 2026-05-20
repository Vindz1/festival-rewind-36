import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Map, List, MapPin, Calendar, Zap, Plus, Minus } from 'lucide-react';
import { FESTIVALS_2026, Festival } from '@/data/festivalsData';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

// Carte HAUTE RÉS avec plus de détails.
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

export default function FestivalsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hoveredFestival, setHoveredFestival] = useState<Festival | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'country' | 'status'>('status');

  // ZOOM sur l'Europe par défaut
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [position, setPosition] = useState({ 
    coordinates: [10, 52] as [number, number], // Centré sur l'Europe centrale
    zoom: isMobile ? 3 : 2.2 // Zoom plus serré sur l'Europe
  });

  // FILTRER : Afficher uniquement les festivals "Live" (hasDetailedPage)
  const visibleFestivals = FESTIVALS_2026.filter(
    festival => festival.hasDetailedPage
  );

  const handleFestivalClick = (festival: Festival) => {
    if (festival.hasDetailedPage) {
      navigate(`/${festival.id}`);
    } else {
      navigate(`/festivals/${festival.id}`);
    }
  };

  const getSortedFestivals = (): Festival[] => {
    const festivals = [...visibleFestivals];
    
    const getMonthNumber = (monthStr: string): number => {
      const normalized = monthStr.toLowerCase().trim();
      const months: Record<string, number> = {
        'janvier': 1, 'jan': 1, 'février': 2, 'fév': 2, 'fev': 2, 'feb': 2,
        'mars': 3, 'mar': 3, 'avril': 4, 'avr': 4, 'apr': 4, 'mai': 5, 'may': 5,
        'juin': 6, 'jun': 6, 'juillet': 7, 'juil': 7, 'jul': 7, 'août': 8, 'aout': 8, 'aug': 8,
        'septembre': 9, 'sept': 9, 'sep': 9, 'octobre': 10, 'oct': 10,
        'novembre': 11, 'nov': 11, 'décembre': 12, 'déc': 12, 'dec': 12
      };
      return months[normalized] || 1;
    };
    
    const parseDate = (dateStr: string): number => {
      const cleaned = dateStr.toLowerCase().trim();
      const dayMatch = cleaned.match(/(\d+)/);
      const day = dayMatch ? parseInt(dayMatch[1]) : 1;
      
      const words = cleaned.split(/[\s-]+/);
      let month = 1;
      for (const word of words) {
        const m = getMonthNumber(word);
        if (m > 1 || word === 'janvier' || word === 'jan') {
          month = m;
          break;
        }
      }
      
      const yearMatch = cleaned.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 2026;
      
      return year * 10000 + month * 100 + day;
    };
    
    switch (sortBy) {
      case 'name':
        return festivals.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      case 'date':
        return festivals.sort((a, b) => parseDate(a.dates) - parseDate(b.dates));
      case 'country':
        return festivals.sort((a, b) => {
          const countryCompare = a.country.localeCompare(b.country, 'fr');
          if (countryCompare !== 0) return countryCompare;
          return a.name.localeCompare(b.name, 'fr');
        });
      case 'status':
        return festivals.sort((a, b) => {
          if (a.hasDetailedPage && !b.hasDetailedPage) return -1;
          if (!a.hasDetailedPage && b.hasDetailedPage) return 1;
          return parseDate(a.dates) - parseDate(b.dates);
        });
      default:
        return festivals;
    }
  };

  // ZOOM AUGMENTÉ : max 30x au lieu de 15x
  const handleZoomIn = () => {
    if (position.zoom >= 30) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.4 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.4 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
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
                {visibleFestivals.length} festivals • Metal, Rock & plus
              </p>
            </div>

            <div className="flex gap-2 bg-[#2d2d2d] p-1 rounded-lg border border-[#404040]">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                  viewMode === 'map' ? 'bg-[#4d94ff] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Carte</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                  viewMode === 'list' ? 'bg-[#4d94ff] text-white' : 'text-gray-400 hover:text-white'
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
                  scale: 180, // Scale augmenté pour plus de détails
                  center: [10, 50] 
                }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup
                  zoom={position.zoom}
                  center={position.coordinates}
                  onMoveEnd={handleMoveEnd}
                  maxZoom={30} // Max zoom à 30
                  minZoom={1}
                >
                  {/* Pays */}
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map(geo => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#1a1a1a"
                          stroke="#505050" // Bordures plus claires
                          strokeWidth={0.6 / position.zoom}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: '#252525' },
                            pressed: { outline: 'none' }
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {/* FESTIVALS - Uniquement ceux avec prog complète */}
                  {visibleFestivals.map(festival => (
                    <Marker
                      key={festival.id}
                      coordinates={[festival.coordinates[1], festival.coordinates[0]]}
                      onMouseEnter={() => setHoveredFestival(festival)}
                      onMouseLeave={() => setHoveredFestival(null)}
                      onClick={() => handleFestivalClick(festival)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Effet pulse pour festivals Live */}
                      <circle 
                        r={12 / position.zoom} 
                        fill="#00ff00" 
                        opacity={0.3} 
                        className="animate-ping" 
                      />
                      {/* Marqueur principal */}
                      <circle 
                        r={6 / position.zoom}
                        fill="#00ff00"
                        stroke="#FFFFFF"
                        strokeWidth={2 / position.zoom}
                        className="transition-opacity hover:opacity-80"
                        style={{
                          filter: 'drop-shadow(0 0 8px #00ff00)'
                        }}
                      />
                      {/* Nom du festival - visible si zoom > 6 */}
                      {position.zoom > 6 && (
                        <text
                          y={-10 / position.zoom}
                          fontSize={11 / position.zoom}
                          textAnchor="middle"
                          fill="#fff"
                          style={{ 
                            fontFamily: 'system-ui', 
                            fontWeight: 'bold',
                            pointerEvents: 'none',
                            textShadow: '0 0 3px #000'
                          }}
                        >
                          {festival.name}
                        </text>
                      )}
                    </Marker>
                  ))}
                </ZoomableGroup>
              </ComposableMap>
            </div>

            {/* Boutons Zoom */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
              <button 
                onClick={handleZoomIn}
                disabled={position.zoom >= 30}
                className="bg-[#1a1a1a] hover:bg-[#333] text-white p-2 rounded-lg border border-[#404040] transition-colors shadow-lg flex items-center justify-center disabled:opacity-30"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={handleZoomOut}
                disabled={position.zoom <= 1}
                className="bg-[#1a1a1a] hover:bg-[#333] text-white p-2 rounded-lg border border-[#404040] transition-colors shadow-lg flex items-center justify-center disabled:opacity-30"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>

            {/* Info-bulle au survol */}
            {hoveredFestival && (
              <div className="absolute bottom-4 left-4 bg-[#1a1a1a]/95 backdrop-blur-sm border-2 border-[#4d94ff] rounded-xl p-4 shadow-2xl max-w-xs pointer-events-none z-50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold">{hoveredFestival.name}</h3>
                  <span className="bg-[#00ff00] text-black text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    LIVE
                  </span>
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
              </div>
            )}

            {/* Légende */}
            <div className="absolute top-4 right-4 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#404040] rounded-lg p-3 text-xs z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00ff00] animate-pulse drop-shadow-[0_0_5px_#00ff00]" />
                <span>Prog complète</span>
              </div>
            </div>

            {/* Indicateur zoom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-[#404040]">
              Zoom: {position.zoom.toFixed(1)}x / 30x
            </div>
          </div>
        )}

        {/* VIEW: LISTE */}
        {viewMode === 'list' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSortBy('name')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'name' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>A-Z</button>
              <button onClick={() => setSortBy('date')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'date' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>Date</button>
              <button onClick={() => setSortBy('country')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'country' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>Pays</button>
              <button onClick={() => setSortBy('status')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'status' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>Par statut</button>
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getSortedFestivals().map(festival => (
                <div
                  key={festival.id}
                  onClick={() => handleFestivalClick(festival)}
                  className="bg-[#2d2d2d] border border-[#404040] hover:border-[#4d94ff] rounded-xl p-4 sm:p-5 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg sm:text-xl font-bold transition-colors group-hover:text-[#4d94ff]">
                      {festival.name}
                    </h3>
                    <span className="bg-[#00ff00] text-black text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      LIVE
                    </span>
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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
