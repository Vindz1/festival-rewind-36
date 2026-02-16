export function preventMusicTranslation() {
  // Liste de mots-clés à ne JAMAIS traduire
  const musicKeywords = [
    'Metallica', 'Slayer', 'Iron Maiden', 'Megadeth',
    // Ajoute tes groupes principaux ici
  ];

  // Détecte quand Google Translate est actif
  const observer = new MutationObserver(() => {
    document.querySelectorAll('*').forEach((el) => {
      const text = el.textContent || '';
      
      // Si l'élément contient un nom de groupe connu
      musicKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          el.classList.add('notranslate');
        }
      });
    });
  });

  // Observe tous les changements dans le DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}
