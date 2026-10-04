// src/pages/FestivalDynamicPage.tsx — line-up d'un festival (slug dans l'URL)
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Frame, Spinner } from '@/components/vinyl/Ui';
import { supabase } from '@/integrations/supabase/client';

interface Festival { id: string; name: string; year: number; location: string; description: string; start_date: string; end_date: string }
interface Day { id: string; name: string; date?: string; order_index: number }
interface Stage { id: string; name: string; order_index: number }
interface Artist { id: string; name: string; stage_id: string; stage_name: string; day_id: string; day_name: string }

function status(f: Festival) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const s = new Date(f.start_date); s.setHours(0, 0, 0, 0);
  const e = new Date(f.end_date); e.setHours(23, 59, 59, 999);
  if (e < today) return { label: 'Terminé', color: 'var(--sl-muted)' };
  if (s <= today) return { label: 'En cours', color: 'var(--sl-wine-bright)' };
  return { label: 'À venir', color: 'var(--sl-forest-bright)' };
}

export default function FestivalDynamicPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [festival, setFestival] = useState<Festival | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: f, error } = await supabase.from('festivals').select('*').eq('slug', slug).eq('is_active', true).single();
      if (error || !f) { toast.error('Festival introuvable'); navigate('/festivals', { replace: true }); return; }
      setFestival(f);
      const [a, d, s] = await Promise.all([
        supabase.from('festival_artists').select('id, name, stage_id, day_id, festival_stages!inner(name), festival_days!inner(name)').eq('festival_id', f.id).order('order_index'),
        supabase.from('festival_days').select('id, name, date, order_index').eq('festival_id', f.id).order('order_index'),
        supabase.from('festival_stages').select('id, name, order_index').eq('festival_id', f.id).order('order_index'),
      ]);
      if (a.error) toast.error('Erreur lors du chargement des artistes');
      setArtists((a.data || []).map((x: any) => ({ id: x.id, name: x.name, stage_id: x.stage_id, stage_name: x.festival_stages.name, day_id: x.day_id, day_name: x.festival_days.name })));
      setDays(d.data || []);
      setStages(s.data || []);
      setLoading(false);
    })();
  }, [slug, navigate]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return artists.filter((a) => (!dayFilter || a.day_id === dayFilter) && (!stageFilter || a.stage_id === stageFilter) && (!q || a.name.toLowerCase().includes(q)));
  }, [artists, dayFilter, stageFilter, search]);

  const grouped = useMemo(() => {
    const out: { day: Day | { id: string; name: string }; items: Artist[] }[] = [];
    const order = days.length ? days : [...new Map(artists.map((a) => [a.day_id, { id: a.day_id, name: a.day_name }])).values()];
    order.forEach((d: any) => {
      const items = visible.filter((a) => a.day_id === d.id);
      if (items.length) out.push({ day: d, items });
    });
    return out;
  }, [visible, days, artists]);

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectVisible = () => setSelected((p) => new Set([...p, ...visible.map((a) => a.id)]));

  const create = () => {
    if (!festival) return;
    const pool = selected.size ? artists.filter((a) => selected.has(a.id)) : visible;
    const names = [...new Set(pool.map((a) => a.name))];
    if (!names.length) return toast.error('Aucun artiste à ajouter');
    navigate('/', { state: { artists: names, eventName: `${festival.name} ${festival.year}` } });
  };

  if (loading || !festival) {
    return <div className="sl-page"><Header /><div className="flex justify-center py-32"><Spinner className="h-7 w-7" /></div></div>;
  }
  const st = status(festival);
  const range = `${new Date(festival.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} → ${new Date(festival.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div className="sl-page pb-20">
      <Header />
      <Frame
        kicker={`${festival.location} · ${range}`}
        title={`${festival.name} ${festival.year}`}
        hero={
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="sl-mono text-[11px] uppercase tracking-widest" style={{ color: st.color }}>● {st.label}</span>
            <span className="sl-mono text-[11px] uppercase tracking-widest text-[var(--sl-paper)]/60">{artists.length} artistes</span>
            <Link to="/festivals" className="sl-mono text-[11px] uppercase tracking-widest text-[var(--sl-gold-bright)] underline">← Tous les festivals</Link>
          </div>
        }
      >
        {festival.description && <p className="mb-6 max-w-3xl text-sm text-[var(--sl-muted)]">{festival.description}</p>}

        <div className="sl-card-dim mb-8 space-y-3 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="sl-input" placeholder="Chercher un artiste…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="sl-btn sl-btn-line shrink-0" onClick={selectVisible}>Tout sélectionner ({visible.length})</button>
            {selected.size > 0 && <button className="sl-btn sl-btn-wine shrink-0" onClick={() => setSelected(new Set())}>Vider</button>}
          </div>
          {days.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button className={`sl-chip ${!dayFilter ? 'sl-chip-on' : ''}`} onClick={() => setDayFilter(null)}>Tous les jours</button>
              {days.map((d) => <button key={d.id} className={`sl-chip ${dayFilter === d.id ? 'sl-chip-on' : ''}`} onClick={() => setDayFilter(dayFilter === d.id ? null : d.id)}>{d.name}</button>)}
            </div>
          )}
          {stages.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button className={`sl-chip ${!stageFilter ? 'sl-chip-on' : ''}`} onClick={() => setStageFilter(null)}>Toutes les scènes</button>
              {stages.map((s) => <button key={s.id} className={`sl-chip ${stageFilter === s.id ? 'sl-chip-on' : ''}`} onClick={() => setStageFilter(stageFilter === s.id ? null : s.id)}>{s.name}</button>)}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {grouped.map(({ day, items }) => (
            <section key={day.id}>
              <div className="mb-3 flex items-center gap-3">
                <span className="sl-faceTab">{day.name}</span>
                <span className="flex-grow border-t border-[var(--sl-groove)]" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((a) => {
                  const on = selected.has(a.id);
                  return (
                    <button key={a.id} onClick={() => toggle(a.id)}
                      className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${on ? 'border-[var(--sl-ink)] bg-[var(--sl-ink)] text-[var(--sl-paper)]' : 'border-[var(--sl-groove)] bg-[var(--sl-paper)] hover:border-[var(--sl-gold)]'}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${on ? 'border-[var(--sl-gold-bright)] bg-[var(--sl-gold)]' : 'border-[var(--sl-groove)]'}`}>
                        {on && <Check className="h-3.5 w-3.5 text-[var(--sl-ink)]" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{a.name}</span>
                        <span className={`sl-mono block truncate text-[10px] uppercase tracking-wide ${on ? 'text-[var(--sl-paper)]/60' : 'text-[var(--sl-muted)]'}`}>{a.stage_name}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {!grouped.length && <p className="py-10 text-center text-sm text-[var(--sl-muted)]">Aucun artiste ne correspond.</p>}
        </div>
      </Frame>

      <div className="sl-noprint fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-[var(--sl-ink)] px-4 py-3 text-[var(--sl-paper)]">
        <span className="sl-mono text-[11px] uppercase tracking-widest">{selected.size ? `${selected.size} sélectionné(s)` : `Tout le line-up visible (${visible.length})`}</span>
        <button className="sl-btn sl-btn-gold" onClick={create}>Créer la playlist →</button>
      </div>
      <Footer />
    </div>
  );
}
