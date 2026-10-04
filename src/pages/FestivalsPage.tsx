// src/pages/FestivalsPage.tsx — carte + liste des festivals (données Supabase)
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { List, Map as MapIcon, MapPin, Minus, Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Empty, FaceTitle, Frame, Spinner } from '@/components/vinyl/Ui';
import { supabase } from '@/integrations/supabase/client';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

interface Festival {
  id: string; name: string; slug: string; year: number; location: string; description: string;
  start_date: string; end_date: string; latitude?: number; longitude?: number; genres?: string[]; headliners?: string[];
}

const isPast = (end?: string) => {
  if (!end) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const e = new Date(end); e.setHours(23, 59, 59, 999);
  return e < today;
};
const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
function range(start: string, end: string) {
  if (!start) return '';
  const a = new Date(start); const b = end ? new Date(end) : a;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    const m = a.toLocaleDateString('fr-FR', { month: 'long' });
    return a.getDate() === b.getDate() ? `${a.getDate()} ${m} ${a.getFullYear()}` : `${a.getDate()}-${b.getDate()} ${m} ${a.getFullYear()}`;
  }
  return `${fmt(start)} → ${fmt(end)}`;
}

export default function FestivalsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<Festival | null>(null);
  const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>({ coordinates: [10, 52], zoom: mobile ? 3 : 2.2 });

  useEffect(() => {
    supabase.from('festivals').select('*').eq('is_active', true).order('start_date').then(({ data, error }: any) => {
      if (error) console.error('Erreur chargement festivals:', error);
      setFestivals(data || []);
      setLoading(false);
    });
  }, []);

  const upcoming = useMemo(() => festivals.filter((f) => !isPast(f.end_date)), [festivals]);
  const past = useMemo(() => festivals.filter((f) => isPast(f.end_date)).reverse(), [festivals]);
  const mapped = festivals.filter((f) => f.latitude != null && f.longitude != null);
  const open = (f: Festival) => navigate(`/festivals/${f.slug}`);

  const Card = ({ f }: { f: Festival }) => {
    const done = isPast(f.end_date);
    return (
      <button onClick={() => open(f)} className={`sl-card group w-full p-5 text-left transition-colors hover:border-[var(--sl-gold)] ${done ? 'opacity-70' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="sl-display text-2xl leading-none">{f.name}</h3>
          <span className="sl-mono shrink-0 text-[10px] uppercase tracking-widest" style={{ color: done ? 'var(--sl-muted)' : 'var(--sl-forest)' }}>● {done ? 'Terminé' : 'À venir'}</span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--sl-muted)]"><MapPin className="h-3.5 w-3.5" />{f.location}</p>
        <p className="sl-mono mt-1 text-[11px] uppercase tracking-wide">{range(f.start_date, f.end_date)}</p>
        {f.headliners && f.headliners.length > 0 && <p className="mt-3 line-clamp-2 text-xs">{f.headliners.slice(0, 5).join(' · ')}</p>}
        {f.genres && f.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">{f.genres.slice(0, 4).map((g) => <span key={g} className="sl-chip !cursor-default">{g}</span>)}</div>
        )}
        <span className="sl-mono mt-4 block text-[10px] uppercase tracking-widest text-[var(--sl-gold)] group-hover:underline">Voir le line-up →</span>
      </button>
    );
  };

  return (
    <div className="sl-page">
      <Header />
      <Frame kicker="Line-ups & cartes" title="Festivals"
        hero={<p className="mt-4 max-w-xl text-sm text-[var(--sl-paper)]/70">Choisis un festival, sélectionne tes groupes, et Setlive en fait une playlist.</p>}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="sl-label">{upcoming.length} à venir · {past.length} terminés</p>
          <div className="sl-seg">
            <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}><MapIcon className="mr-1.5 inline h-3.5 w-3.5" />Carte</button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><List className="mr-1.5 inline h-3.5 w-3.5" />Liste</button>
          </div>
        </div>

        {loading && <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>}

        {!loading && view === 'map' && (
          <div className="sl-card-dim relative overflow-hidden" style={{ height: 'calc(100vh - 320px)', minHeight: 460 }}>
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 180, center: [10, 50] }} style={{ width: '100%', height: '100%' }}>
              <ZoomableGroup zoom={pos.zoom} center={pos.coordinates} onMoveEnd={(p: any) => setPos({ coordinates: p.coordinates, zoom: p.zoom })} minZoom={1} maxZoom={30}>
                <Geographies geography={geoUrl}>
                  {({ geographies }: any) => geographies.map((geo: any) => (
                    <Geography key={geo.rsmKey} geography={geo} fill="#FBF7EF" stroke="#C9BC9E" strokeWidth={0.6 / pos.zoom}
                      style={{ default: { outline: 'none' }, hover: { outline: 'none', fill: '#F1E9D8' }, pressed: { outline: 'none' } }} />
                  ))}
                </Geographies>
                {mapped.map((f) => {
                  const done = isPast(f.end_date);
                  return (
                    <Marker key={f.id} coordinates={[f.longitude!, f.latitude!]}
                      onClick={() => open(f)} onMouseEnter={() => setHover(f)} onMouseLeave={() => setHover(null)}>
                      <circle r={(done ? 3.5 : 5) / pos.zoom} fill={done ? '#8A8272' : '#C9971C'} stroke="#14110D" strokeWidth={1 / pos.zoom} style={{ cursor: 'pointer' }} />
                      {!done && pos.zoom >= 2.5 && (
                        <text y={-9 / pos.zoom} textAnchor="middle" style={{ fontSize: 10 / pos.zoom, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fill: '#14110D', pointerEvents: 'none' }}>{f.name}</text>
                      )}
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>

            <div className="absolute right-3 top-3 flex flex-col gap-1">
              <button className="sl-btn sl-btn-ink !p-2" aria-label="Zoom +" onClick={() => setPos((p) => ({ ...p, zoom: Math.min(30, p.zoom * 1.6) }))}><Plus className="h-4 w-4" /></button>
              <button className="sl-btn sl-btn-ink !p-2" aria-label="Zoom -" onClick={() => setPos((p) => ({ ...p, zoom: Math.max(1, p.zoom / 1.6) }))}><Minus className="h-4 w-4" /></button>
            </div>
            <div className="sl-mono absolute bottom-3 left-3 flex gap-4 rounded bg-[var(--sl-paper)]/90 px-3 py-2 text-[10px] uppercase tracking-widest">
              <span><span className="sl-dot mr-1.5" style={{ background: '#C9971C' }} />À venir</span>
              <span><span className="sl-dot mr-1.5" style={{ background: '#8A8272' }} />Terminé</span>
            </div>
            {hover && (
              <div className="pointer-events-none absolute left-3 top-3 max-w-[16rem] rounded bg-[var(--sl-ink)] p-3 text-[var(--sl-paper)] shadow-xl">
                <p className="sl-display text-xl leading-none">{hover.name}</p>
                <p className="mt-1 text-xs text-[var(--sl-paper)]/70">{hover.location}</p>
                <p className="sl-mono mt-1 text-[10px] uppercase tracking-wide text-[var(--sl-gold-bright)]">{range(hover.start_date, hover.end_date)}</p>
              </div>
            )}
          </div>
        )}

        {!loading && view === 'list' && (
          <div className="space-y-10">
            {upcoming.length > 0 && (
              <section>
                <FaceTitle face="Face A" title="À venir" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{upcoming.map((f) => <Card key={f.id} f={f} />)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <FaceTitle face="Face B" title="Terminés" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{past.map((f) => <Card key={f.id} f={f} />)}</div>
              </section>
            )}
            {!festivals.length && <Empty title="Aucun festival" text="Reviens bientôt, de nouvelles affiches arrivent." />}
          </div>
        )}
      </Frame>
      <Footer />
    </div>
  );
}
