// src/pages/Subscription.tsx — offres, paiement Stripe, gestion de l'abonnement (thème Vinyl)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Check, Crown, ExternalLink, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Frame, Groove, Spinner } from '@/components/vinyl/Ui';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';

const FREE_FEATURES = [
  '2 exports par an (copie de la liste)',
  'Liste complète tant qu’il reste des exports',
  'Historique enregistré, consultable avec Premium',
];
const PREMIUM_FEATURES = [
  'Exports illimités',
  'Téléchargement des listes en .txt et .csv',
  'Historique complet de tes playlists',
  'Badge supporter',
  'Support prioritaire',
  'Tu soutiens un projet indépendant',
];

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non définie';

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'premium' | null>(null);
  const [renewalDate, setRenewalDate] = useState('');

  useEffect(() => {
    if (!user) return;
    getUserSubscription(user.id).then((sub: any) => {
      setCurrentPlan(sub.subscription_type);
      setRenewalDate(sub.end_date || '');
    });
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Connecte-toi pour t’abonner.');
      navigate('/auth');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error('no url');
    } catch (error) {
      console.error(error);
      toast.error('Erreur de paiement. Vérifie ta connexion.');
      setLoading(false);
    }
  };

  const openPortal = async () => {
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error('Erreur de connexion à Stripe');
    }
  };

  // --- Déjà Premium ---
  if (currentPlan === 'premium') {
    return (
      <div className="sl-page">
        <Header />
        <Frame kicker="Mon abonnement" title="Tu es Premium">
          <div className="mx-auto max-w-2xl space-y-6">
            <p className="text-sm text-[var(--sl-muted)]">Merci de soutenir le projet Setlive.fr !</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sl-card border-l-4 !border-l-[var(--sl-forest)] p-4">
                <p className="sl-label">Statut</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-[var(--sl-forest)]"><Check className="h-4 w-4" /> Actif</p>
              </div>
              <div className="sl-card border-l-4 !border-l-[var(--sl-gold)] p-4">
                <p className="sl-label">Renouvellement</p>
                <p className="mt-1 flex items-center gap-2 font-semibold"><Calendar className="h-4 w-4" /> {formatDate(renewalDate)}</p>
              </div>
            </div>
            <div className="sl-card-dim border-l-4 !border-l-[var(--sl-gold)] p-4 text-sm">
              <Sparkles className="mr-2 inline h-4 w-4 text-[var(--sl-gold)]" />
              Exports illimités • Fichiers .txt et .csv • Historique complet
            </div>
            <button onClick={openPortal} className="sl-btn sl-btn-line w-full !py-4">
              Gérer mon abonnement (via Stripe) <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </Frame>
        <Footer />
      </div>
    );
  }

  // --- Gratuit / non connecté : les offres ---
  return (
    <div className="sl-page">
      <Header />
      <Frame kicker="Abonnement" title="Passe en Premium" hero={<p className="mt-4 max-w-xl text-sm text-[var(--sl-paper)]/70">Exports illimités, fichiers à télécharger et historique complet de tes playlists.</p>}>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="sl-card flex flex-col p-6 md:p-8">
            <h3 className="sl-display text-3xl">Gratuit</h3>
            <p className="mt-2 flex items-baseline gap-1"><span className="sl-display text-5xl">0 €</span><span className="sl-label">à vie</span></p>
            <p className="mt-3 text-sm text-[var(--sl-muted)]">Pour les festivaliers occasionnels</p>
            <ul className="my-6 flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sl-muted)]" /><span>{f}</span></li>
              ))}
            </ul>
            <button disabled className="sl-btn sl-btn-line w-full !py-4">{user ? 'Plan actuel' : 'Sans compte ni engagement'}</button>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-lg border-2 border-[var(--sl-gold)] bg-[var(--sl-ink)] p-6 text-[var(--sl-paper)] md:p-8">
            <Groove className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 text-[var(--sl-paper)] opacity-10" />
            <span className="sl-mono absolute right-4 top-4 rounded-full bg-[var(--sl-gold)] px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--sl-ink)]">Recommandé</span>
            <h3 className="sl-display relative text-3xl">Premium <Crown className="inline h-6 w-6 text-[var(--sl-gold-bright)]" /></h3>
            <p className="relative mt-2 flex items-baseline gap-1"><span className="sl-display text-5xl text-[var(--sl-gold-bright)]">5 €</span><span className="sl-label !text-[var(--sl-paper)]/60">par an</span></p>
            <p className="relative mt-3 text-sm text-[var(--sl-paper)]/70">L’expérience complète</p>
            <ul className="relative my-6 flex-1 space-y-3">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sl-gold-bright)]" /><span>{f}</span></li>
              ))}
            </ul>
            <button onClick={handleSubscribe} disabled={loading} className="sl-btn sl-btn-gold relative w-full !py-4">
              {loading ? <><Spinner /> Redirection…</> : 'Devenir Premium'}
            </button>
            <p className="relative mt-3 text-center text-[11px] text-[var(--sl-paper)]/50">
              Abonnement annuel à renouvellement automatique · paiement sécurisé par Stripe · résiliable à tout moment depuis « Gérer mon abonnement ».
            </p>
          </div>
        </div>
      </Frame>
      <Footer />
    </div>
  );
}
