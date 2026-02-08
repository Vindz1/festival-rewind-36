import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Music, ArrowRight } from 'lucide-react';
import { useAuth } from '@/AuthContext';

export default function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth(); // Idéalement pour recharger le statut localement
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
        setStatus('error');
        return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        if (res.ok) {
          setStatus('success');
          // Petit délai pour être sûr que la DB est à jour avant de rediriger
          setTimeout(() => {
             // Si vous aviez une fonction pour rafraichir le profil, c'est ici qu'on l'appelle
             // Sinon, le rechargement de page fera l'affaire
          }, 1000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    verify();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white pt-24">
      <Header />
      <div className="max-w-md mx-auto px-4 text-center mt-12">
        
        {status === 'loading' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-[#4d94ff]/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative bg-[#2d2d2d] w-full h-full rounded-full flex items-center justify-center border border-[#4d94ff]/30">
                    <Loader2 className="w-10 h-10 text-[#4d94ff] animate-spin" />
                </div>
            </div>
            <h2 className="text-2xl font-bold">Finalisation de votre abonnement...</h2>
            <p className="text-[#a0a0a0]">Nous activons vos accès Premium.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse"></div>
                <div className="relative bg-[#2d2d2d] w-full h-full rounded-full flex items-center justify-center border-2 border-green-500 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
            </div>
            
            <div className="space-y-2">
                <h1 className="text-4xl font-black italic uppercase">Bienvenue <span className="text-[#4d94ff]">PRO</span> !</h1>
                <p className="text-gray-400">Votre compte a été mis à niveau avec succès.</p>
            </div>

            <div className="bg-[#252525] p-6 rounded-2xl border border-[#333] text-left space-y-3">
                <p className="text-sm font-bold uppercase text-[#a0a0a0] tracking-widest">Vos avantages actifs :</p>
                <ul className="space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#4d94ff]"/> Exports illimités</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#4d94ff]"/> Time Capsule & Historique</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#4d94ff]"/> Support Prioritaire</li>
                </ul>
            </div>

            <Button 
                onClick={() => navigate('/my-concerts')}
                className="w-full h-14 text-lg font-bold bg-[#4d94ff] hover:bg-[#6ba6ff] text-white shadow-xl rounded-xl"
            >
                Commencer à créer <ArrowRight className="ml-2 w-5 h-5"/>
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50">
                <Music className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-red-500">Une erreur est survenue</h2>
            <p className="text-[#a0a0a0]">Le paiement a peut-être réussi mais l'activation a échoué. Contactez le support.</p>
            <Button onClick={() => navigate('/subscription')} variant="outline">Retour</Button>
          </div>
        )}

      </div>
    </div>
  );
}
