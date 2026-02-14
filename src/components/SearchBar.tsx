import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const SearchBar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {/* Bouton Loupe */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Rechercher"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Barre de recherche expandable */}
      {isOpen && (
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un artiste..."
              autoFocus
              className="h-9 pl-9 pr-3 w-48 sm:w-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-lg focus:bg-white/15 focus:border-[#4d94ff] transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </form>
      )}
    </>
  );
};
