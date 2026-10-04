// src/pages/Auth.tsx — connexion / inscription (thème Vinyl)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Groove, Spinner } from '@/components/vinyl/Ui';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Si la confirmation par e-mail est activée dans Supabase, aucune session n'est ouverte tout de suite
        if (data?.session) navigate('/');
        else toast.success('Compte créé : vérifie ta boîte mail pour confirmer ton adresse.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Connexion impossible, réessaie dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sl-page">
      <Header />
      <main className="mx-auto max-w-md p-4 md:py-16">
        <div className="overflow-hidden rounded-lg bg-[var(--sl-paper)] shadow-2xl">
          <div className="relative overflow-hidden bg-[var(--sl-ink)] px-8 py-10 text-[var(--sl-paper)]">
            <Groove className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 text-[var(--sl-paper)] opacity-10" />
            <div className="relative z-10">
              <span className="sl-mono text-[10px] uppercase tracking-[0.3em] text-[var(--sl-gold-bright)]">Mon compte</span>
              <h1 className="sl-display mt-2 text-5xl leading-[0.95]">{isLogin ? 'Connexion' : 'Inscription'}</h1>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 p-6 md:p-8">
            <div>
              <label className="sl-label mb-1 block" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="sl-input" placeholder="toi@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div>
              <label className="sl-label mb-1 block" htmlFor="password">Mot de passe</label>
              <input id="password" type="password" className="sl-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={6} required />
            </div>
            <button type="submit" className="sl-btn sl-btn-ink w-full !py-4" disabled={loading}>
              {loading ? <Spinner /> : null} {isLogin ? 'Se connecter' : 'Créer mon compte'}
            </button>
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="sl-mono block w-full text-center text-[11px] uppercase tracking-widest text-[var(--sl-muted)] underline hover:text-[var(--sl-ink)]">
              {isLogin ? 'Pas encore de compte ? Inscris-toi' : 'Déjà un compte ? Connecte-toi'}
            </button>
            <p className="pt-2 text-center text-[11px] text-[var(--sl-muted)]">
              En continuant, tu acceptes les <Link to="/legal" className="underline">mentions légales</Link>.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
