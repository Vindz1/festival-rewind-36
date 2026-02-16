import { useEffect } from 'react';

export function GoogleTranslate() {
  useEffect(() => {
    // Évite de charger plusieurs fois
    if (document.getElementById('google_translate_script')) {
      return;
    }

    // Fonction callback pour Google
    (window as any).googleTranslateElementInit = function() {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'fr',
          includedLanguages: 'en,es,de,it,pt,nl,sv,no',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE
        },
        'google_translate_element'
      );
    };

    // Charge le script
    const script = document.createElement('script');
    script.id = 'google_translate_script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(script);
  }, []);

  return <div id="google_translate_element" className="inline-block"></div>;
}
