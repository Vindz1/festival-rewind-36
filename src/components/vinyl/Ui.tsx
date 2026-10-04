// src/components/vinyl/Ui.tsx — briques visuelles « Vinyl » partagées
import { ReactNode } from 'react';

export function Groove({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {[92, 76, 60, 44, 28, 12].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
    </svg>
  );
}

// Cadre papier + bandeau encre, comme le rapport Vinyl Analytics
export function Frame({ kicker, title, children, hero }: { kicker: string; title: string; children: ReactNode; hero?: ReactNode }) {
  return (
    <main className="mx-auto max-w-[92rem] p-2 md:p-8">
      <div className="overflow-hidden rounded-lg bg-[var(--sl-paper)] shadow-2xl">
        <header className="relative overflow-hidden bg-[var(--sl-ink)] px-6 py-10 text-[var(--sl-paper)] md:px-12 md:py-14">
          <Groove className="pointer-events-none absolute -right-14 -top-14 h-64 w-64 text-[var(--sl-paper)] opacity-10" />
          <div className="relative z-10">
            <span className="sl-mono text-[10px] uppercase tracking-[0.3em] text-[var(--sl-gold-bright)] md:text-xs">{kicker}</span>
            <h1 className="sl-display mt-2 text-5xl leading-[0.95] md:text-7xl">{title}</h1>
            {hero}
          </div>
        </header>
        <div className="p-4 md:p-10">{children}</div>
      </div>
    </main>
  );
}

export function FaceTitle({ face, title, right }: { face: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="sl-faceTab">{face}</span>
      <span className="sl-display text-2xl">{title}</span>
      <span className="flex-grow border-t border-[var(--sl-groove)]" />
      {right}
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <Groove className="mb-3 h-16 w-16 text-[var(--sl-groove)]" />
      <p className="sl-display text-xl">{title}</p>
      {text && <p className="mt-1 max-w-xs text-xs text-[var(--sl-muted)]">{text}</p>}
    </div>
  );
}

// Ligne cliquable « + / ✓ » utilisée par les listes de concerts et d'artistes
export function PickRow({ title, sub, meta, added, onClick }: { title: string; sub?: string; meta?: string; added: boolean; onClick: () => void }) {
  return (
    <div className="sl-row">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        {sub && <p className="truncate text-xs text-[var(--sl-muted)]">{sub}</p>}
      </div>
      {meta && <span className="sl-mono hidden shrink-0 text-[10px] uppercase tracking-wide text-[var(--sl-muted)] sm:block">{meta}</span>}
      <button
        onClick={onClick}
        aria-label={added ? 'Retirer' : 'Ajouter'}
        className={`sl-btn sl-btn-sm shrink-0 ${added ? 'sl-btn-forest' : 'sl-btn-line'}`}
      >
        {added ? '✓' : '+'}
      </button>
    </div>
  );
}

// Mode d'emploi en étapes numérotées (orientation des nouveaux visiteurs)
export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="mb-8 grid gap-3 md:grid-cols-3">
      {items.map((s, i) => (
        <li key={s.title} className="sl-card-dim flex gap-3 p-4">
          <span className="sl-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sl-ink)] text-xl text-[var(--sl-gold-bright)]">{i + 1}</span>
          <span>
            <span className="sl-display block text-xl leading-none">{s.title}</span>
            <span className="mt-1 block text-xs leading-relaxed text-[var(--sl-muted)]">{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
