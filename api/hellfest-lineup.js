import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    // 1. Récupérer le HTML du site officiel
    const response = await fetch('https://hellfest.fr/lineup');
    const html = await response.text();
    const $ = cheerio.load(html);

    const lineup = [];
    const stages = new Set();
    const days = new Set();

    // 2. Analyser le HTML (Ceci est une structure générique basée sur les sites de festivals)
    // NOTE: Il faudra peut-être inspecter le site Hellfest réel pour ajuster les sélecteurs '.artist', '.stage', etc.
    
    // Exemple de logique de scraping (à adapter selon le vrai code source du site)
    // On cherche souvent des conteneurs par jour ou par scène
    $('.lineup-card, .artist-item').each((i, elem) => {
      const name = $(elem).find('.artist-name, h3').text().trim();
      const stage = $(elem).find('.stage-name').text().trim() || 'Unknown Stage';
      const day = $(elem).closest('.day-container').attr('data-day') || 'Unknown Day';
      
      // On essaye de récupérer l'image si dispo sur le site du festival
      const image = $(elem).find('img').attr('src');

      if (name) {
        lineup.push({
          id: `hf-${i}`, // ID temporaire unique
          name,
          stage,
          day,
          image // Optionnel, sinon Spotify le trouvera plus tard
        });
        stages.add(stage);
        days.add(day);
      }
    });

    // Si le scraping échoue (structure différente), on renvoie une erreur explicite
    if (lineup.length === 0) {
      console.log("Scraping warning: Aucun artiste trouvé. Vérifiez les sélecteurs CSS.");
    }

    return res.status(200).json({
      artists: lineup,
      stages: Array.from(stages),
      days: Array.from(days)
    });

  } catch (error) {
    console.error('Hellfest scraping error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du lineup' });
  }
}
