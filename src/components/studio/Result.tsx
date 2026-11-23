// src/components/studio/Result.tsx — résultat + export
import { Check, Copy, Crown, Download, ExternalLink, Lock, X } from 'lucide-react';
import { FaceTitle } from '@/components/vinyl/Ui';
import { Access, ItemReport, Source, Track, withLive } from '@/lib/engine';

interface Props {
  name: string;
  tracks: Track[];
  report: ItemReport[];
  preferLive: boolean;
  copied: boolean;
  quotaText: string;
  access: Access;
  onUnlock: () => void;
  onRemoveTrack: (t: Track) => void;
  onExport: (kind: 'copy' | 'txt' | 'csv') => void;
  /** Affiche découpée par jours : un onglet par jour (vide sinon). */
  days?: { label: string; count: number }[];
  /** Nombre de titres de toute l'affiche. */
  total?: number;
  /** Jour affiché (null = toute l'affiche). */
  day?: string | null;
  onDay?: (day: string | null) => void;
}

const SRC: Record<Source, { label: string; color: string }> = {
  exact: { label: 'Setlist exacte', color: 'var(--sl-forest)' },
  average: { label: 'Setlist moyenne', color: 'var(--sl-gold)' },
  top: { label: 'Top titres', color: 'var(--sl-wine)' },
};

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/** Liste de noms : en entier si elle est courte, sinon un aperçu et un dépliant (avec 300 groupes, sinon c'est un pavé). */
const NAMES_INLINE = 6;
function NameList({ names }: { names: string[] }) {
  if (names.length <= NAMES_INLINE) return <span>{names.join(', ')}</span>;
  return (
    <details className="group mt-1">
      <summary className="cursor-pointer select-none list-none text-[var(--sl-muted)] [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">{names.slice(0, 3).join(', ')}… </span>
        <span className="sl-mono whitespace-nowrap text-[10px] uppercase tracking-widest text-[var(--sl-ink)] underline">
          <span className="group-open:hidden">Voir la liste ({names.length})</span>
          <span className="hidden group-open:inline">Masquer la liste</span>
        </span>
      </summary>
      <p className="mt-2 max-h-48 overflow-y-auto leading-relaxed">{names.join(', ')}</p>
    </details>
  );
}

export default function Result({ name, tracks, report, preferLive, copied, quotaText, access, onUnlock, onRemoveTrack, onExport, days = [], total, day = null, onDay }: Props) {
  const hidden = tracks.length - access.visible;
  const counts = (['exact', 'average', 'top'] as Source[]).map((s) => ({ s, n: tracks.filter((t) => t.source === s).length }));
  const artists = new Set(tracks.map((t) => t.artist)).size;
  const empty = report.filter((r) => r.source === 'none' && r.reason !== 'ratelimit');
  const limited = report.filter((r) => r.reason === 'ratelimit');
  const fallback = report.filter((r) => r.source === 'top' || r.source === 'average');
  const avgCount = fallback.filter((r) => r.source === 'average').length;
  const topCount = fallback.length - avgCount;

  return (
    <section id="resultat" className="mt-10">
      <FaceTitle face="Face C" title={name} />

      {days.length > 1 && (
        <div className="mb-4" data-testid="day-tabs">
          <p className="sl-label mb-2">Une playlist par jour</p>
          <div className="flex flex-wrap gap-2">
            {[{ label: 'Toute l’affiche', value: null as string | null, count: total ?? tracks.length }, ...days.map((d) => ({ label: d.label, value: d.label as string | null, count: d.count }))].map((d) => {
              const on = day === d.value;
              return (
                <button
                  key={d.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onDay?.(d.value)}
                  className={`sl-mono rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors ${on ? 'border-[var(--sl-ink)] bg-[var(--sl-ink)] text-[var(--sl-paper)]' : 'border-[var(--sl-groove)] bg-[var(--sl-paper)] text-[var(--sl-ink)] hover:border-[var(--sl-gold)]'}`}
                >
                  {d.label} <span className={on ? 'text-[var(--sl-gold-bright)]' : 'text-[var(--sl-muted)]'}>{d.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border-l-4 border-[var(--sl-gold)] bg-[var(--sl-ink)] p-4 text-[var(--sl-paper)]">
          <p className="sl-mono text-[10px] uppercase tracking-[0.2em] text-[var(--sl-gold-bright)]">Morceaux</p>
          <p className="sl-display mt-1 text-4xl">{tracks.length}</p>
        </div>
        <div className="sl-card border-l-4 !border-l-[var(--sl-groove)] p-4">
          <p className="sl-label">Artistes</p>
          <p className="sl-display mt-1 text-4xl">{artists}</p>
        </div>
        {counts.filter((c) => c.n > 0).slice(0, 2).map((c) => (
          <div key={c.s} className="sl-card border-l-4 p-4" style={{ borderLeftColor: SRC[c.s].color }}>
            <p className="sl-label">{SRC[c.s].label}</p>
            <p className="sl-display mt-1 text-4xl">{c.n}</p>
          </div>
        ))}
      </div>

      {(empty.length > 0 || limited.length > 0 || fallback.length > 0) && (
        <div className="mt-4 space-y-2">
          {empty.length > 0 && (
            <div className="rounded-r-lg border-l-4 border-[var(--sl-wine)] bg-[var(--sl-paper-dim)] p-3 text-xs" data-testid="msg-empty">
              <strong className="text-[var(--sl-wine)]">Aucun titre trouvé pour {plural(empty.length, 'groupe')} :</strong>{' '}
              <NameList names={empty.map((r) => r.label)} />
            </div>
          )}
          {limited.length > 0 && (
            <div className="rounded-r-lg border-l-4 border-[var(--sl-gold)] bg-[var(--sl-paper-dim)] p-3 text-xs" data-testid="msg-limited">
              <strong>iTunes a ralenti pour {plural(limited.length, 'groupe')}.</strong> Relance « Générer la playlist » : les autres sont déjà en mémoire, seuls ceux-ci seront recherchés.{' '}
              <NameList names={limited.map((r) => r.label)} />
            </div>
          )}
          {fallback.length > 0 && (
            <div className="rounded-r-lg border-l-4 border-[var(--sl-gold)] bg-[var(--sl-paper-dim)] p-3 text-xs" data-testid="msg-fallback">
              <strong>Setlist devinée pour {plural(fallback.length, 'groupe')}</strong>
              {' '}({[
                avgCount ? `${avgCount} d’après leurs derniers concerts` : '',
                topCount ? `${topCount} d’après leurs titres les plus connus` : '',
              ].filter(Boolean).join(', ')}) :{' '}
              <NameList names={fallback.map((r) => `${r.label} (${r.source === 'average' ? 'moyenne' : 'top'})`)} />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="sl-card-dim p-5">
          <p className="sl-label mb-1">1 · Récupérer la liste</p>
          <p className="mb-4 text-xs text-[var(--sl-muted)]">{quotaText}</p>
          <div className="flex flex-wrap gap-2">
            <button className="sl-btn sl-btn-ink" onClick={() => onExport('copy')}>
              {copied ? <Check className="h-3.5 w-3.5" /> : access.canCopy ? <Copy className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} {copied ? 'Copié !' : 'Copier'}
            </button>
            <button className={`sl-btn ${access.canFiles ? 'sl-btn-line' : 'sl-btn-line opacity-60'}`} onClick={() => onExport('txt')} title={access.canFiles ? '' : 'Réservé aux membres Premium'}>
              {access.canFiles ? <Download className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5 text-[var(--sl-gold)]" />} .txt
            </button>
            <button className={`sl-btn ${access.canFiles ? 'sl-btn-line' : 'sl-btn-line opacity-60'}`} onClick={() => onExport('csv')} title={access.canFiles ? '' : 'Réservé aux membres Premium'}>
              {access.canFiles ? <Download className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5 text-[var(--sl-gold)]" />} .csv
            </button>
          </div>
        </div>
        <div className="sl-card-dim p-5">
          <p className="sl-label mb-1">2 · L’importer dans ton appli</p>
          <p className="mb-4 text-xs text-[var(--sl-muted)]">Sur TuneMyMusic, choisis « Texte » comme source, colle la liste, puis Spotify, Deezer, Apple Music…</p>
          <a className="sl-btn sl-btn-gold" href="https://www.tunemymusic.com/fr/transfer" target="_blank" rel="noreferrer">TuneMyMusic <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      </div>

      <div className="sl-card mt-6 overflow-hidden">
        <div className="sl-scroll max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--sl-ink)] text-[var(--sl-paper)]">
              <tr className="sl-mono text-[10px] uppercase tracking-[0.15em]">
                <th className="w-10 px-3 py-2 text-right">#</th>
                <th className="px-3 py-2 text-left">Titre</th>
                <th className="hidden px-3 py-2 text-left sm:table-cell">Artiste</th>
                <th className="hidden px-3 py-2 text-left md:table-cell">Source</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {tracks.slice(0, access.visible).map((t, i) => (
                <tr key={`${t.artist}-${t.name}-${i}`} className="border-b border-[var(--sl-groove)] hover:bg-[var(--sl-paper-dim)]">
                  <td className="sl-mono px-3 py-2 text-right text-[11px] text-[var(--sl-muted)]">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold">{withLive(t.name, t.source, preferLive)}<span className="block text-xs font-normal text-[var(--sl-muted)] sm:hidden">{t.artist}</span></td>
                  <td className="hidden px-3 py-2 sm:table-cell">{t.artist}</td>
                  <td className="hidden px-3 py-2 md:table-cell">
                    <span className="sl-mono inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--sl-muted)]">
                      <span className="sl-dot" style={{ background: SRC[t.source].color }} />{SRC[t.source].label}
                    </span>
                  </td>
                  <td className="px-2"><button aria-label="Retirer ce titre" className="p-1 text-[var(--sl-muted)] hover:text-[var(--sl-wine)]" onClick={() => onRemoveTrack(t)}><X className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {hidden > 0 && (
                <tr>
                  <td colSpan={5} className="bg-[var(--sl-paper-dim)] px-4 py-6 text-center">
                    <p className="sl-mono mb-3 text-[11px] uppercase tracking-widest text-[var(--sl-muted)]">
                      <Lock className="mr-1.5 inline h-3.5 w-3.5" />{hidden} titre(s) masqué(s)
                    </p>
                    <button className="sl-btn sl-btn-gold" onClick={onUnlock}>
                      {access.tier === 'anon' ? `Se connecter pour voir les ${tracks.length} titres` : `Débloquer les ${tracks.length} titres`}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
