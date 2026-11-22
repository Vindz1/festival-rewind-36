import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Result from '@/components/studio/Result';
import { accessFor, type ItemReport, type Track } from '@/lib/engine';

const props = (report: ItemReport[], tracks: Track[]) => ({
  name: 'Test', tracks, report, preferLive: true, copied: false, quotaText: '',
  access: accessFor(null, null, tracks.length), onUnlock: () => {}, onRemoveTrack: () => {}, onExport: () => {},
});

describe('Résultat : messages sous la playlist', () => {
  it('300 groupes devinés : un résumé court et une liste dépliante fermée', () => {
    const report: ItemReport[] = Array.from({ length: 300 }, (_, i) => ({
      uid: `u${i}`, label: `Groupe ${i + 1}`, source: i < 294 ? 'average' : 'top', count: 3,
    }));
    const tracks: Track[] = report.map((r) => ({ artist: r.label, name: 'Titre', source: r.source as 'average' }));
    render(<Result {...props(report, tracks)} />);
    const msg = screen.getByTestId('msg-fallback');
    expect(msg.textContent).toContain('Setlist devinée pour 300 groupes');
    expect(msg.textContent).toContain('294 d’après leurs derniers concerts, 6 d’après leurs titres les plus connus');
    expect(msg.textContent).toContain('Voir la liste (300)');
    const details = msg.querySelector('details')!;
    expect(details.open).toBe(false);
    // texte visible avant dépliage : le résumé seul (la liste complète est dans le dépliant)
    expect(details.querySelector('summary')!.textContent!.length).toBeLessThan(120);
  });

  it('peu de groupes : la liste reste affichée en entier, sans dépliant', () => {
    const report: ItemReport[] = [
      { uid: 'a', label: 'Gojira', source: 'average', count: 5 },
      { uid: 'b', label: 'Alcest', source: 'top', count: 5 },
      { uid: 'c', label: 'Inconnu', source: 'none', count: 0, reason: 'notfound' },
    ];
    const tracks: Track[] = [{ artist: 'Gojira', name: 'Amazonia', source: 'average' }];
    render(<Result {...props(report, tracks)} />);
    expect(screen.getByTestId('msg-fallback').textContent).toContain('Gojira (moyenne), Alcest (top)');
    expect(screen.getByTestId('msg-fallback').querySelector('details')).toBeNull();
    expect(screen.getByTestId('msg-empty').textContent).toContain('Aucun titre trouvé pour 1 groupe : Inconnu');
  });
});
