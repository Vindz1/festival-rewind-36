import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="py-8 text-center text-xs text-[#606060]">
      <div className="flex justify-center gap-6 mb-2">
        <Link to="/legal" className="hover:text-[#a0a0a0] transition-colors">Mentions Légales & CGV</Link>
        <a href="mailto:contact@setlive.fr" className="hover:text-[#a0a0a0] transition-colors">Contact / Support</a>
      </div>
      <p>© {new Date().getFullYear()} Setlive. Non affilié à Spotify ou Setlist.fm.</p>
    </footer>
  );
};
