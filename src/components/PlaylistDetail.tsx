// src/components/PlaylistDetail.tsx — une playlist rouverte depuis « Back in Time »
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Copy, Crown, Download, ExternalLink } from 'lucide-react';
import { downloadFile, toCsv, toText, type Track } from '@/lib/engine';
import type { StoredTrack } from '@/lib/playlists';

const TMM = 'https://www.tunemymusic.com/fr/transfer';

interface Props { title: string; tracks: StoredTrack[]; canFiles: boolean }

export default function PlaylistDetail({ title, tracks, canFiles }: Props) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const asTracks: Track[] = tracks.map((t) => ({ artist: t.artist, name: t.name, source: t.source || 'top' }));
  const slug = title.replace(/[^a-z0-9]/gi, '_') || 'playlist';

  // Rouvrir une playlist déjà exportée ne consomme AUCUN export : la liste a déjà été comptée à l'export.
  const copy = async (thenOpen: boolean) => {
    try {
      await navigator.clipboard.writeText(toText(asTracks, false));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (thenOpen) {
        toast.success('Liste copiée : colle-la dans TuneMyMusic (source « Texte »).');
        window.open(TMM, '_blank', 'noopener');
      } else {
        toast.success('Liste copiée !');
      }
    } catch {
      toast.error('Impossible de copier la liste');
    }
  };

  const file = (kind: 'txt' | 'csv') => {
    if (!canFiles) {
      toast.error('Le téléchargement de fichiers est réservé aux membres Premium.', { action: { label: 'Voir Premium', onClick: () => navigate('/subscription') } });
      return;
    }
    if (kind === 'txt') downloadFile(`${slug}.txt`, toText(asTracks, false), 'text/plain');
    else downloadFile(`${slug}.csv`, toCsv(asTracks, false), 'text/csv');
  };

  return (
    <div className="border-t border-[var(--sl-groove)] bg-[var(--sl-paper-dim)] p-4" data-testid="playlist-detail">
      <div className="mb-3 flex flex-wrap gap-2">
        <button className="sl-btn sl-btn-gold" onClick={() => copy(true)}>
          <Copy className="h-3.5 w-3.5" /> Copier et ouvrir TuneMyMusic <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button className="sl-btn sl-btn-ink" onClick={() => copy(false)}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copié !' : 'Copier'}
        </button>
        <button className={`sl-btn sl-btn-line ${canFiles ? '' : 'opacity-60'}`} onClick={() => file('txt')}>
          {canFiles ? <Download className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5 text-[var(--sl-gold)]" />} .txt
        </button>
        <button className={`sl-btn sl-btn-line ${canFiles ? '' : 'opacity-60'}`} onClick={() => file('csv')}>
          {canFiles ? <Download className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5 text-[var(--sl-gold)]" />} .csv
        </button>
      </div>
      <p className="mb-3 text-[11px] text-[var(--sl-muted)]">
        Sur TuneMyMusic : choisis « Texte » comme source, colle la liste, puis ta plateforme (Spotify, Deezer, Apple Music…). Recopier cette liste ne consomme pas d’export.
      </p>
      <ol className="sl-scroll max-h-[360px] overflow-y-auto rounded border border-[var(--sl-groove)] bg-[var(--sl-paper)] text-sm">
        {tracks.map((t, i) => (
          <li key={`${t.artist}-${t.name}-${i}`} className="flex gap-3 border-b border-[var(--sl-groove)] px-3 py-1.5 last:border-b-0">
            <span className="sl-mono w-7 shrink-0 text-right text-[11px] text-[var(--sl-muted)]">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
            <span className="hidden truncate text-[var(--sl-muted)] sm:block">{t.artist}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
