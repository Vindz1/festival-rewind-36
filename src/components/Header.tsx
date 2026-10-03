// src/components/Header.tsx — barre de navigation Vinyl
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Crown, Menu, User, X } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { getUserSubscription } from '@/lib/subscription';
import { GoogleTranslate } from '@/components/GoogleTranslate';

const NAV = [
  { to: '/', label: 'Créer', end: true },
  { to: '/history', label: 'Mes playlists', end: false },
  { to: '/collection', label: 'Collection', end: false },
];

export function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!user) { setIsPremium(false); return; }
    getUserSubscription(user.id).then((s: any) => setIsPremium(s?.subscription_type === 'premium')).catch(() => setIsPremium(false));
  }, [user]);

  const link = ({ isActive }: { isActive: boolean }) =>
    `sl-mono border-b-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
      isActive ? 'border-[var(--sl-gold-bright)] text-[var(--sl-gold-bright)]' : 'border-transparent text-[var(--sl-paper)]/70 hover:text-[var(--sl-paper)]'
    }`;

  return (
    <div className="sl-scope sticky top-0 z-50 border-b border-[var(--sl-gold)]/30 bg-[var(--sl-ink)] text-[var(--sl-paper)]">
      <div className="mx-auto flex h-16 max-w-[92rem] items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--sl-gold)]/60 bg-[var(--sl-ink-soft)]">
            <img src="/favicon.svg" alt="Setlive" className="h-6 w-6" />
          </span>
          <span className="sl-display text-2xl leading-none">
            Setlive<span className="text-[var(--sl-gold-bright)]">.fr</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={link}>{n.label}</NavLink>)}
          {user && !isPremium && (
            <NavLink to="/subscription" className={link}><Crown className="mr-1.5 inline h-3.5 w-3.5 text-[var(--sl-gold-bright)]" />Premium</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <GoogleTranslate />
          <Link
            to={user ? '/profile' : '/auth'}
            className="sl-btn sl-btn-sm border-[var(--sl-paper)]/30 text-[var(--sl-paper)] hover:bg-[var(--sl-paper)]/10"
          >
            {isPremium ? <Crown className="h-3.5 w-3.5 text-[var(--sl-gold-bright)]" /> : <User className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{user ? 'Mon compte' : 'Connexion'}</span>
          </Link>
          <button className="text-[var(--sl-paper)] md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-[var(--sl-paper)]/10 px-4 pb-4 pt-2 md:hidden">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={(s) => `${link(s)} border-b-0 py-3`}>
              {n.label}
            </NavLink>
          ))}
          {user && !isPremium && (
            <NavLink to="/subscription" onClick={() => setOpen(false)} className={(s) => `${link(s)} border-b-0 py-3`}>Premium</NavLink>
          )}
        </nav>
      )}
    </div>
  );
}
