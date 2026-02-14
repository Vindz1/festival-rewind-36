import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Crown, Calendar, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';
import { toast } from 'sonner';

export default function Subscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'premium' | null>(null);
  const [renewalDate, setRenewalDate] = useState<string>('');

  // Vérifier le statut au chargement
  useEffect(() => {
    if (user) {
      getUserSubscription(user.id).then(sub => {
        setCurrentPlan(sub.subscription_type);
        setRenewalDate(sub.end_date || '');
      });
    }
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Connectez-vous pour vous abonner !");
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
    } catch (error) {
      console.error(error);
      toast.error("Erreur paiement. Vérifiez votre connexion.");
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Non définie';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // --- CAS 1 : L'UTILISATEUR EST DÉJÀ PREMIUM ---
  if (currentPlan === 'premium') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center px-4">
            <div className="max-w-2xl w-full bg-gradient-to-br from-[#2d2d2d] to-[#1a1a1a] p-8 rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_-10px_rgba(234,179,8,0.2)] text-center space-y-8">
                
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/10 mb-4 animate-pulse">
                    <Crown className="w-12 h-12 text-yellow-500" />
                </div>

                <div>
                    <h1 className="text-4xl font-black italic uppercase mb-2">Vous êtes <span className="text-yellow-500">PREMIUM</span></h1>
                    <p className="text-[#a0a0a0]">Merci de soutenir le projet Setlive.fr !</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="p-4 bg-[#252525] rounded-xl border border-[#333]">
                        <p className="text-xs text-[#a0a0a0] uppercase font-bold tracking-widest mb-1">Statut</p>
                        <p className="text-green-400 font-bold flex items-center gap-2"><Check className="w-4 h-4"/> Actif</p>
                    </div>
                    <div className="p-4 bg-[#252525] rounded-xl border border-[#333]">
                        <p className="text-xs text-[#a0a0a0] uppercase font-bold tracking-widest mb-1">Renouvellement</p>
                        <p className="text-white font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4"/> 
                          {formatDate(renewalDate)}
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 text-yellow-200 text-sm">
                    <Sparkles className="w-4 h-4 inline mr-2"/>
                    Exports illimités • Aucune publicité • Historique complet
                </div>

                {/* Bouton vers le portail client Stripe */}
                <Button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/create-portal-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user?.id })
                      });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    } catch (err) {
                      toast.error("Erreur de connexion à Stripe");
                    }
                  }}
                  variant="outline" 
                  className="w-full border-[#404040] hover:bg-[#333] text-[#a0a0a0] flex items-center justify-center gap-2"
                >
                  Gérer mon abonnement (via Stripe)
                  <ExternalLink className="w-4 h-4" />
                </Button>
            </div>
        </div>
        <Footer />
      </div>
    );
  }

  // --- CAS 2 : L'UTILISATEUR EST FREE (Affichage des offres) ---
  const plans = [
    {
      name: "Gratuit",
      price: "0€",
      period: "à vie",
      desc: "Pour les festivaliers occasionnels",
      features: [
        "2 exports par an",
        "Accès aux festivals",
        "Prévisualisation des titres"
      ],
      button: "Plan Actuel",
      premium: false
    },
    {
      name: "Premium",
      price: "5€",
      period: "par an",
      desc: "L'expérience ultime",
      features: [
        "Exports ILLIMITÉS",
        "Zéro publicité",
        "Historique complet",
        "Badge supporter",
        "Support prioritaire"
      ],
      button: "Devenir Premium",
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24 flex flex-col">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto px-4 pb-20 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase mb-4">
            Passez à la vitesse <span className="text-[#4d94ff]">Supérieure</span>
          </h1>
          <p className="text-[#a0a0a0] text-lg">Libérez tout le potentiel de vos souvenirs de concerts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan, i) => (
            <div key={i} className={`relative p-8 rounded-3xl border ${plan.premium ? 'border-[#4d94ff] bg-[#2d2d2d] shadow-[0_0_30px_-10px_rgba(77,148,255,0.3)]' : 'border-[#333] bg-[#252525]'}`}>
              {plan.premium && (
                <div className="absolute top-4 right-6 bg-[#4d94ff] text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Recommandé</div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-[#a0a0a0] text-sm">/{plan.period}</span>
              </div>
              <p className="text-sm text-[#a0a0a0] mb-8">{plan.desc}</p>
              <ul className="space-y-4 mb-10">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <Check className={`w-5 h-5 shrink-0 ${plan.premium ? 'text-[#4d94ff]' : 'text-[#a0a0a0]'}`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={plan.premium ? handleSubscribe : undefined}
                disabled={loading && plan.premium}
                className={`w-full h-12 font-bold uppercase tracking-widest transition-all ${plan.premium ? 'bg-[#4d94ff] hover:bg-[#6ba6ff] text-white' : 'bg-[#333] text-[#a0a0a0] hover:bg-[#444] cursor-default'}`}
              >
                {loading && plan.premium ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Redirection...</> : plan.button}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
