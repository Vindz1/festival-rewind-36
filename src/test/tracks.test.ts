import { describe, expect, it } from 'vitest';
import { isNotASong, norm, pickItunesArtist } from '@/lib/engine';

describe('lignes de setlist qui ne sont pas des morceaux', () => {
  it('écarte intros, solos et duos instrumentaux', () => {
    for (const s of ['Intro', 'Outro', 'Drum Solo', 'Guitar solo', 'Bass Solo', 'Duo Orgue/Guitare', 'Solo de batterie', 'Jam', 'Keyboard & Guitar Duo', 'Interlude'])
      expect(isNotASong(s), s).toBe(true);
  });
  it('garde les vrais titres, même s’ils contiennent ces mots', () => {
    for (const s of ['Solo Dolo', 'Intro to the Abyss', 'The Drum', 'Bass Is Loaded', 'Encore une fois', 'Hey Jude', 'Jam Session in Hell', '4 Words (to Choke Upon)'])
      expect(isNotASong(s), s).toBe(false);
  });
});

describe('noms avec ligatures', () => {
  it('« Ætheria Conscientia » = « Aetheria Conscientia »', () => {
    expect(norm('Ætheria Conscientia')).toBe(norm('Aetheria Conscientia'));
    expect(norm('Sólstafir')).toBe('solstafir');
  });
});

describe('homonymes iTunes', () => {
  const h2o = [
    { artistName: 'H2O', primaryGenreName: 'Hip-hop/Rap', artistId: 1 },
    { artistName: 'H2O', primaryGenreName: 'Alternative', artistId: 2 },
    { artistName: 'H2O Remix', primaryGenreName: 'Punk', artistId: 3 },
  ];
  it('préfère le groupe rock/punk portant exactement le nom', () => {
    expect(pickItunesArtist(h2o, 'H2O')?.artistId).toBe(2);
    expect(pickItunesArtist([{ artistName: 'Ætheria Conscientia', primaryGenreName: 'Metal', artistId: 9 }], 'Aetheria Conscientia')?.artistId).toBe(9);
  });
  it('ne prend jamais un autre nom', () => {
    expect(pickItunesArtist([{ artistName: '90s Sinister', primaryGenreName: 'Metal' }], 'Sinister 90')).toBeUndefined();
  });
});
