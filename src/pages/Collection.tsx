// src/pages/Collection.tsx — Vinyl Analytics intégré au site (page autonome /collection.html)
// Gratuit : valeur totale + 3 albums détaillés. Premium : plus-value, ROI, graphiques, liste complète, exports CSV/PDF.
// Le palier est envoyé à la page vinyle par postMessage (voir le bloc « accès Premium » de collection.html).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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

  // La page vinyle occupe toute sa hauteur : une seule barre de défilement (celle du site), pas de zone interne
  useEffect(() => {
    const fit = () => {
      const f = frame.current;
      const body = f?.contentDocument?.body;
      if (!f || !body) return;
      const h = Math.ceil(Math.max(body.offsetHeight, body.scrollHeight));
      if (h > 200 && Math.abs(h - f.offsetHeight) > 1) f.style.height = `${h}px`;
    };
    const id = window.setInterval(fit, 400);
    return () => window.clearInterval(id);
  }, []);

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

      <p className="mx-auto max-w-[92rem] px-4 pt-4 text-sm leading-relaxed md:px-8">
        <strong>Collection :</strong> connecte ton compte Discogs (un jeton à coller, expliqué plus bas) et Setlive estime la valeur de chacun de tes vinyles selon son état.{' '}
        {premium ? (
          <span className="text-[var(--sl-muted)]">Compte Premium : plus-value, ROI, graphiques, liste complète et exports CSV et PDF sont débloqués.</span>
        ) : (
          <span className="text-[var(--sl-muted)]">
            Gratuit : valeur totale et 3 albums détaillés par tableau. Premium : plus-value, ROI, graphiques, liste complète, exports CSV et PDF.{' '}
            <Link to={user ? '/subscription' : '/auth'} className="font-semibold text-[var(--sl-gold)] underline">{user ? 'Passer Premium' : 'Se connecter'}</Link>
          </span>
        )}
      </p>

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
          scrolling="no"
          className="mt-2 block w-full border-0"
          style={{ height: 900 }}
        />
      )}
      <Footer />
    </div>
  );
}
