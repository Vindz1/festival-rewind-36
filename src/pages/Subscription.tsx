import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Star, ShieldCheck } from 'lucide-react';

export default function Subscription() {
  const plans = [
    {
      name: "Standard",
      price: "0€",
      period: "à vie",
      desc: "Pour les festivaliers occasionnels",
      features: ["2 exports Spotify par an", "Accès aux Lineups Festivals", "Prévisualisation des titres"],
      button: "Plan Actuel",
      premium: false
    },
    {
      name: "Premium PRO",
      price: "14.99€",
      period: "par an",
      desc: "L'expérience ultime pour les passionnés",
      features: [
        "Exports Spotify ILLIMITÉS", 
        "Historique complet des setlists", 
        "Pas de publicités", 
        "Support prioritaire",
        "Stats de fin d'année (Time Capsule)"
      ],
      button: "Devenir PRO",
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase mb-4">
            Passez à la vitesse <span className="text-[#4d94ff]">Supérieure</span>
          </h1>
          <p className="text-[#a0a0a0] text-lg">Libérez tout le potentiel de vos souvenirs de concerts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`relative p-8 rounded-3xl border ${
                plan.premium ? 'border-[#4d94ff] bg-[#2d2d2d] shadow-[0_0_30px_-10px_rgba(77,148,255,0.3)]' : 'border-[#333] bg-[#252525]'
              }`}
            >
              {plan.premium && (
                <div className="absolute top-4 right-6 bg-[#4d94ff] text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                  Recommandé
                </div>
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
                className={`w-full h-12 font-bold uppercase tracking-widest transition-all ${
                  plan.premium 
                  ? 'bg-[#4d94ff] hover:bg-[#6ba6ff] text-white' 
                  : 'bg-[#333] text-[#a0a0a0] hover:bg-[#444]'
                }`}
              >
                {plan.button}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
