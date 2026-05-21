import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Map, List, MapPin, Calendar, Zap, Clock, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

// Carte HAUTE RÉS avec plus de détails.
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Type Festival aligné sur Supabase (cohérent avec AdminFestivals)
interface Festival {
  id: string;
  name: string;
  slug: string;
  year: number;
  location: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  order_index: number;
  latitude?: number;
  longitude?: number;
  genres?: string[];
  headliners?: string[];
}

export default function FestivalsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hoveredFestival, setHoveredFestival] = useState<Festival | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'location' | 'status'>('status');
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);

  // ZOOM sur l'Europe par défaut
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [position, setPosition] = useState({ 
    coordinates: [10, 52] as [number, number],
    zoom: isMobile ? 3 : 2.2
  });

  // Charger les festivals depuis Supabase
  useEffect(() => {
    const loadFestivals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('festivals')
        .select('*')
        .eq('is_active', true)
        .order('start_date');
      
      if (error) {
        console.error('Erreur chargement festivals:', error);
      } else {
        setFestivals(data || []);
      }
      setLoading(false);
    };
    
    loadFestivals();
  }, []);

  // Logique IDENTIQUE à AdminFestivals : festival terminé si end_date < aujourd'hui
  const isFestivalPast = (endDate: string): boolean => {
    if (!endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const festivalEnd = new Date(endDate);
    festivalEnd.setHours(23, 59, 59, 999);
    return festivalEnd < today;
  };

  // Festivals affichables : actifs ET ayant des coordonnées GPS pour la carte
  const visibleFestivals = festivals.filter(
    f => f.latitude != null && f.longitude != null
  );

  // Formatter une date pour l'affichage
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Formatter une plage de dates
  const formatDateRange = (start: string, end: string): string => {
    if (!start) return '';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : startDate;
    
    const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
    
    if (sameMonth) {
      const month = startDate.toLocaleDateString('fr-FR', { month: 'long' });
      const year = startDate.getFullYear();
      if (startDate.getDate() === endDate.getDate()) {
        return `${startDate.getDate()} ${month} ${year}`;
      }
      return `${startDate.getDate()}-${endDate.getDate()} ${month} ${year}`;
    }
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const handleFestivalClick = (festival: Festival) => {
    navigate(`/${festival.slug}`);
  };

  const getSortedFestivals = (): Festival[] => {
    const list = [...visibleFestivals];
    
    switch (sortBy) {
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      case 'date':
        return list.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      case 'location':
        return list.sort((a, b) => {
          const locCompare = a.location.localeCompare(b.location, 'fr');
          if (locCompare !== 0) return locCompare;
          return a.name.localeCompare(b.name, 'fr');
        });
      case 'status':
        return list.sort((a, b) => {
          const aPast = isFestivalPast(a.end_date);
          const bPast = isFestivalPast(b.end_date);
          if (!aPast && bPast) return -1;
          if (aPast && !bPast) return 1;
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        });
      default:
        return list;
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

        {loading && (
          <div className="text-center text-gray-400 py-12">Chargement des festivals...</div>
        )}

        {/* VIEW: CARTE */}
        {!loading && viewMode === 'map' && (
          <div className="relative bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
            <div className="absolute inset-0">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ 
                  scale: 180,
                  center: [10, 50] 
                }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup
                  zoom={position.zoom}
                  center={position.coordinates}
                  onMoveEnd={handleMoveEnd}
                  maxZoom={30}
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

                  {/* FESTIVALS */}
                  {visibleFestivals.map(festival => {
                    const isPast = isFestivalPast(festival.end_date);
                    
                    return (
                      <Marker
                        key={festival.id}
                        coordinates={[festival.longitude!, festival.latitude!]}
                        onMouseEnter={() => setHoveredFestival(festival)}
                        onMouseLeave={() => setHoveredFestival(null)}
                        onClick={() => handleFestivalClick(festival)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Effet pulse - uniquement pour festivals à venir, désactivé sur mobile */}
                        {!isMobile && !isPast && (
                          <circle 
                            r={12 / position.zoom} 
                            fill="#00ff00" 
                            opacity={0.3} 
                            className="animate-ping" 
                          />
                        )}
                        {/* Marqueur principal - gris si passé, vert si à venir */}
                        <circle 
                          r={6 / position.zoom}
                          fill={isPast ? '#666666' : '#00ff00'}
                          stroke="#FFFFFF"
                          strokeWidth={2 / position.zoom}
                          className="transition-opacity hover:opacity-80"
                          style={{
                            filter: isMobile || isPast ? 'none' : 'drop-shadow(0 0 8px #00ff00)'
                          }}
                        />
                        {/* Nom du festival - seulement pour festivals à venir */}
                        {!isPast && position.zoom > (isMobile ? 3 : 6) && (
                          <text
                            y={-10 / position.zoom}
                            fontSize={isMobile ? 14 / position.zoom : 11 / position.zoom}
                            textAnchor="middle"
                            fill="#fff"
                            style={{ 
                              fontFamily: 'system-ui', 
                              fontWeight: 'bold',
                              pointerEvents: 'none',
                              textShadow: '0 0 4px #000, 0 0 8px #000'
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
                    {formatDateRange(hoveredFestival.start_date, hoveredFestival.end_date)}
                  </div>
                </div>
              </div>
            )}

            {/* Indicateur zoom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-[#404040]">
              Zoom: {position.zoom.toFixed(1)}x / 30x
            </div>
          </div>
        )}

        {/* VIEW: LISTE */}
        {!loading && viewMode === 'list' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSortBy('name')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'name' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>A-Z</button>
              <button onClick={() => setSortBy('date')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'date' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>Date</button>
              <button onClick={() => setSortBy('location')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sortBy === 'location' ? 'bg-[#4d94ff] text-white' : 'bg-[#2d2d2d] text-gray-400 border border-[#404040] hover:text-white'}`}>Lieu</button>
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
                      isPast ? 'border-[#404040] hover:border-gray-500 opacity-70' : 'border-[#404040] hover:border-[#4d94ff]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`text-lg sm:text-xl font-bold transition-colors ${isPast ? 'text-gray-400 group-hover:text-gray-300' : 'group-hover:text-[#4d94ff]'}`}>
                        {festival.name}
                      </h3>
                      {isPast ? (
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

                    <div className="space-y-2 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{festival.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{formatDateRange(festival.start_date, festival.end_date)}</span>
                      </div>
                    </div>

                    {festival.genres && festival.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {festival.genres.map(g => (
                          <span key={g} className="text-xs px-2 py-1 rounded-full bg-[#4d94ff]/10 text-[#4d94ff] border border-[#4d94ff]/20">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {festival.headliners && festival.headliners.length > 0 && (
                      <div className="pt-3 border-t border-[#404040]">
                        <p className="text-xs text-gray-500 mb-1">Headliners :</p>
                        <p className="text-sm font-semibold text-white truncate">
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
      </main>

      <Footer />
    </div>
  );
}
