import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // On utilise l'URL de votre capture d'écran
    const response = await fetch(`https://www.setlist.fm/attended/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return res.status(404).json({ error: 'User not found' });

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const upcomingConcerts = [];
    const IGNORED_TERMS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Date', 'Venue', 'Festival'];

    // Recherche basée sur la structure visuelle (Tableau ou Liste)
    // On cherche tous les liens d'artistes dans la section "Upcoming"
    
    // 1. Trouver le conteneur "Upcoming"
    let upcomingContainer = null;
    $('h2, h3').each((i, el) => {
        if ($(el).text().includes('Upcoming')) {
            upcomingContainer = $(el).parent();
        }
    });

    if (upcomingContainer) {
        // 2. Parcourir les lignes (souvent div.row ou tr)
        upcomingContainer.find('.row, tr').each((i, row) => {
            const $row = $(row);
            
            // --- DATE (Basé sur les cases carrées visibles sur votre capture) ---
            let dateStr = 'À venir';
            const month = $row.find('.month').text().trim();
            const day = $row.find('.day').text().trim();
            const year = $row.find('.year').text().trim();

            if (month && day && year) {
                dateStr = `${day} ${month} ${year}`; // ex: 11 Jun 2026
            }

            // --- ARTISTE ---
            let artistName = "";
            const $links = $row.find('a');

            $links.each((j, link) => {
                const text = $(link).text().trim();
                const href = $(link).attr('href') || "";
                
                // Si c'est un lien vers un setlist ou un artiste, et que ce n'est pas un mois
                if ((href.includes('artist') || href.includes('setlist')) && 
                    !IGNORED_TERMS.includes(text) && 
                    text.length > 2) {
                    artistName = text;
                }
            });

            // --- LIEU ---
            // Le lieu est souvent le lien suivant l'artiste ou le texte juste après
            let venueName = "—";
            $links.each((j, link) => {
                const href = $(link).attr('href') || "";
                if (href.includes('venue')) {
                    venueName = $(link).text().trim();
                }
            });

            // SAUVEGARDE VALIDÉE
            if (artistName) {
                // Vérification finale anti-doublon et anti-"Jun"
                const isDuplicate = upcomingConcerts.some(c => c.artist.name === artistName && c.eventDate === dateStr);
                
                if (!isDuplicate && !IGNORED_TERMS.includes(artistName)) {
                    upcomingConcerts.push({
                        id: `scraped-${upcomingConcerts.length}`,
                        artist: { name: artistName },
                        eventDate: dateStr,
                        venue: { name: venueName }
                    });
                }
            }
        });
    }

    return res.status(200).json({ 
      results: upcomingConcerts,
      scraped: true
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    return res.status(500).json({ error: 'Server Error', results: [] });
  }
}
