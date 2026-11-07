// src/components/studio/Basket.tsx — Face B : la sélection et les options
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { Empty, FaceTitle, Spinner } from '@/components/vinyl/Ui';
import { BULK_SECONDS_PER_ARTIST, BULK_THRESHOLD, StudioItem, fmtDate } from '@/lib/engine';

interface Props {
  items: StudioItem[];
  name: string;
  setName: (v: string) => void;
  topCount: number;
  setTopCount: (n: number) => void;
  preferLive: boolean;
  setPreferLive: (b: boolean) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onRemove: (uid: string) => void;
  onClear: () => void;
  onGenerate: () => void;
  busy: boolean;
  progress: string;
}

const ORIGIN = { past: 'Passé', future: 'À venir', festival: 'Festival' } as const;
const SONGS_MIN = 3;
const SONGS_MAX = 20;
/** TuneMyMusic : transfert gratuit limité à 500 titres. */
const TMM_LIMIT = 500;

export default function Basket(p: Props) {
  // Le curseur ne sert que pour les setlists devinées : artistes seuls (concerts à venir, festival) ou concerts sans setlist
  const guessedItems = p.items.filter((it) => it.kind === 'artist' || !it.songCount);
  const needsSlider = guessedItems.length > 0;
  const guessed = guessedItems.length;
  const exactSongs = p.items.filter((it) => it.kind !== 'artist' && it.songCount).reduce((n, it) => n + (it.songCount || 0), 0);
  const estimate = guessed * p.topCount + exactSongs;
  // Nombre de titres par groupe qui garde la playlist sous la limite gratuite de TuneMyMusic
  const fitPerGroup = guessed > 0 ? Math.floor((TMM_LIMIT - exactSongs) / guessed) : 0;
  // Grosse affiche : on prévient de l'attente (première fois seulement) ; barre d'avancement pendant la génération
  const waitMin = guessed > BULK_THRESHOLD ? Math.max(1, Math.round((guessed * BULK_SECONDS_PER_ARTIST) / 60)) : 0;
  const prog = /^(\d+)\/(\d+)/.exec(p.progress);
  const pct = p.busy && prog ? Math.round((+prog[1] / +prog[2]) * 100) : null;
  return (
    <section id="playlist" className="sl-card-dim p-4 md:p-5">
      <FaceTitle face="Face B" title="Ma playlist" right={p.items.length ? <button onClick={p.onClear} className="sl-mono text-[10px] uppercase tracking-widest text-[var(--sl-muted)] underline hover:text-[var(--sl-wine)]">Vider</button> : undefined} />

      <div className="sl-card overflow-hidden">
        {!p.items.length ? (
          <Empty title="Rien pour l’instant" text="Ajoute des concerts ou des artistes avec le bouton « + »." />
        ) : (
          <div className="sl-scroll max-h-[340px] overflow-y-auto">
            {p.items.map((it, i) => (
              <div key={it.uid} className="sl-row !gap-2">
                <span className="sl-mono w-6 shrink-0 text-right text-[10px] text-[var(--sl-muted)]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{it.artist}</p>
                  <p className="truncate text-[11px] text-[var(--sl-muted)]">
                    <span className="sl-mono uppercase">{ORIGIN[it.origin]}</span>
                    {it.eventDate ? ` · ${fmtDate(it.eventDate)}` : ''}
                  </p>
                </div>
                <button aria-label="Monter" className="p-1 text-[var(--sl-muted)] hover:text-[var(--sl-ink)] disabled:opacity-30" disabled={i === 0} onClick={() => p.onMove(i, -1)}><ArrowUp className="h-4 w-4" /></button>
                <button aria-label="Descendre" className="p-1 text-[var(--sl-muted)] hover:text-[var(--sl-ink)] disabled:opacity-30" disabled={i === p.items.length - 1} onClick={() => p.onMove(i, 1)}><ArrowDown className="h-4 w-4" /></button>
                <button aria-label="Retirer" className="p-1 text-[var(--sl-muted)] hover:text-[var(--sl-wine)]" onClick={() => p.onRemove(it.uid)}><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="sl-label mb-1 block">Nom de la playlist</label>
          <input className="sl-input" value={p.name} onChange={(e) => p.setName(e.target.value)} placeholder="Automatique si vide" />
        </div>
        {needsSlider && (
          <div className="rounded-lg border border-[var(--sl-groove)] bg-[var(--sl-paper)] p-4" data-testid="songs-slider">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="sl-label">Titres par groupe</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--sl-muted)]">
                  Pour les concerts à venir (setlist devinée) : on garde les titres les plus probables.
                </p>
              </div>
              <p className="sl-display shrink-0 text-5xl leading-none text-[var(--sl-ink)]">{p.topCount}</p>
            </div>
            <input
              type="range"
              min={SONGS_MIN}
              max={SONGS_MAX}
              step={1}
              value={p.topCount}
              onChange={(e) => p.setTopCount(+e.target.value)}
              className="sl-slider mt-4"
              style={{ ['--pct' as any]: `${((p.topCount - SONGS_MIN) / (SONGS_MAX - SONGS_MIN)) * 100}%` }}
              aria-label="Nombre de titres par groupe"
            />
            <div className="sl-mono mt-1.5 flex justify-between text-[10px] text-[var(--sl-muted)]">
              <span>{SONGS_MIN}</span><span>5</span><span>10</span><span>15</span><span>{SONGS_MAX}</span>
            </div>
            <p className="mt-3 border-t border-[var(--sl-groove)] pt-2 text-[11px] text-[var(--sl-muted)]">
              {guessed} artiste(s) à setlist devinée · jusqu’à <strong className="text-[var(--sl-ink)]">{estimate} titres</strong> au total
            </p>
            {waitMin > 0 && (
              <p className="mt-1 text-[11px] text-[var(--sl-muted)]">Grosse affiche : compte environ {waitMin} min la première fois (les groupes déjà connus sont instantanés).</p>
            )}
            {estimate > TMM_LIMIT && (
              <div className="mt-2 rounded border-l-4 border-[var(--sl-gold)] bg-[var(--sl-paper-dim)] p-2 text-[11px] leading-snug text-[var(--sl-ink)]" data-testid="tmm-warning">
                <p>TuneMyMusic limite les transferts gratuits à <strong>{TMM_LIMIT} titres</strong> : ta playlist en compte jusqu’à {estimate}.</p>
                {fitPerGroup >= SONGS_MIN ? (
                  <button type="button" className="sl-btn sl-btn-gold sl-btn-sm mt-2" onClick={() => p.setTopCount(Math.min(SONGS_MAX, fitPerGroup))}>
                    Passer à {Math.min(SONGS_MAX, fitPerGroup)} titres par groupe (sous {TMM_LIMIT})
                  </button>
                ) : (
                  <p className="mt-1 text-[var(--sl-muted)]">Même à {SONGS_MIN} titres par groupe, la limite est dépassée : retire quelques groupes ou fais plusieurs playlists.</p>
                )}
              </div>
            )}
          </div>
        )}
        <label className="flex cursor-pointer items-start gap-2 text-xs">
          <input type="checkbox" checked={p.preferLive} onChange={(e) => p.setPreferLive(e.target.checked)} className="mt-0.5 accent-[var(--sl-gold)]" />
          <span>Ajouter « (Live) » aux titres de setlist <span className="text-[var(--sl-muted)]">— pour retrouver les versions live sur ta plateforme (expérimental)</span></span>
        </label>
        <button className="sl-btn sl-btn-ink w-full !py-4" onClick={p.onGenerate} disabled={p.busy || !p.items.length}>
          {p.busy ? <><Spinner /> {p.progress || 'Analyse…'}</> : `Générer la playlist${p.items.length ? ` (${p.items.length})` : ''}`}
        </button>
        {pct !== null && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--sl-groove)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-[var(--sl-gold)] transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </section>
  );
}
