import { describe, expect, it } from 'vitest';
import { PSEUDO_DOMAIN, authErrorMessage, displayIdentity, isPseudoEmail, realEmail, toLoginId } from '@/lib/identity';

describe('Compte : e-mail ou pseudo', () => {
  it('un pseudo devient une adresse interne, en minuscules', () => {
    expect(toLoginId('  Vindz ')).toEqual({ ok: true, kind: 'pseudo', pseudo: 'vindz', email: `vindz@${PSEUDO_DOMAIN}` });
    expect(toLoginId('metal_head-85.fr')).toMatchObject({ ok: true, kind: 'pseudo', pseudo: 'metal_head-85.fr' });
  });

  it('un e-mail reste un e-mail', () => {
    expect(toLoginId('Toi@Exemple.fr')).toEqual({ ok: true, kind: 'email', email: 'toi@exemple.fr' });
  });

  it('refuse les pseudos et adresses invalides', () => {
    for (const bad of ['', 'ab', 'avec espace', 'élodie', '-tiret', 'point.', 'a'.repeat(31), 'pas@valide', `x@${PSEUDO_DOMAIN}`]) {
      expect(toLoginId(bad).ok, bad).toBe(false);
    }
  });

  it('affiche le pseudo, jamais l’adresse interne, et ne la transmet pas au paiement', () => {
    const internal = `vindz@${PSEUDO_DOMAIN}`;
    expect(isPseudoEmail(internal)).toBe(true);
    expect(displayIdentity(internal)).toBe('vindz');
    expect(realEmail(internal)).toBeUndefined();
    expect(displayIdentity('toi@exemple.fr')).toBe('toi@exemple.fr');
    expect(realEmail('toi@exemple.fr')).toBe('toi@exemple.fr');
  });

  it('traduit les erreurs Supabase courantes', () => {
    expect(authErrorMessage('User already registered', 'pseudo', false)).toBe('Ce pseudo est déjà pris : choisis-en un autre.');
    expect(authErrorMessage('Invalid login credentials', 'pseudo', true)).toBe('Pseudo ou mot de passe incorrect.');
    expect(authErrorMessage('Invalid login credentials', 'email', true)).toBe('E-mail ou mot de passe incorrect.');
  });
});
