import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    console.log(`🚜 Bulldozer scraping for: ${username}`);
    
    const response = await fetch(`https://www.setlist.fm/user/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return res.status(404).json({ error: 'User not found' });

    const fullHtml = await response.text();
    
    // --- 1. DÉCOUPAGE BRUT DU HTML ---
    // On cherche où commence "Upcoming"
    let startIndex = fullHtml.indexOf('>Upcoming Shows<');
    if (startIndex === -1) startIndex = fullHtml.indexOf('>Upcoming Events<');
    if (startIndex === -1) startIndex = fullHtml.indexOf('Upcoming'); // Dernier recours

    if (startIndex === -1) {
        console.log("❌ Section 'Upcoming' introuvable dans le HTML brut.");
        return res.status(200).json({ results: [], source: 'scraper-failed' });
    }

    // On cherche où ça s'arrête (généralement la section suivante est "Attended" ou "Recent")
    let endIndex = fullHtml.indexOf('Attended', startIndex);
    if (endIndex === -1) endIndex = fullHtml.indexOf('Recent', startIndex);
    if (endIndex === -1) endIndex = startIndex + 10000; // Si on trouve pas la fin, on prend un gros morceau

    // On garde uniquement la partie du code qui nous intéresse
    const relevantHtml = fullHtml.substring(startIndex, endIndex);
    const $ = cheerio.load(relevantHtml);

    const upcomingConcerts = [];
    const IGNORED = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Date', 'Venue', 'View', 'Edit', 'Setlist'];

    // --- 2. EXTRACTION DES LIENS ---
    // On prend TOUS les liens dans cette zone
    $('a').each((i, link) => {
        const text = $(link).text().trim();
        const href = $(link).attr('href') || "";

        // Un lien de concert contient généralement '/setlist/' ou '/artist/'
        // Et on vérifie que le texte n'est pas un mot banni (comme "Edit" ou "Jun")
        if ((href.includes('/setlist/') || href.includes('/artist/')) && text.length > 2) {
            
            // Vérif anti-mois
            const isMonth = IGNORED.some(ign => text.startsWith(ign));
            
            // Vérif anti-doublon
            const isDuplicate = upcomingConcerts.some(c => c.artist.name === text);

            if (!isMonth && !isDuplicate) {
                console.log(`🎸 Trouvé: ${text}`);
                
                upcomingConcerts.push({
                    id: `scraped-${upcomingConcerts.length}`,
                    artist: { name: text },
                    eventDate: 'Date à confirmer', // On sacrifie la date pour sauver l'artiste
                    venue: { name: '—' }
                });
            }
        }
    });

    console.log(`✅ Total trouvé: ${upcomingConcerts.length}`);

    return res.status(200).json({ 
      results: upcomingConcerts,
      scraped: true
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: 'Server Error', results: [] });
  }
}
