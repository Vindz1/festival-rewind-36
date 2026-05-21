import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Map, List, MapPin, Calendar, Zap, Plus, Minus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

interface Festival {
  id: string;
  name: string;
  slug: string;
  location: string;
  start_date: string;
  end_date: string;
  genres?: string[];
  headliners?: string[];
  is_active: boolean;
  latitude?: number;
  longitude?: number;
}

export default function FestivalsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [hoveredFestival, setHoveredFestival] = useState<Festival | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'country' | 'status'>('status');
  const [loading, setLoading] = useState(true);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [position, setPosition] = useState({ 
    coordinates: [10, 52] as [number, number],
    zoom: isMobile ? 3 : 2.2
  });

  // Charger les festivals depuis Supabase
  useEffect(() => {
    loadFestivals();
  }, []);

  const loadFestivals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('festivals')
      .select('*')
      .eq('is_active', true) // Ne charger QUE les festivals actifs (non masqués par l'admin)
      .order('start_date');

    if (error) {
      console.error('Erreur chargement festivals:', error);
    } else {
      setFestivals(data || []);
    }
    setLoading(false);
  };

  // 🆕 LOGIQUE AUTOMATIQUE : Déterminer si un festival est terminé ou en cours
  const isFestivalPast = (endDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Minuit aujourd'hui
    const festivalEnd = new Date(endDate);
    festivalEnd.setHours(23, 59, 59, 999); // Fin de journée du festival
    return festivalEnd < today;
  };

  const handleFestivalClick = (festival: Festival) => {
    navigate(`/${festival.slug}`);
  };

  const getSortedFestivals = (): Festival[] => {
    const festivalsCopy = [...festivals];
    
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
      const date = new Date(dateStr);
      return date.getTime();
    };
    
    switch (sortBy) {
      case 'name':
        return festivalsCopy.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      case 'date':
        return festivalsCopy.sort((a, b) => parseDate(a.start_date) - parseDate(b.start_date));
      case 'country':
        return festivalsCopy.sort((a, b) => {
          const countryCompare = a.location.localeCompare(b.location, 'fr');
          if (countryCompare !== 0) return countryCompare;
          return a.name.localeCompare(b.name, 'fr');
        });
      case 'status':
        // Trier : festivals en cours/à venir d'abord, puis terminés
        return festivalsCopy.sort((a, b) => {
          const aPast = isFestivalPast(a.end_date);
          const bPast = isFestivalPast(b.end_date);
          if (aPast && !bPast) return 1; // a terminé, b actif → b avant a
          if (!aPast && bPast) return -1; // a actif, b terminé → a avant b
          return parseDate(a.start_date) - parseDate(b.start_date); // Sinon tri par date
        });
      default:
        return festivalsCopy;
    }
  };

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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
                {festivals.length} festivals • Metal, Rock & plus
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

        {loading ? (
          <div className="text-center text-gray-400 py-20">Chargement des festivals...</div>
        ) : (
          <>
            {/* VIEW: CARTE */}
            {viewMode === 'map' && (
              <div className="relative bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
                <div className="absolute inset-0">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 180, center: [10, 50] }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <ZoomableGroup
                      zoom={position.zoom}
                      center={position.coordinates}
                      onMoveEnd={handleMoveEnd}
                      maxZoom={30}
                      minZoom={1}
                    >
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies.map(geo => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="#1a1a1a"
                              stroke="#505050"
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

                      {/* FESTIVALS - Avec logique de couleur automatique */}
                      {festivals.map(festival => {
                        if (!festival.latitude || !festival.longitude) return null;
                        
                        const isPast = isFestivalPast(festival.end_date);
                        const markerColor = isPast ? '#808080' : '#00ff00'; // Gris si passé, vert si actif
                        
                        return (
                          <Marker
                            key={festival.id}
                            coordinates={[festival.longitude, festival.latitude]}
                            onMouseEnter={() => setHoveredFestival(festival)}
                            onMouseLeave={() => setHoveredFestival(null)}
                            onClick={() => handleFestivalClick(festival)}
                            style={{ cursor: "pointer" }}
                          >
                            {/* Effet pulse UNIQUEMENT pour les festivals actifs (pas terminés) */}
                            {!isPast && (
                              <circle 
                                r={12 / position.zoom} 
                                fill={markerColor}
                                opacity={0.3} 
                                className="animate-ping" 
                              />
                            )}
                            
                            {/* Marqueur principal */}
                            <circle 
                              r={6 / position.zoom}
                              fill={markerColor}
                              stroke="#FFFFFF"
                              strokeWidth={2 / position.zoom}
                              className="transition-opacity hover:opacity-80"
                              style={{
                                filter: `drop-shadow(0 0 8px ${markerColor})`
                              }}
                            />
                            
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
                        );
                      })}
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
                      {isFestivalPast(hoveredFestival.end_date) ? (
                        <span className="bg-gray-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          TERMINÉ
                        </span>
                      ) : (
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
                        {formatDate(hoveredFestival.start_date)} - {formatDate(hoveredFestival.end_date)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Légende */}
                <div className="absolute top-4 right-4 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#404040] rounded-lg p-3 text-xs z-10 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#00ff00] animate-pulse drop-shadow-[0_0_5px_#00ff00]" />
                    <span>En cours / À venir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-600 drop-shadow-[0_0_5px_#808080]" />
                    <span>Terminés</span>
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
                  {getSortedFestivals().map(festival => {
                    const isPast = isFestivalPast(festival.end_date);
                    
                    return (
                      <div
                        key={festival.id}
                        onClick={() => handleFestivalClick(festival)}
                        className={`bg-[#2d2d2d] border rounded-xl p-4 sm:p-5 cursor-pointer transition-all group ${
                          isPast 
                            ? 'border-gray-600 hover:border-gray-500 opacity-75' 
                            : 'border-[#404040] hover:border-[#4d94ff]'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className={`text-lg sm:text-xl font-bold transition-colors ${
                            isPast ? 'text-gray-400' : 'group-hover:text-[#4d94ff]'
                          }`}>
                            {festival.name}
                          </h3>
                          {isPast ? (
                            <span className="bg-gray-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              TERMINÉ
                            </span>
                          ) : (
                            <span className="bg-[#00ff00] text-black text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 shrink-0">
                              <Zap className="w-2.5 h-2.5" />
                              LIVE
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
                            <span>{formatDate(festival.start_date)} - {formatDate(festival.end_date)}</span>
                          </div>
                        </div>

                        {festival.genres && festival.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {festival.genres.map((g, idx) => (
                              <span key={idx} className={`text-xs px-2 py-1 rounded-full ${
                                isPast 
                                  ? 'bg-gray-600/20 text-gray-500 border border-gray-600/30'
                                  : 'bg-[#4d94ff]/10 text-[#4d94ff] border border-[#4d94ff]/20'
                              }`}>
                                {g}
                              </span>
                            ))}
                          </div>
                        )}

                        {festival.headliners && festival.headliners.length > 0 && (
                          <div className="pt-3 border-t border-[#404040]">
                            <p className="text-xs text-gray-500 mb-1">Headliners :</p>
                            <p className={`text-sm font-semibold truncate ${isPast ? 'text-gray-400' : 'text-white'}`}>
                              {festival.headliners.slice(0, 3).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
