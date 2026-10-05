// src/pages/Profile.tsx — Mon compte (thème Vinyl)
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, History as HistoryIcon, LogOut, User } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Frame, Spinner } from '@/components/vinyl/Ui';
import { useAuth } from '@/AuthContext';
import { checkExportQuota } from '@/lib/subscription';
import { supabase } from '@/supabaseClient';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkExportQuota(user.id)
      .then((q) => { setIsPremium(q.isPremium); setRemaining(q.remaining); })
      .catch(() => undefined);
    supabase
      .from('playlists_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }: any) => setHistoryCount(count || 0));
  }, [user]);

  // Si la session n'arrive pas, on propose de se connecter plutôt que d'attendre indéfiniment
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Déconnexion « brutale » : on recharge la page pour repartir d'un état propre
  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="sl-page">
        <Header />
        <div className="mx-auto mt-24 max-w-md px-4 text-center">
          {waited ? (
            <>
              <p className="sl-display text-3xl">Non connecté</p>
              <p className="mt-2 text-sm text-[var(--sl-muted)]">Connecte-toi pour accéder à ton compte.</p>
              <Link to="/auth" className="sl-btn sl-btn-ink mt-6">Se connecter</Link>
            </>
          ) : (
            <Spinner className="h-6 w-6" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sl-page">
      <Header />
      <Frame kicker="Mon compte" title="Profil">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <div className="sl-card flex items-center gap-5 p-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--sl-ink)] text-[var(--sl-paper)]">
                <User className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="sl-label">Compte</p>
                <p className="truncate text-lg font-semibold">{user.email}</p>
                <span
                  className="sl-mono mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={isPremium
                    ? { borderColor: 'var(--sl-gold)', color: 'var(--sl-gold)', background: 'rgba(201,151,28,0.1)' }
                    : { borderColor: 'var(--sl-groove)', color: 'var(--sl-muted)' }}
                >
                  {isPremium && <Crown className="h-3 w-3" />} {isPremium ? 'Membre Premium' : 'Membre gratuit'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border-l-4 border-[var(--sl-gold)] bg-[var(--sl-ink)] p-4 text-[var(--sl-paper)]">
                <p className="sl-mono text-[10px] uppercase tracking-[0.2em] text-[var(--sl-gold-bright)]">Playlists générées</p>
                <p className="sl-display mt-1 text-4xl">{historyCount}</p>
              </div>
              <div className="sl-card border-l-4 !border-l-[var(--sl-groove)] p-4">
                <p className="sl-label">{isPremium ? 'Exports' : 'Exports restants'}</p>
                <p className="sl-display mt-1 text-4xl">{isPremium ? '∞' : remaining ?? '–'}</p>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-3 self-start">
            <Link to="/history" className="sl-btn sl-btn-ink w-full !py-4"><HistoryIcon className="h-4 w-4" /> Back in Time</Link>
            {!isPremium && (
              <Link to="/subscription" className="sl-btn sl-btn-gold w-full !py-4"><Crown className="h-4 w-4" /> Devenir Premium</Link>
            )}
            {isPremium && (
              <Link to="/subscription" className="sl-btn sl-btn-line w-full !py-4"><Crown className="h-4 w-4" /> Mon abonnement</Link>
            )}
            <button onClick={handleSignOut} className="sl-btn sl-btn-wine w-full !py-4"><LogOut className="h-4 w-4" /> Se déconnecter</button>
          </div>
        </div>
      </Frame>
      <Footer />
    </div>
  );
}
