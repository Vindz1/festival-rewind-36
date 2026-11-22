// src/lib/identity.ts — compte avec un e-mail OU un simple pseudo (aucune adresse demandée).
// Supabase identifie les comptes par une adresse : pour un pseudo, on fabrique une adresse interne
// « pseudo@membres.setlive.fr » qui ne reçoit jamais rien. Le visiteur ne voit et ne tape que son pseudo.
// Contrepartie, affichée à l'inscription : sans vraie adresse, un mot de passe oublié ne peut pas être récupéré.

export const PSEUDO_DOMAIN = 'membres.setlive.fr';
/** 3 à 30 caractères : lettres, chiffres, point, tiret, tiret bas ; commence et finit par une lettre ou un chiffre. */
const PSEUDO_RE = /^[a-z0-9](?:[a-z0-9._-]{1,28})[a-z0-9]$/i;

export type LoginId =
  | { ok: true; kind: 'email' | 'pseudo'; email: string; pseudo?: string }
  | { ok: false; error: string };

/** Ce que la personne a tapé (e-mail ou pseudo) → l'adresse utilisée par Supabase. */
export function toLoginId(input: string): LoginId {
  const v = input.trim();
  if (!v) return { ok: false, error: 'Indique ton e-mail ou ton pseudo.' };
  if (v.includes('@')) {
    const email = v.toLowerCase();
    if (email.endsWith(`@${PSEUDO_DOMAIN}`)) return { ok: false, error: 'Cette adresse est réservée : indique simplement ton pseudo.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Cette adresse e-mail ne semble pas valide.' };
    return { ok: true, kind: 'email', email };
  }
  if (!PSEUDO_RE.test(v)) {
    return { ok: false, error: 'Pseudo : 3 à 30 caractères, lettres, chiffres, point, tiret ou tiret bas (pas d’espace ni d’accent).' };
  }
  const pseudo = v.toLowerCase();
  return { ok: true, kind: 'pseudo', pseudo, email: `${pseudo}@${PSEUDO_DOMAIN}` };
}

/** Compte créé avec un pseudo ? */
export function isPseudoEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase().endsWith(`@${PSEUDO_DOMAIN}`);
}

/** Nom à afficher : le pseudo pour un compte pseudo, sinon l'e-mail. */
export function displayIdentity(email?: string | null): string {
  if (!email) return '';
  return isPseudoEmail(email) ? email.slice(0, email.lastIndexOf('@')) : email;
}

/** Vraie adresse e-mail (à transmettre à Stripe, par exemple), ou undefined pour un compte pseudo. */
export function realEmail(email?: string | null): string | undefined {
  return email && !isPseudoEmail(email) ? email : undefined;
}

/** Messages Supabase les plus courants, en français et adaptés au pseudo. */
export function authErrorMessage(message: string | undefined, kind: 'email' | 'pseudo', isLogin: boolean): string {
  const m = (message || '').toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('already exists')) {
    return kind === 'pseudo' ? 'Ce pseudo est déjà pris : choisis-en un autre.' : 'Un compte existe déjà avec cette adresse : connecte-toi.';
  }
  if (m.includes('invalid login credentials')) {
    return kind === 'pseudo' ? 'Pseudo ou mot de passe incorrect.' : 'E-mail ou mot de passe incorrect.';
  }
  if (m.includes('password') && (m.includes('at least') || m.includes('should be'))) return 'Mot de passe trop court : 6 caractères minimum.';
  if (m.includes('rate limit')) return 'Trop de tentatives : réessaie dans quelques minutes.';
  return message || (isLogin ? 'Connexion impossible, réessaie dans un instant.' : 'Inscription impossible, réessaie dans un instant.');
}
