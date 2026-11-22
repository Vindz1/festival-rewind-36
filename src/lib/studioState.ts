// src/lib/studioState.ts — garde la sélection et le dernier résultat du Studio dans le navigateur.
// Sans ça, un visiteur qui colle une affiche, génère, puis clique « Se connecter pour voir les N titres »
// revient sur un Studio vide après l'inscription et doit tout recommencer.
import type { ItemReport, StudioItem, Track } from '@/lib/engine';

export interface StudioResult { tracks: Track[]; report: ItemReport[]; name: string }
export interface StudioState {
  items: StudioItem[];
  name: string;
  topCount: number;
  preferLive: boolean;
  result: StudioResult | null;
}

const KEY = 'sl_studio_v1';
/** La sélection est gardée une semaine… */
export const ITEMS_TTL = 7 * 24 * 3600 * 1000;
/** … le résultat, quelques heures seulement (le temps de créer un compte, pas de ressortir une vieille playlist). */
export const RESULT_TTL = 3 * 3600 * 1000;

export function saveStudio(s: StudioState, now = Date.now()) {
  try {
    // Les setlists complètes des concerts passés (« sets ») sont lourdes : on ne garde que l'identifiant,
    // le moteur les recharge au besoin.
    const items = s.items.map(({ sets, ...rest }) => rest);
    localStorage.setItem(KEY, JSON.stringify({ t: now, ...s, items }));
  } catch {
    /* stockage plein ou indisponible : tant pis, rien n'est perdu côté serveur */
  }
}

export function loadStudio(now = Date.now()): Partial<StudioState> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const d = JSON.parse(raw);
    const age = now - (Number(d.t) || 0);
    if (age > ITEMS_TTL) return {};
    return {
      items: Array.isArray(d.items) ? d.items : [],
      name: typeof d.name === 'string' ? d.name : '',
      topCount: Number.isFinite(d.topCount) ? d.topCount : undefined,
      preferLive: typeof d.preferLive === 'boolean' ? d.preferLive : undefined,
      result: age <= RESULT_TTL && d.result?.tracks?.length ? d.result : null,
    };
  } catch {
    return {};
  }
}

/** Adresse de retour après la connexion : uniquement un chemin interne au site. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
