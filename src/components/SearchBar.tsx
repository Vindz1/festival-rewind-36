import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const SearchBar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('artistName'); // Par défaut: Artiste

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // On envoie le type de recherche (artistName ou cityName) ET la requête
      navigate(`/search?type=${searchType}&q=${encodeURIComponent(query.trim())}`);
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
          className="relative flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200"
        >
          <div className="relative flex items-center bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden focus-within:border-[#4d94ff] transition-colors">
            
            {/* Sélecteur du type de recherche */}
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-gray-300 pl-3 pr-1 py-2 focus:outline-none border-r border-[#404040] cursor-pointer hover:text-white"
            >
              <option value="artistName">Artiste</option>
              <option value="cityName">Ville</option>
              <option value="tourName">Tournée</option>
            </select>

            {/* Input de recherche */}
            <div className="relative flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchType === 'cityName' ? "Ex: Paris, Lyon..." : 
                  searchType === 'tourName' ? "Ex: Lamomali Tour..." : 
                  "Nom de l'artiste..."
                }
                autoFocus
                className="h-10 border-0 bg-transparent text-white placeholder:text-gray-500 rounded-none w-40 sm:w-64 focus-visible:ring-0"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0 bg-[#2d2d2d] border border-[#404040]"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
          </button>
        </form>
      )}
    </>
  );
};
