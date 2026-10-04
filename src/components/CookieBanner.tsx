// src/components/CookieBanner.tsx — consentement à la mesure d'audience (refuser = accepter en un clic)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONSENT_RESET_EVENT, getConsent, loadAnalytics, setConsent } from '@/lib/analytics';

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = getConsent();
    if (c === 'granted') loadAnalytics();
    setOpen(c === null);
    const onReset = () => setOpen(true);
    window.addEventListener(CONSENT_RESET_EVENT, onReset);
    return () => window.removeEventListener(CONSENT_RESET_EVENT, onReset);
  }, []);

  if (!open) return null;
  const choose = (v: 'granted' | 'denied') => { setConsent(v); setOpen(false); };

  return (
    <div role="dialog" aria-label="Cookies" className="sl-scope fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-lg border border-[var(--sl-gold)]/40 bg-[var(--sl-ink)] p-4 text-[var(--sl-paper)] shadow-2xl md:bottom-5">
      <p className="text-sm leading-relaxed">
        Setlive mesure son audience avec Google Analytics (adresse IP anonymisée), <strong>uniquement si tu es d’accord</strong>. Aucun autre traceur, aucune publicité.{' '}
        <Link to="/legal" className="underline">En savoir plus</Link>
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button onClick={() => choose('denied')} className="sl-btn sl-btn-sm border-[var(--sl-paper)]/40 text-[var(--sl-paper)] hover:bg-[var(--sl-paper)]/10">Refuser</button>
        <button onClick={() => choose('granted')} className="sl-btn sl-btn-sm border-[var(--sl-paper)]/40 text-[var(--sl-paper)] hover:bg-[var(--sl-paper)]/10">Accepter</button>
      </div>
    </div>
  );
}
