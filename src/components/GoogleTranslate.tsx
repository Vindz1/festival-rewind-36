import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

export function GoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Ajoute le script Google Translate
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // Initialise le widget
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'fr',
          includedLanguages: 'en,es,de,it,pt,nl,sv,no',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        },
        'google_translate_element'
      );
    };

    return () => {
      const existingScript = document.querySelector('script[src*="translate.google.com"]');
      if (existingScript) {
        existingScript.remove();
      }
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
          <div className="absolute right-0 top-full mt-2 bg-[#252525] border border-[#333] rounded-lg shadow-lg z-50 p-3 min-w-[180px]">
            <p className="text-xs text-gray-400 uppercase font-bold mb-2">Langue</p>
            <div id="google_translate_element"></div>
          </div>
        </>
      )}
    </div>
  );
}
