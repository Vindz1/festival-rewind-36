import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // On reprend l'URL /attended/ qui fonctionnait pour vous
    const response = await fetch(`https://www.setlist.fm/attended/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'User not found' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const upcomingArtists = [];
    
    // --- LOGIQUE D'ORIGINE ---
    let foundUpcoming = false;
    let foundAttended = false;
    
    // Liste des mots à bannir (C'est la seule chose que j'ajoute à votre code d'origine)
    const IGNORED_TERMS = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
        'Date', 'Venue', 'Festival', 'Tour', 'Concert'
    ];

    $('*').each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      
      // 1. Détection du début de section
      if (text === 'Upcoming Shows' || text.includes('Upcoming Shows (')) {
        foundUpcoming = true;
        return;
      }
      
      // 2. Détection de la fin de section
      if (foundUpcoming && (text === 'Attended Shows' || text.includes('Attended Shows ('))) {
        foundAttended = true;
        return false; // Stop la boucle
      }
      
      // 3. Extraction (Basé sur les balises STRONG comme dans votre fichier d'origine)
      if (foundUpcoming && !foundAttended && $elem.is('strong')) {
        const artistName = text;
        
        // Filtres d'origine + Filtre anti-Mois
        if (artistName && 
            !artistName.match(/^\d/) && // Pas de chiffres au début
            !artistName.includes('Hellfest') && 
            !artistName.includes('2024') && 
            !artistName.includes('2025') && 
            !artistName.includes('2026') && 
            artistName.length > 2 &&
            !upcomingArtists.includes(artistName)) {
            
            // LE FIX : On vérifie si c'est un mois
            const isMonth = IGNORED_TERMS.some(term => artistName.startsWith(term));
            
            if (!isMonth) {
                console.log(`🎸 Artiste trouvé : ${artistName}`);
                upcomingArtists.push(artistName);
            }
        }
      }
    });
    
    // Conversion au format attendu par le front
    const results = upcomingArtists.map((name, idx) => ({
      id: `upcoming-${idx}`,
      artist: { name },
      eventDate: 'Date à confirmer', // Votre code d'origine ne récupérait pas la date, on laisse un placeholder
      venue: { name: '—' }
    }));

    return res.status(200).json({ 
      results,
      scraped: true
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch upcoming shows',
      results: []
    });
  }
}
