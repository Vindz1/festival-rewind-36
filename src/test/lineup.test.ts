import { describe, expect, it } from 'vitest';
import { isLineupNoise, parseLineup } from '@/lib/engine';

describe('parseLineup — affiche copiée-collée', () => {
  it('ignore les 10 scènes du Hellfest, les jours, les dates et les horaires', () => {
    const paste = `HELLFEST 2027 — THE ABSOLUTE EDITION
JEUDI 17 JUIN
17 juin 2027
MAINSTAGE 1
GOJIRA
18:30 - 19:30
Mainstage 2
Iron Maiden
WARZONE
Sick Of It All
Riot
Turnstile
VALLEY
Kyuss Lives!
Abyss
Year Of No Light
ALTAR
Cannibal Corpse
Forge
Obituary
TEMPLE
Batushka
Crypt
Emperor
HellStage
Metal Corner
Main Stage 01
Scène Warzone
Warzone Stage
17/06
VENDREDI
21:00 Slipknot
18h30 - 19h20 Mastodon
Opeth — 22:00
Alcest 20h45`;
    expect(parseLineup(paste)).toEqual([
      'GOJIRA', 'Iron Maiden', 'Sick Of It All', 'Turnstile', 'Kyuss Lives!', 'Year Of No Light',
      'Cannibal Corpse', 'Obituary', 'Batushka', 'Emperor', 'Slipknot', 'Mastodon', 'Opeth', 'Alcest',
    ]);
  });

  it('garde les groupes dont le nom commence par un chiffre', () => {
    expect(parseLineup('36 Crazyfists\n10 Years\n3 Inches Of Blood\n1349\n1914\n7 Weeks\n311\nSum 41\nBlink-182\n24/7 Diva Heaven'))
      .toEqual(['36 Crazyfists', '10 Years', '3 Inches Of Blood', '1349', '1914', '7 Weeks', '311', 'Sum 41', 'Blink-182', '24/7 Diva Heaven']);
  });

  it('retire puces, numérotation et pays, et dédoublonne', () => {
    expect(parseLineup('- Gojira\n• Mastodon\n1. Alcest\n12) Opeth\nGojira (FR)\nMetallica (US)\nGUNS N\' ROSES\nGuns N’ Roses'))
      .toEqual(['Gojira', 'Mastodon', 'Alcest', 'Opeth', 'Metallica', "GUNS N' ROSES"]);
  });

  it('accepte une liste séparée par des virgules', () => {
    expect(parseLineup('Gojira, Mastodon, Alcest, Opeth')).toEqual(['Gojira', 'Mastodon', 'Alcest', 'Opeth']);
  });

  it('ne confond pas un vrai groupe avec une scène voisine', () => {
    for (const band of ['Riot V', 'Temple Of Baal', 'Crypt Sermon', 'Valley Of The Sun', 'Forgotten Tomb', 'Abysmal Dawn', 'Dayseeker', 'Daylight', 'Mars Red Sky'])
      expect(isLineupNoise(band), band).toBe(false);
  });

  it('plafonne à 300 artistes', () => {
    expect(parseLineup(Array.from({ length: 350 }, (_, i) => `Band ${i + 1}`).join('\n'))).toHaveLength(300);
  });
});
