// src/lib/analytics.ts — Google Analytics chargé uniquement après consentement
const GA_ID = 'G-FK3VCCFRR7';
const KEY = 'sl_consent_v1';
const EVENT = 'sl-consent-reset';

export type Consent = 'granted' | 'denied' | null;

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch { return null; }
}

export function loadAnalytics() {
  if (typeof document === 'undefined' || document.querySelector(`script[data-sl-ga]`)) return;
  const w = window as any;
  w[`ga-disable-${GA_ID}`] = false;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  s.setAttribute('data-sl-ga', '1');
  document.head.appendChild(s);
  w.gtag('js', new Date());
  w.gtag('config', GA_ID, { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
}

export function setConsent(value: 'granted' | 'denied') {
  try { localStorage.setItem(KEY, value); } catch { /* navigation privée : on ignore */ }
  if (value === 'granted') loadAnalytics();
  else (window as any)[`ga-disable-${GA_ID}`] = true;
}

// « Gérer les cookies » : efface le choix et réaffiche le bandeau
export function resetConsent() {
  try { localStorage.removeItem(KEY); } catch { /* ignoré */ }
  (window as any)[`ga-disable-${GA_ID}`] = true;
  window.dispatchEvent(new Event(EVENT));
}
export const CONSENT_RESET_EVENT = EVENT;
