import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    // 1. On se fait passer pour un vrai navigateur Chrome pour ne pas être bloqué
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    console.log("🔄 Tentative de connexion au site Hellfest...");
    const response = await fetch('https://hellfest.fr/lineup', { headers });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP du site Hellfest: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log(`📄 HTML récupéré (${html.length} caractères). Analyse en cours...`);

    const lineup = [];
    const stages = new Set();
    const days = new Set();

    // 2. STRATÉGIE DE RECHERCHE MULTIPLE
    // Les sites changent souvent de classes, on essaie plusieurs cas courants
    
    // Cas A : Structure classique (souvent utilisée sur les sites Wordpress/React)
    // On cherche tous les éléments qui pourraient être des conteneurs d'artistes
    $('h3, h4, .artist-name, .lineup-artist').each((i, elem) => {
      const name = $(elem).text().trim();
      
      // Nettoyage : Si le nom est trop long (c'est du texte) ou vide, on ignore
      if (!name || name.length > 50 || name.includes("Lineup")) return;

      // Essayer de deviner la Scène et le Jour en remontant dans les parents
      // On cherche un parent qui a une classe contenant 'stage' ou 'day'
      let stage = $(elem).closest('[class*="stage"], section').find('h2, .stage-title').first().text().trim();
      let day = $(elem).closest('[class*="day"], [data-day]').attr('data-day') || 
                $(elem).closest('[class*="day"]').find('h2, .day-title').first().text().trim();

      // Valeurs par défaut si non trouvées (pour ne pas casser l'app)
      if (!stage) stage = "Scène Inconnue"; 
      if (!day) day = "Jours Inconnus";

      // On nettoie les données
      stage = stage.replace('Stage', '').trim();
      
      // On évite les doublons
      const exists = lineup.some(a => a.name === name);
      if (!exists) {
        lineup.push({
          id: `hf-${i}`,
          name,
          stage,
          day
        });
        stages.add(stage);
        days.add(day);
      }
    });

    console.log(`✅ Analyse terminée : ${lineup.length} artistes trouvés.`);

    // 3. Fallback de sécurité : Si le scraping échoue totalement (ex: site 100% JS)
    // On renvoie une erreur explicite au lieu d'un tableau vide
    if (lineup.length === 0) {
        console.warn("⚠️ Attention : 0 artiste trouvé. Le site utilise peut-être un rendu 100% JS client.");
        return res.status(200).json({
            warning: "Le site est protégé ou inaccessible via scraping simple.",
            artists: [], // Renvoie vide pour ne pas crasher le front
            stages: [],
            days: []
        });
    }

    return res.status(200).json({
      artists: lineup,
      stages: Array.from(stages),
      days: Array.from(days)
    });

  } catch (error) {
    console.error('❌ Hellfest scraping error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du lineup dynamique' });
  }
}
