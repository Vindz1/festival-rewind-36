// src/components/studio/SourcePast.tsx — Face A : concerts passés (recherche + profil Setlist.fm)
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Empty, PickRow, Spinner } from '@/components/vinyl/Ui';
import { StudioItem, Profile, concertToItem, fmtDate, parseDate, searchConcerts, sleep } from '@/lib/engine';

interface Props {
  onAdd: (items: StudioItem[]) => void;
  onRemove: (uid: string) => void;
  has: (uid: string) => boolean;
  profile: Profile;
  onLoadProfile: (username: string) => void;
}

const meta = (it: StudioItem) => (it.songCount ? `${it.songCount} titres` : 'sans setlist');

export default function SourcePast({ onAdd, onRemove, has, profile, onLoadProfile }: Props) {
  const [mode, setMode] = useState<'search' | 'profile'>('search');

  // ----- recherche -----
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [raw, setRaw] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState('');

  const run = async (reset: boolean) => {
    if (!q.trim()) return toast.error('Saisis un artiste, un festival, une tournée ou une ville');
    setLoading(true);
    const start = reset ? 1 : page + 1;
    let acc: any[] = [];
    let last = start - 1;
    let hasMore = false;
    for (let i = 0; i < 3; i++) {
      try {
        const d = await searchConcerts(q.trim(), type, start + i);
        const r = d.results || [];
        if (!r.length) { hasMore = false; break; }
        acc = acc.concat(r);
        last = start + i;
        hasMore = !!d.hasMore;
        if (!hasMore) break;
        if (i < 2) await sleep(500);
      } catch (e: any) {
        if (e.status === 429) toast.warning('Setlist.fm ralentit la recherche, réessaie dans un instant.');
        else if (i === 0) toast.error('Erreur de recherche');
        break;
      }
    }
    const merged = reset ? acc : raw.concat(acc);
    const seen = new Set<string>();
    setRaw(merged.filter((c) => (seen.has(c.id) ? false : seen.add(c.id))));
    setPage(last);
    setMore(hasMore);
    setSearched(q.trim());
    setLoading(false);
    if (reset && !acc.length) toast.error(`Aucun résultat pour « ${q.trim()} »`);
  };
  const results = useMemo(() => raw.map((c) => concertToItem(c, 'past')), [raw]);

  // ----- profil -----
  const [username, setUsername] = useState(() => localStorage.getItem('setlistfm_username') || '');
  const [filter, setFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(() => {
    const f = filter.toLowerCase().trim();
    const a = from ? new Date(from + 'T00:00:00') : null;
    const b = to ? new Date(to + 'T23:59:59') : null;
    return profile.pastItems.filter((it) => {
      const d = parseDate(it.eventDate);
      if (a && (!d || d < a)) return false;
      if (b && (!d || d > b)) return false;
      if (!f) return true;
      return `${it.artist} ${it.sub} ${it.eventDate}`.toLowerCase().includes(f);
    });
  }, [profile.pastItems, filter, from, to]);

  const addAll = () => {
    // ordre chronologique : pratique pour reconstituer un festival jour par jour
    const sorted = [...filtered].sort((x, y) => (parseDate(x.eventDate)?.getTime() ?? 0) - (parseDate(y.eventDate)?.getTime() ?? 0));
    onAdd(sorted);
  };
  // Tout ajouter (ex. un festival entier) : dans l'ordre chronologique
  const addAllResults = () => {
    const sorted = [...results].sort((x, y) => (parseDate(x.eventDate)?.getTime() ?? 0) - (parseDate(y.eventDate)?.getTime() ?? 0));
    onAdd(sorted);
  };
  const toggle = (it: StudioItem) => (has(it.uid) ? onRemove(it.uid) : onAdd([it]));

  const loadProfile = () => {
    const u = username.trim();
    if (!u) return toast.error('Saisis ton pseudo Setlist.fm');
    localStorage.setItem('setlistfm_username', u);
    onLoadProfile(u);
  };

  return (
    <div>
      <div className="sl-seg mb-4">
        <button className={mode === 'search' ? 'on' : ''} onClick={() => setMode('search')}>Rechercher</button>
        <button className={mode === 'profile' ? 'on' : ''} onClick={() => setMode('profile')}>Mon profil Setlist.fm</button>
      </div>

      {mode === 'search' && (
        <div>
          <form onSubmit={(e) => { e.preventDefault(); run(true); }} className="flex flex-col gap-2 sm:flex-row">
            <input className="sl-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Artiste, festival, tournée ou ville (ex. Gojira, Hellfest 2025)" />
            <select className="sl-input sm:w-40" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">Tout (conseillé)</option>
              <option value="artistName">Artiste</option>
              <option value="cityName">Festival / ville</option>
              <option value="tourName">Tournée</option>
              <option value="venueName">Salle / scène</option>
            </select>
            <button type="submit" className="sl-btn sl-btn-ink" disabled={loading}>
              {loading ? <Spinner /> : <Search className="h-3.5 w-3.5" />} Chercher
            </button>
          </form>

          <div className="sl-card mt-4 overflow-hidden">
            {!results.length ? (
              <Empty title={searched ? 'Aucun concert' : 'Prêt à fouiller'} text={searched ? 'Essaie une autre orthographe, ou la ville du festival (ex. Clisson 2025).' : 'Un artiste, un festival (ex. Hellfest 2025), une tournée ou une ville : tout est dans les archives de setlist.fm.'} />
            ) : (
              <div className="sl-scroll max-h-[520px] overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--sl-groove)] bg-[var(--sl-paper-dim)] px-3 py-2">
                  <span className="sl-label">{results.length} concert(s) affiché(s)</span>
                  <button className="sl-btn sl-btn-gold sl-btn-sm" onClick={addAllResults}>Tout ajouter ({results.length})</button>
                </div>
                {results.map((it) => (
                  <PickRow key={it.uid} title={`${it.artist}`} sub={`${fmtDate(it.eventDate)} · ${it.sub}`} meta={meta(it)} added={has(it.uid)} onClick={() => toggle(it)} />
                ))}
                {more && (
                  <div className="p-3 text-center">
                    <button className="sl-btn sl-btn-line" onClick={() => run(false)} disabled={loading}>
                      {loading ? <Spinner /> : '+'} Charger plus de dates
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'profile' && (
        <div>
          <form onSubmit={(e) => { e.preventDefault(); loadProfile(); }} className="flex flex-col gap-2 sm:flex-row">
            <input className="sl-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ton pseudo Setlist.fm" />
            <button type="submit" className="sl-btn sl-btn-ink" disabled={profile.loading}>
              {profile.loading ? <Spinner /> : null} {profile.loaded ? 'Recharger' : 'Charger mes concerts'}
            </button>
          </form>
          {profile.partial && (
            <p className="mt-3 rounded border-l-4 border-[var(--sl-wine)] bg-[var(--sl-paper-dim)] p-3 text-xs">
              ⚠ Setlist.fm a limité le débit : la liste est peut-être incomplète. Utilise « Recharger ».
            </p>
          )}

          {profile.loaded && (
            <>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                <input className="sl-input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`Filtrer ${filtered.length}/${profile.pastItems.length} concerts (artiste, lieu, date)`} />
                <input type="date" className="sl-input sm:w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Du" />
                <input type="date" className="sl-input sm:w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Au" />
                <button className="sl-btn sl-btn-gold" onClick={addAll} disabled={!filtered.length}>Tout ajouter ({filtered.length})</button>
              </div>
              <p className="sl-label mt-2">Astuce : choisis une plage de dates pour ajouter d’un coup tous les concerts d’un festival.</p>
              <div className="sl-card mt-3 overflow-hidden">
                {!filtered.length ? <Empty title="Aucun concert" text="Change les filtres ou recharge le profil." /> : (
                  <div className="sl-scroll max-h-[520px] overflow-y-auto">
                    {filtered.map((it) => (
                      <PickRow key={it.uid} title={it.artist} sub={`${fmtDate(it.eventDate)} · ${it.sub}`} meta={meta(it)} added={has(it.uid)} onClick={() => toggle(it)} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
