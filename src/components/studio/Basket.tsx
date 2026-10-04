// src/components/studio/Basket.tsx — Face B : la sélection et les options
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { Empty, FaceTitle, Spinner } from '@/components/vinyl/Ui';
import { StudioItem, fmtDate } from '@/lib/engine';

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

export default function Basket(p: Props) {
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
        <div>
          <label className="sl-label mb-1 flex justify-between">
            <span>Titres par artiste sans setlist</span>
            <span className="text-[var(--sl-ink)]">{p.topCount}</span>
          </label>
          <input type="range" min={3} max={10} value={p.topCount} onChange={(e) => p.setTopCount(+e.target.value)} className="sl-range" />
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-xs">
          <input type="checkbox" checked={p.preferLive} onChange={(e) => p.setPreferLive(e.target.checked)} className="mt-0.5 accent-[var(--sl-gold)]" />
          <span>Ajouter « (Live) » aux titres exportés <span className="text-[var(--sl-muted)]">— pour tenter d’obtenir les versions live (expérimental)</span></span>
        </label>
        <button className="sl-btn sl-btn-ink w-full !py-4" onClick={p.onGenerate} disabled={p.busy || !p.items.length}>
          {p.busy ? <><Spinner /> {p.progress || 'Analyse…'}</> : `Générer la playlist${p.items.length ? ` (${p.items.length})` : ''}`}
        </button>
      </div>
    </section>
  );
}
