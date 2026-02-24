import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="py-8 text-center text-xs text-[#606060]">
      <div className="flex justify-center gap-6 mb-3">
        <Link to="/legal" className="hover:text-[#a0a0a0] transition-colors">Mentions Légales & CGV</Link>
        <a href="mailto:setlive@proton.me" className="hover:text-[#a0a0a0] transition-colors">Contact / Support</a>
      </div>
      <p className="mb-1">
        © {new Date().getFullYear()} Setlive. Non affilié officiellement à TuneMyMusic.
      </p>
      <p>
        Data provided by <a href="https://www.setlist.fm" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#a0a0a0] transition-colors">setlist.fm</a>
      </p>
    </footer>
  );
};
