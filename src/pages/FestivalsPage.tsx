import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Map, List, MapPin, Calendar, Zap, Plus, Minus } from 'lucide-react';
import { FESTIVALS_2026, Festival } from '@/data/festivalsData';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Annotation } from 'react-simple-maps';

// Carte HAUTE RÉS avec plus de détails
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// VILLES COMPLÈTES - Tous les pays d'Europe + autres continents
const MAJOR_CITIES = [
  // France
  { name: "Paris", coordinates: [2.3522, 48.8566] },
  { name: "Lyon", coordinates: [4.8357, 45.7640] },
  { name: "Marseille", coordinates: [5.3698, 43.2965] },
  { name: "Toulouse", coordinates: [1.4442, 43.6047] },
  { name: "Bordeaux", coordinates: [-0.5792, 44.8378] },
  { name: "Nantes", coordinates: [-1.5534, 47.2184] },
  { name: "Strasbourg", coordinates: [7.7521, 48.5734] },
  { name: "Lille", coordinates: [3.0573, 50.6292] },
  
  // Royaume-Uni
  { name: "Londres", coordinates: [-0.1276, 51.5074] },
  { name: "Manchester", coordinates: [-2.2426, 53.4808] },
  { name: "Birmingham", coordinates: [-1.8904, 52.4862] },
  { name: "Édimbourg", coordinates: [-3.1883, 55.9533] },
  { name: "Glasgow", coordinates: [-4.2518, 55.8642] },
  { name: "Liverpool", coordinates: [-2.9916, 53.4084] },
  { name: "Leeds", coordinates: [-1.5491, 53.8008] },
  
  // Allemagne
  { name: "Berlin", coordinates: [13.4050, 52.5200] },
  { name: "Munich", coordinates: [11.5820, 48.1351] },
  { name: "Hambourg", coordinates: [9.9937, 53.5511] },
  { name: "Francfort", coordinates: [8.6821, 50.1109] },
  { name: "Cologne", coordinates: [6.9603, 50.9375] },
  { name: "Stuttgart", coordinates: [9.1829, 48.7758] },
  { name: "Düsseldorf", coordinates: [6.7735, 51.2277] },
  { name: "Dortmund", coordinates: [7.4653, 51.5136] },
  { name: "Nuremberg", coordinates: [11.0767, 49.4521] },
  
  // Espagne
  { name: "Madrid", coordinates: [-3.7038, 40.4168] },
  { name: "Barcelone", coordinates: [2.1734, 41.3851] },
  { name: "Valence", coordinates: [-0.3774, 39.4699] },
  { name: "Séville", coordinates: [-5.9845, 37.3891] },
  { name: "Bilbao", coordinates: [-2.9253, 43.2630] },
  { name: "Malaga", coordinates: [-4.4214, 36.7213] },
  
  // Italie
  { name: "Rome", coordinates: [12.4964, 41.9028] },
  { name: "Milan", coordinates: [9.1900, 45.4642] },
  { name: "Naples", coordinates: [14.2681, 40.8518] },
  { name: "Turin", coordinates: [7.6869, 45.0703] },
  { name: "Florence", coordinates: [11.2558, 43.7696] },
  { name: "Venise", coordinates: [12.3155, 45.4408] },
  { name: "Bologne", coordinates: [11.3426, 44.4949] },
  
  // Pays-Bas
  { name: "Amsterdam", coordinates: [4.9041, 52.3676] },
  { name: "Rotterdam", coordinates: [4.4777, 51.9244] },
  { name: "La Haye", coordinates: [4.3007, 52.0705] },
  { name: "Utrecht", coordinates: [5.1214, 52.0907] },
  
  // Belgique
  { name: "Bruxelles", coordinates: [4.3517, 50.8503] },
  { name: "Anvers", coordinates: [4.4025, 51.2194] },
  { name: "Gand", coordinates: [3.7174, 51.0543] },
  { name: "Liège", coordinates: [5.5797, 50.6326] },
  
  // Suisse
  { name: "Zurich", coordinates: [8.5417, 47.3769] },
  { name: "Genève", coordinates: [6.1432, 46.2044] },
  { name: "Bâle", coordinates: [7.5886, 47.5596] },
  { name: "Berne", coordinates: [7.4474, 46.9480] },
  
  // Autriche
  { name: "Vienne", coordinates: [16.3738, 48.2082] },
  { name: "Salzbourg", coordinates: [13.0550, 47.8095] },
  { name: "Innsbruck", coordinates: [11.3927, 47.2692] },
  
  // Scandinavie
  { name: "Copenhague", coordinates: [12.5683, 55.6761] },
  { name: "Stockholm", coordinates: [18.0686, 59.3293] },
  { name: "Oslo", coordinates: [10.7522, 59.9139] },
  { name: "Helsinki", coordinates: [24.9384, 60.1699] },
  { name: "Göteborg", coordinates: [11.9746, 57.7089] },
  { name: "Bergen", coordinates: [5.3221, 60.3913] },
  
  // Portugal
  { name: "Lisbonne", coordinates: [-9.1393, 38.7223] },
  { name: "Porto", coordinates: [-8.6291, 41.1579] },
  
  // Grèce
  { name: "Athènes", coordinates: [23.7275, 37.9838] },
  { name: "Thessalonique", coordinates: [22.9444, 40.6401] },
  
  // Europe de l'Est
  { name: "Prague", coordinates: [14.4378, 50.0755] },
  { name: "Varsovie", coordinates: [21.0122, 52.2297] },
  { name: "Budapest", coordinates: [19.0402, 47.4979] },
  { name: "Bucarest", coordinates: [26.1025, 44.4268] },
  { name: "Sofia", coordinates: [23.3219, 42.6977] },
  { name: "Zagreb", coordinates: [15.9819, 45.8150] },
  { name: "Belgrade", coordinates: [20.4489, 44.7866] },
  { name: "Kiev", coordinates: [30.5234, 50.4501] },
  
  // Irlande
  { name: "Dublin", coordinates: [-6.2603, 53.3498] },
  { name: "Cork", coordinates: [-8.4756, 51.8969] },
  
  // Pologne
  { name: "Cracovie", coordinates: [19.9450, 50.0647] },
  { name: "Gdansk", coordinates: [18.6466, 54.3520] },
  { name: "Wroclaw", coordinates: [17.0385, 51.1079] },
  
  // Autres Europe
  { name: "Luxembourg", coordinates: [6.1296, 49.6116] },
  { name: "Bratislava", coordinates: [17.1077, 48.1486] },
  { name: "Ljubljana", coordinates: [14.5058, 46.0569] },
  { name: "Tallinn", coordinates: [24.7536, 59.4370] },
  { name: "Riga", coordinates: [24.1052, 56.9496] },
  { name: "Vilnius", coordinates: [25.2797, 54.6872] },
  
  // Amérique du Nord
  { name: "New York", coordinates: [-74.0060, 40.7128] },
  { name: "Los Angeles", coordinates: [-118.2437, 34.0522] },
  { name: "Chicago", coordinates: [-87.6298, 41.8781] },
  { name: "San Francisco", coordinates: [-122.4194, 37.7749] },
  { name: "Toronto", coordinates: [-79.3832, 43.6532] },
  { name: "Montreal", coordinates: [-73.5673, 45.5017] },
  { name: "Vancouver", coordinates: [-123.1207, 49.2827] },
  
  // Amérique du Sud
  { name: "São Paulo", coordinates: [-46.6333, -23.5505] },
  { name: "Rio de Janeiro", coordinates: [-43.1729, -22.9068] },
  { name: "Buenos Aires", coordinates: [-58.3816, -34.6037] },
  { name: "Santiago", coordinates: [-70.6693, -33.4489] },
  { name: "Lima", coordinates: [-77.0428, -12.0464] },
  { name: "Bogota", coordinates: [-74.0721, 4.7110] },
  
  // Asie
  { name: "Tokyo", coordinates: [139.6503, 35.6762] },
  { name: "Seoul", coordinates: [126.9780, 37.5665] },
  { name: "Pékin", coordinates: [116.4074, 39.9042] },
  { name: "Shanghai", coordinates: [121.4737, 31.2304] },
  { name: "Hong Kong", coordinates: [114.1694, 22.3193] },
  { name: "Singapour", coordinates: [103.8198, 1.3521] },
  { name: "Bangkok", coordinates: [100.5018, 13.7563] },
  { name: "Mumbai", coordinates: [72.8777, 19.0760] },
  { name: "Delhi", coordinates: [77.1025, 28.7041] },
  
  // Océanie
  { name: "Sydney", coordinates: [151.2093, -33.8688] },
  { name: "Melbourne", coordinates: [144.9631, -37.8136] },
  { name: "Brisbane", coordinates: [153.0251, -27.4698] },
  { name: "Auckland", coordinates: [174.7633, -36.8485] },
  
  // Afrique
  { name: "Le Caire", coordinates: [31.2357, 30.0444] },
  { name: "Johannesburg", coordinates: [28.0473, -26.2041] },
  { name: "Le Cap", coordinates: [18.4241, -33.9249] },
  { name: "Lagos", coordinates: [3.3792, 6.5244] },
  { name: "Nairobi", coordinates: [36.8219, -1.2921] },
];

export default function FestivalsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hoveredFestival, setHoveredFestival] = useState<Festival | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'country' | 'status' | 'pepite'>('status');

  // ZOOM MOBILE : initial 2x, max 30x (TRÈS FORT)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [position, setPosition] = useState({ 
    coordinates: [10, 50] as [number, number], 
    zoom: isMobile ? 2.5 : 1.5 // Mobile démarre encore plus zoomé
  });

  const handleFestivalClick = (festival: Festival) => {
    if (festival.hasDetailedPage) {
      navigate(`/${festival.id}`);
    } else {
      navigate(`/festivals/${festival.id}`);
    }
  };

  const getSortedFestivals = (): Festival[] => {
    const festivals = [...FESTIVALS_2026];
    
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
      case 'pepite':
        return festivals.sort((a, b) => {
          if (a.isPepite && !b.isPepite) return -1;
          if (!a.isPepite && b.isPepite) return 1;
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
                {FESTIVALS_2026.length} festivals • Metal, Rock & plus
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

                  {/* VILLES PRINCIPALES - Affichées seulement si zoom > 2 */}
                  {position.zoom > 2 && MAJOR_CITIES.map(city => (
                    <Annotation
                      key={city.name}
                      subject={city.coordinates}
                      dx={0}
                      dy={0}
                      connectorProps={{}}
                    >
                      <g>
                        {/* Point de la ville */}
                        <circle 
                          r={2 / position.zoom} 
                          fill="#888" 
                          stroke="#fff"
                          strokeWidth={0.5 / position.zoom}
                        />
                        {/* Nom de la ville - visible si zoom > 4 */}
                        {position.zoom > 4 && (
                          <text
                            x={4 / position.zoom}
                            y={1 / position.zoom}
                            fontSize={10 / position.zoom}
                            fill="#999"
                            style={{ fontFamily: 'system-ui', pointerEvents: 'none' }}
                          >
                            {city.name}
                          </text>
                        )}
                      </g>
                    </Annotation>
                  ))}

                  {/* FESTIVALS */}
                  {FESTIVALS_2026.map(festival => (
                    <Marker
                      key={festival.id}
                      coordinates={[festival.coordinates[1], festival.coordinates[0]]}
                      onMouseEnter={() => setHoveredFestival(festival)}
                      onMouseLeave={() => setHoveredFestival(null)}
                      onClick={() => handleFestivalClick(festival)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Effet pulse pour Live et Pépites */}
                      {(festival.hasDetailedPage || festival.isPepite) && (
                        <circle 
                          r={12 / position.zoom} 
                          fill={festival.isPepite ? '#ff5500' : '#00ff00'} 
                          opacity={0.3} 
                          className="animate-ping" 
                        />
                      )}
                      {/* Marqueur principal */}
                      <circle 
                        r={6 / position.zoom}
                        fill={festival.isPepite ? '#ff5500' : (festival.hasDetailedPage ? '#00ff00' : '#4d94ff')}
                        stroke="#FFFFFF"
                        strokeWidth={2 / position.zoom}
                        className="transition-opacity hover:opacity-80"
                        style={{
                          filter: festival.isPepite 
                            ? 'drop-shadow(0 0 8px #ff5500)' 
                            : (festival.hasDetailedPage ? 'drop-shadow(0 0 8px #00ff00)' : 'none')
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
                  {hoveredFestival.isPepite ? (
                    <span className="bg-[#ff5500] text-white text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 animate-pulse">
                      <Zap className="w-2.5 h-2.5" />
                      PÉPITE
                    </span>
                  ) : hoveredFestival.hasDetailedPage ? (
                    <span className="bg-[#00ff00] text-black text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      LIVE
                    </span>
                  ) : null}
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
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5500] animate-pulse drop-shadow-[0_0_5px_#ff5500]" />
                <span className="font-bold text-[#ff5500]">Pépite</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full bg-[#00ff00] animate-pulse drop-shadow-[0_0_5px_#00ff00]" />
                <span>Prog complète</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4d94ff]" />
                <span>Bientôt</span>
              </div>
            </div>

            {/* Indicateur zoom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-[#404040]">
              Zoom: {position.zoom.toFixed(1)}x / 30x
            </div>
          </div>
        )}

        {/* VIEW: LISTE (inchangée) */}
        {viewMode === 'list' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSortBy('name')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'name' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>A-Z</button>
              <button onClick={() => setSortBy('date')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'date' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>Date</button>
              <button onClick={() => setSortBy('country')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'country' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>Pays</button>
              <button onClick={() => setSortBy('status')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'status' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>Live / Bientôt</button>
              <button onClick={() => setSortBy('pepite')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${sortBy === 'pepite' ? 'bg-[#ff5500] text-white shadow-[0_0_10px_rgba(255,85,0,0.5)]' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-[#ff5500] hover:border-[#ff5500]/50'}`}>
                <Zap className="w-4 h-4" />
                Pépites
              </button>
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getSortedFestivals().map(festival => (
                <div
                  key={festival.id}
                  onClick={() => handleFestivalClick(festival)}
                  className={`bg-[#2d2d2d] border rounded-xl p-4 sm:p-5 cursor-pointer transition-all group ${
                    festival.isPepite ? 'border-[#ff5500]/50 hover:border-[#ff5500] hover:shadow-[0_0_15px_rgba(255,85,0,0.15)]' : 'border-[#404040] hover:border-[#4d94ff]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`text-lg sm:text-xl font-bold transition-colors ${festival.isPepite ? 'group-hover:text-[#ff5500]' : 'group-hover:text-[#4d94ff]'}`}>
                      {festival.name}
                    </h3>
                    {festival.isPepite ? (
                      <span className="bg-[#ff5500] text-white text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 animate-pulse">
                        <Zap className="w-2.5 h-2.5" />
                        PÉPITE
                      </span>
                    ) : festival.hasDetailedPage ? (
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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
