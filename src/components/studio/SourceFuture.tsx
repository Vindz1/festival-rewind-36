// src/components/studio/SourceFuture.tsx — Face A : concerts à venir (concert virtuel)
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Empty, PickRow, Spinner } from '@/components/vinyl/Ui';
import { toast } from 'sonner';
import { Profile, StudioItem, artistItem, fmtDate, parseLineup, searchArtists } from '@/lib/engine';

interface Props {
  onAdd: (items: StudioItem[]) => void;
  onRemove: (uid: string) => void;
  has: (uid: string) => boolean;
  profile: Profile;
}

interface Suggestion { mbid: string; name: string; disambiguation: string }

export default function SourceFuture({ onAdd, onRemove, has, profile }: Props) {
  const [q, setQ] = useState('');
  const [date, setDate] = useState('');
  const [sugg, setSugg] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [lineup, setLineup] = useState('');
  const parsed = parseLineup(lineup);

  useEffect(() => {
    if (q.trim().length < 2) { setSugg([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try { setSugg((await searchArtists(q.trim())).artists || []); } catch { setSugg([]); }
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const add = (name: string, mbid?: string) => {
    onAdd([artistItem(name, mbid, date || undefined, 'future')]);
    setQ('');
    setSugg([]);
  };
  const addLineup = () => {
    if (!parsed.length) return toast.error('Colle d’abord une liste d’artistes');
    onAdd(parsed.map((n) => artistItem(n, undefined, date || undefined, 'future')));
    setLineup('');
  };
  const toggle = (it: StudioItem) => (has(it.uid) ? onRemove(it.uid) : onAdd([it]));

  return (
    <div>
      <p className="mb-3 text-sm text-[var(--sl-muted)]">
        Un concert à venir ? Setlive reconstitue la setlist la plus probable à partir des derniers concerts de l’artiste.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_11rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sl-muted)]" />
          <input
            className="sl-input pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) add(q.trim(), sugg[0]?.name.toLowerCase() === q.trim().toLowerCase() ? sugg[0].mbid : undefined); }}
            placeholder="Nom de l’artiste…"
          />
          {loading && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sl-muted)]" />}
        </div>
        <input type="date" className="sl-input" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date du concert (facultatif)" />
      </div>

      {sugg.length > 0 && (
        <div className="sl-card mt-2 overflow-hidden">
          {sugg.map((s) => (
            <button key={s.mbid} className="sl-row w-full text-left" onClick={() => add(s.name, s.mbid)}>
              <span className="flex-1 text-sm font-semibold">{s.name}</span>
              {s.disambiguation && <span className="text-xs text-[var(--sl-muted)]">{s.disambiguation}</span>}
              <span className="sl-btn sl-btn-sm sl-btn-line">+</span>
            </button>
          ))}
        </div>
      )}
      <p className="sl-label mt-2">Entrée = ajouter le nom tel quel · la date est facultative</p>

      <div className="mt-6">
        <p className="sl-label mb-2">Mes concerts à venir (profil Setlist.fm)</p>
        <div className="sl-card overflow-hidden">
          {!profile.loaded ? (
            <Empty title="Profil non chargé" text="Charge ton profil dans l’onglet « Concerts passés » pour retrouver ici tes concerts à venir." />
          ) : !profile.futureItems.length ? (
            <Empty title="Rien de prévu" text="Aucun concert à venir sur ton profil." />
          ) : (
            <div className="sl-scroll max-h-[320px] overflow-y-auto">
              {profile.futureItems.map((it) => (
                <PickRow key={it.uid} title={it.artist} sub={[fmtDate(it.eventDate), it.sub].filter(Boolean).join(' · ')} added={has(it.uid)} onClick={() => toggle(it)} />
              ))}
            </div>
          )}
        </div>
        {profile.loaded && profile.futureItems.length > 0 && (
          <button className="sl-btn sl-btn-gold mt-3" onClick={() => onAdd(profile.futureItems)}>Tout ajouter ({profile.futureItems.length})</button>
        )}
      </div>

      <div className="sl-card-dim mt-6 p-4">
        <p className="sl-display text-xl">Un festival ? Colle l’affiche</p>
        <p className="mb-3 mt-1 text-xs text-[var(--sl-muted)]">
          Copie la liste des groupes depuis le site du festival (un nom par ligne, ou séparés par des virgules). Les jours, heures et doublons sont ignorés.
        </p>
        <textarea
          className="sl-input min-h-[120px] font-mono text-xs"
          value={lineup}
          onChange={(e) => setLineup(e.target.value)}
          placeholder={'Gojira\nMastodon\nAlcest\n…'}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="sl-label">{parsed.length ? `${parsed.length} artiste(s) reconnus` : 'Aucun artiste reconnu'}</span>
          <button className="sl-btn sl-btn-gold" onClick={addLineup} disabled={!parsed.length}>Ajouter à ma playlist</button>
        </div>
        {parsed.length > 15 && (
          <p className="mt-2 text-[11px] text-[var(--sl-muted)]">Au-delà de 15 artistes, Setlive prend leurs titres les plus connus (plus rapide) au lieu de leur setlist habituelle.</p>
        )}
      </div>
    </div>
  );
}
