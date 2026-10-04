// src/pages/Collection.tsx — Vinyl Analytics intégré au site (page autonome /collection.html)
// Gratuit : valeur totale + 3 albums détaillés. Premium : plus-value, ROI, graphiques, liste complète, exports CSV/PDF.
// Le palier est envoyé à la page vinyle par postMessage (voir le bloc « accès Premium » de collection.html).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Crown } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/AuthContext';
import { checkExportQuota } from '@/lib/subscription';

export default function Collection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const frame = useRef<HTMLIFrameElement>(null);
  const [missing, setMissing] = useState(false);
  const [premium, setPremium] = useState(false);

  // Premium seulement une fois confirmé par le serveur ; sinon on reste en mode gratuit
  useEffect(() => {
    if (!user) { setPremium(false); return; }
    checkExportQuota(user.id).then((q) => setPremium(!!q?.isPremium)).catch(() => setPremium(false));
  }, [user]);

  const sendTier = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: 'sl-tier', tier: premium ? 'premium' : 'free' }, window.location.origin);
  }, [premium]);

  useEffect(() => { sendTier(); }, [sendTier]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === 'sl-ready') sendTier();
      if (e.data?.type === 'sl-upgrade') {
        toast.error('Cette fonction est réservée aux membres Premium.', {
          action: { label: user ? 'Voir Premium' : 'Se connecter', onClick: () => navigate(user ? '/subscription' : '/auth') },
        });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sendTier, user, navigate]);

  // Si /collection.html renvoie le site lui-même (fichier absent du déploiement), on l'explique au lieu d'afficher « le site dans le site »
  const onLoad = () => {
    try {
      const doc = frame.current?.contentDocument;
      if (doc && doc.getElementById('root')) { setMissing(true); return; }
    } catch { /* origine différente : on laisse tel quel */ }
    sendTier();
  };

  return (
    <div className="sl-page">
      <Header />

      <section className="mx-auto max-w-[92rem] px-4 pt-4 md:px-8">
        <div className="sl-card-dim p-5 md:p-6">
          <p className="sl-label">Collection</p>
          <h1 className="sl-display mt-1 text-3xl">Ta collection de vinyles, chiffrée</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed">
            Connecte ton compte Discogs (un jeton à coller, expliqué plus bas) : Setlive estime la valeur marché de chacun de tes disques selon son état, calcule ta plus-value
            et trace des graphiques de ta collection. Tu peux aussi estimer un seul vinyle, avec son code-barres.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            {premium ? (
              <span className="sl-mono inline-flex items-center gap-1.5 uppercase tracking-widest text-[var(--sl-gold)]"><Crown className="h-3.5 w-3.5" /> Premium : plus-value, ROI, graphiques, liste complète, exports CSV et PDF</span>
            ) : (
              <>
                <span className="text-[var(--sl-muted)]">
                  <strong className="text-[var(--sl-ink)]">Gratuit :</strong> la valeur totale de ta collection et 3 albums détaillés par tableau.
                  <strong className="ml-2 text-[var(--sl-ink)]">Premium :</strong> plus-value, ROI, graphiques, liste complète, exports CSV et PDF.
                </span>
                <Link to={user ? '/subscription' : '/auth'} className="sl-btn sl-btn-gold sl-btn-sm">{user ? 'Passer Premium' : 'Se connecter'}</Link>
              </>
            )}
          </p>
        </div>
      </section>

      {missing ? (
        <div className="mx-auto mt-10 max-w-lg rounded-lg border border-[var(--sl-groove)] bg-[var(--sl-paper)] p-8 text-center">
          <p className="sl-display text-3xl">Fichier introuvable</p>
          <p className="mt-3 text-sm text-[var(--sl-muted)]">
            Le fichier <code className="sl-mono">public/collection.html</code> n’est pas présent dans le déploiement. Ajoute-le dans le dépôt GitHub (dossier <code className="sl-mono">public</code>, nom exact en minuscules), puis redéploie.
          </p>
        </div>
      ) : (
        <iframe
          ref={frame}
          onLoad={onLoad}
          title="My Vinyl Collection — Analytics Pro"
          src="/collection.html"
          className="mt-4 w-full border-0"
          style={{ height: 'calc(100vh - 4rem)', minHeight: 760 }}
        />
      )}
      <Footer />
    </div>
  );
}
