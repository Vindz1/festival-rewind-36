import { beforeEach, describe, expect, it } from 'vitest';
import { ITEMS_TTL, RESULT_TTL, loadStudio, safeNext, saveStudio } from '@/lib/studioState';
import type { StudioItem } from '@/lib/engine';

const items: StudioItem[] = [
  { uid: 'future:artist:gojira', kind: 'artist', origin: 'future', artist: 'Gojira' },
  { uid: 'past:123:01-01-2024', kind: 'concert', origin: 'past', artist: 'Opeth', setlistId: '123', songCount: 12, sets: { set: [{ song: [{ name: 'Ghost of Perdition' }] }] } },
];
const result = { name: 'Hellfest', tracks: [{ artist: 'Gojira', name: 'Amazonia', source: 'average' as const }], report: [] };

describe('Studio gardé dans le navigateur (retour après connexion)', () => {
  beforeEach(() => localStorage.clear());

  it('retrouve la sélection, les réglages et le résultat', () => {
    saveStudio({ items, name: 'Hellfest', topCount: 3, preferLive: false, result }, 1_000);
    const s = loadStudio(1_000 + 60_000);
    expect(s.items?.map((i) => i.artist)).toEqual(['Gojira', 'Opeth']);
    expect(s.items?.[1].sets).toBeUndefined(); // setlist complète non stockée (rechargée par setlistId)
    expect(s.items?.[1].setlistId).toBe('123');
    expect(s).toMatchObject({ name: 'Hellfest', topCount: 3, preferLive: false });
    expect(s.result?.tracks).toHaveLength(1);
  });

  it('oublie le résultat après quelques heures, puis la sélection après une semaine', () => {
    saveStudio({ items, name: '', topCount: 5, preferLive: true, result }, 0);
    expect(loadStudio(RESULT_TTL + 1).result).toBeNull();
    expect(loadStudio(RESULT_TTL + 1).items).toHaveLength(2);
    expect(loadStudio(ITEMS_TTL + 1)).toEqual({});
  });

  it('résiste à un stockage vide ou abîmé', () => {
    expect(loadStudio()).toEqual({});
    localStorage.setItem('sl_studio_v1', '{pas du json');
    expect(loadStudio()).toEqual({});
  });

  it("n'accepte qu'un retour vers une page du site", () => {
    expect(safeNext('/?tab=future&voir=resultat')).toBe('/?tab=future&voir=resultat');
    expect(safeNext('https://exemple.com')).toBe('/');
    expect(safeNext('//exemple.com')).toBe('/');
    expect(safeNext(null)).toBe('/');
  });
});
