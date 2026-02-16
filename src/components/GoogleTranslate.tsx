import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

export function GoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Fonction d'initialisation (DOIT être déclarée en premier)
    const initTranslate = () => {
      try {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'fr',
            includedLanguages: 'en,es,de,it,pt,nl,sv,no',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          },
          'google_translate_element'
        );
        setIsLoaded(true);
      } catch (error) {
        console.error('Erreur initialisation Google Translate:', error);
      }
    };

    // Vérifie si le script est déjà chargé
    if ((window as any).google?.translate) {
      initTranslate();
      return;
    }

    // Définit la fonction globale
    (window as any).googleTranslateElementInit = initTranslate;

    // Ajoute le script
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => {
      console.error('Erreur chargement script Google Translate');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src*="translate.google.com"]');
      if (existingScript) {
        existingScript.remove();
      }
      delete (window as any).googleTranslateElementInit;
    };
  }, []);

  return (
    <div className="relative">
      {/* Bouton avec icône Globe */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#252525] hover:bg-[#2d2d2d] transition-colors border border-[#333] hover:border-[#4d94ff]"
        title="Changer de langue"
      >
        <Globe className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown avec le sélecteur Google */}
      {isOpen && (
        <>
          {/* Overlay pour fermer en cliquant ailleurs */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu déroulant */}
          <div className="absolute right-0 top-full mt-2 bg-[#252525] border border-[#333] rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
            <p className="text-xs text-gray-400 uppercase font-bold mb-2">Langue</p>
            {!isLoaded && (
              <p className="text-xs text-gray-500">Chargement...</p>
            )}
            <div id="google_translate_element"></div>
          </div>
        </>
      )}
    </div>
  );
}
