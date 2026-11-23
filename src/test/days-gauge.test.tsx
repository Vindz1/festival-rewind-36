import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Basket from '@/components/studio/Basket';
import Result from '@/components/studio/Result';
import {
  type StudioItem, type Track, accessFor, artistItem, buildPlaylist, daysOf, estimateSongs, nextWeight, norm,
  parseLineup, parseLineupEntries, songsFor,
} from '@/lib/engine';

describe('Affiche découpée par jours', () => {
  it('range chaque groupe dans son jour, scènes et horaires ignorés', () => {
    const paste = `JEUDI 17 JUIN
17 juin 2027
MAINSTAGE 1
Gojira
18:30 - 19:30
WARZONE
Turnstile
VENDREDI 18 JUIN
Mastodon
Friday
Opeth
Jour 3
Alcest
20 juin
36 Crazyfists`;
    expect(parseLineupEntries(paste)).toEqual([
      { name: 'Gojira', day: 'Jeudi' },
      { name: 'Turnstile', day: 'Jeudi' },
      { name: 'Mastodon', day: 'Vendredi' },
      { name: 'Opeth', day: 'Vendredi' },
      { name: 'Alcest', day: 'Jour 3' },
      { name: '36 Crazyfists', day: '20 juin' },
    ]);
    // les noms seuls restent identiques à avant
    expect(parseLineup(paste)).toEqual(['Gojira', 'Turnstile', 'Mastodon', 'Opeth', 'Alcest', '36 Crazyfists']);
  });

  it('sans titre de jour, aucun jour n’est inventé', () => {
    const e = parseLineupEntries('Gojira\nMastodon');
    expect(e).toEqual([{ name: 'Gojira' }, { name: 'Mastodon' }]);
    expect(daysOf(e)).toEqual([]);
  });

  it('liste les jours dans l’ordre d’apparition', () => {
    expect(daysOf([{ day: 'Jeudi' }, { day: 'Jeudi' }, {}, { day: 'Vendredi' }])).toEqual(['Jeudi', 'Vendredi']);
  });
});

describe('Jauge par groupe', () => {
  it('aperçu = moitié du curseur, normal = curseur, plein volume = double (plafonné à 20)', () => {
    expect([songsFor(1, 3), songsFor(undefined, 3), songsFor(2, 3), songsFor(3, 3)]).toEqual([2, 3, 3, 6]);
    expect([songsFor(1, 1), songsFor(3, 15)]).toEqual([1, 20]);
  });

  it('cycle au clic : normal → plein volume → aperçu → normal', () => {
    expect([nextWeight(undefined), nextWeight(3), nextWeight(1), nextWeight(2)]).toEqual([3, 1, 2, 3]);
  });

  it('estime le total en tenant compte des jauges et des setlists exactes', () => {
    const items: StudioItem[] = [
      { ...artistItem('A'), weight: 3 },
      { ...artistItem('B'), weight: 1 },
      artistItem('C'),
      { uid: 'past:1', kind: 'concert', origin: 'past', artist: 'D', songCount: 12 },
    ];
    expect(estimateSongs(items, 4)).toBe(8 + 2 + 4 + 12);
  });
});

describe('Génération : jauge et jour appliqués à chaque groupe', () => {
  beforeEach(() => localStorage.clear());

  it('donne à chaque groupe son nombre de titres et son jour', async () => {
    // setlists moyennes déjà en mémoire : aucun appel réseau
    for (const a of ['Gojira', 'Mastodon', 'Alcest']) {
      const songs = Array.from({ length: 15 }, (_, i) => ({ name: `${a} ${i + 1}`, artist: a, ratio: 1 - i / 20 }));
      localStorage.setItem(`sl_avg_v3:${norm(a)}`, JSON.stringify({ t: Date.now(), v: { artist: a, basedOn: 20, songs } }));
    }
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const items: StudioItem[] = [
      { ...artistItem('Gojira'), day: 'Jeudi', weight: 3 },
      { ...artistItem('Mastodon'), day: 'Jeudi' },
      { ...artistItem('Alcest'), day: 'Vendredi', weight: 1 },
    ];
    const { tracks } = await buildPlaylist(items, { topCount: 4 });
    vi.unstubAllGlobals();
    const count = (a: string) => tracks.filter((t) => t.artist === a).length;
    expect([count('Gojira'), count('Mastodon'), count('Alcest')]).toEqual([8, 4, 2]);
    expect(tracks.filter((t) => t.day === 'Jeudi')).toHaveLength(12);
    expect(tracks.filter((t) => t.day === 'Vendredi')).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

const basketProps = (items: StudioItem[], over: Partial<Parameters<typeof Basket>[0]> = {}) => ({
  items, name: '', setName: () => {}, topCount: 3, setTopCount: () => {}, preferLive: true, setPreferLive: () => {},
  onMove: () => {}, onRemove: () => {}, onWeight: () => {}, onClear: () => {}, onGenerate: () => {}, busy: false, progress: '',
  ...over,
});

describe('Panier : la jauge', () => {
  it('affiche le nombre de titres et passe au réglage suivant au clic', () => {
    const onWeight = vi.fn();
    render(<Basket {...basketProps([{ ...artistItem('Gojira'), day: 'Jeudi' }, { ...artistItem('Alcest'), weight: 3 }], { onWeight })} />);
    const gauges = screen.getAllByTestId('gauge');
    expect(gauges.map((g) => g.textContent)).toEqual(['3', '6']);
    expect(gauges[1].getAttribute('aria-label')).toContain('Plein volume : 6 titres');
    fireEvent.click(gauges[0]);
    expect(onWeight).toHaveBeenCalledWith('future:artist:gojira', 3);
    expect(screen.getByText(/Jeudi/)).toBeTruthy();
  });

  it('pas de jauge sur un concert passé à setlist exacte', () => {
    render(<Basket {...basketProps([{ uid: 'past:1', kind: 'concert', origin: 'past', artist: 'Opeth', songCount: 14 }])} />);
    expect(screen.queryByTestId('gauge')).toBeNull();
  });

  it('affiche découpée par jours : la limite TuneMyMusic s’apprécie jour par jour', () => {
    const items: StudioItem[] = [];
    for (const d of ['Jeudi', 'Vendredi', 'Samedi']) for (let i = 0; i < 60; i++) items.push({ ...artistItem(`${d} ${i}`), day: d });
    render(<Basket {...basketProps(items, { topCount: 5 })} />); // 900 titres en tout, 300 par jour
    expect(screen.getByTestId('tmm-per-day').textContent).toContain('chaque jour tient dessous');
    expect(screen.queryByTestId('tmm-warning')).toBeNull();
  });
});

describe('Résultat : onglets par jour', () => {
  const tracks: Track[] = [
    { artist: 'Gojira', name: 'Amazonia', source: 'average', day: 'Jeudi' },
    { artist: 'Alcest', name: 'Oiseaux', source: 'average', day: 'Vendredi' },
  ];
  const base = {
    name: 'Hellfest', tracks, report: [], preferLive: true, copied: false, quotaText: '',
    access: accessFor({}, { canExport: true, isPremium: true }, 2), onUnlock: () => {}, onRemoveTrack: () => {}, onExport: () => {},
  };

  it('propose toute l’affiche puis chaque jour, et signale le choix', () => {
    const onDay = vi.fn();
    render(<Result {...base} total={2} days={[{ label: 'Jeudi', count: 1 }, { label: 'Vendredi', count: 1 }]} day={null} onDay={onDay} />);
    const tabs = screen.getByTestId('day-tabs').querySelectorAll('button');
    expect([...tabs].map((b) => b.textContent)).toEqual(['Toute l’affiche 2', 'Jeudi 1', 'Vendredi 1']);
    expect(tabs[0].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(tabs[2]);
    expect(onDay).toHaveBeenCalledWith('Vendredi');
  });

  it('sans jours, pas d’onglets', () => {
    render(<Result {...base} />);
    expect(screen.queryByTestId('day-tabs')).toBeNull();
  });
});
