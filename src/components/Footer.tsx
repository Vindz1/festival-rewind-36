// src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { resetConsent } from '@/lib/analytics';

export function Footer() {
  return (
    <footer className="sl-scope mt-8 bg-[var(--sl-ink)] text-[var(--sl-paper)]">
      <div className="mx-auto flex max-w-[92rem] flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between md:px-12">
        <div className="max-w-md">
          <p className="sl-display text-2xl">Setlive<span className="text-[var(--sl-gold-bright)]">.fr</span></p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--sl-paper)]/60">
            Setlive est un outil indépendant. Les setlists proviennent de la communauté{' '}
            <a href="https://www.setlist.fm" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--sl-gold-bright)]">setlist.fm</a>,
            les titres de repli d'iTunes. Les noms d'artistes et de festivals appartiennent à leurs détenteurs.
          </p>
        </div>
        <nav className="sl-mono grid grid-cols-2 gap-x-10 gap-y-2 text-[11px] uppercase tracking-[0.15em] text-[var(--sl-paper)]/70">
          <Link to="/" className="hover:text-[var(--sl-gold-bright)]">Studio</Link>
          <Link to="/history" className="hover:text-[var(--sl-gold-bright)]">Back in Time</Link>
          <Link to="/collection" className="hover:text-[var(--sl-gold-bright)]">Collection</Link>
          <Link to="/subscription" className="hover:text-[var(--sl-gold-bright)]">Premium</Link>
          <Link to="/partage" className="hover:text-[var(--sl-gold-bright)]">Partager</Link>
          <Link to="/legal" className="hover:text-[var(--sl-gold-bright)]">Mentions légales</Link>
          <a href="mailto:setlive@proton.me" className="hover:text-[var(--sl-gold-bright)]">Contact</a>
          <button type="button" onClick={resetConsent} className="text-left uppercase tracking-[0.15em] hover:text-[var(--sl-gold-bright)]">Gérer les cookies</button>
        </nav>
      </div>
    </footer>
  );
}
