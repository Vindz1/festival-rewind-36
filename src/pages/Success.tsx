// src/pages/Success.tsx — retour de paiement Stripe (thème Vinyl)
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Music } from 'lucide-react';
import { Header } from '@/components/Header';
import { Spinner } from '@/components/vinyl/Ui';

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    (async () => {
      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        setStatus(res.ok ? 'success' : 'error');
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    })();
  }, [sessionId]);

  return (
    <div className="sl-page">
      <Header />
      <main className="mx-auto mt-12 max-w-md px-4 pb-16 text-center">
        <div className="overflow-hidden rounded-lg bg-[var(--sl-paper)] p-8 shadow-2xl">
          {status === 'loading' && (
            <div className="space-y-4 py-6">
              <Spinner className="h-8 w-8" />
              <h2 className="sl-display text-3xl">Finalisation…</h2>
              <p className="text-sm text-[var(--sl-muted)]">Nous activons ton accès Premium.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <CheckCircle2 className="mx-auto h-16 w-16 text-[var(--sl-forest)]" />
              <div>
                <h1 className="sl-display text-4xl">Bienvenue <span className="text-[var(--sl-gold)]">Premium</span> !</h1>
                <p className="mt-2 text-sm text-[var(--sl-muted)]">Ton compte a été mis à niveau avec succès.</p>
              </div>
              <div className="sl-card-dim p-4 text-left">
                <p className="sl-label mb-3">Tes avantages actifs</p>
                <ul className="space-y-2 text-sm">
                  {['Exports illimités', 'Fichiers .txt et .csv', 'Historique complet', 'Support prioritaire'].map((a) => (
                    <li key={a} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--sl-gold)]" /> {a}</li>
                  ))}
                </ul>
              </div>
              {/* Rechargement complet : le statut Premium est relu partout */}
              <button onClick={() => window.location.assign('/')} className="sl-btn sl-btn-ink w-full !py-4">
                Commencer à créer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-4">
              <Music className="mx-auto h-12 w-12 text-[var(--sl-wine)]" />
              <h2 className="sl-display text-3xl text-[var(--sl-wine)]">Une erreur est survenue</h2>
              <p className="text-sm text-[var(--sl-muted)]">Le paiement a peut-être réussi mais l’activation a échoué. Écris-nous à <a className="underline" href="mailto:setlive@proton.me">setlive@proton.me</a> avec ton adresse e-mail.</p>
              <button onClick={() => navigate('/subscription')} className="sl-btn sl-btn-line">Retour</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
