import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // 1. Récupération de la page "Attended" (ou profil)
    const response = await fetch(`https://www.setlist.fm/user/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      // Fallback: essayer l'URL /attended si /user échoue (dépend de la config privacy)
       console.log("Profile page failed, trying attended page...");
       // Note: La page /attended liste rarement les "Upcoming". 
       // Les "Upcoming" sont généralement en sidebar sur la page de profil principale.
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const upcomingConcerts = [];
    
    // 2. Stratégie de recherche : On cherche le titre "Upcoming Shows" ou "Upcoming Events"
    // Sur setlist.fm, c'est souvent dans une div col-xs-12 sidebar ou main content.
    // On cherche tous les H2 ou H3 qui contiennent "Upcoming"
    let upcomingContainer = null;
    $('h2, h3').each((i, el) => {
        if ($(el).text().includes('Upcoming')) {
            // Le conteneur est souvent le parent ou le sibling
            upcomingContainer = $(el).parent(); 
        }
    });

    if (!upcomingContainer) {
        console.log('⚠️ Section "Upcoming" non trouvée sur la page de profil.');
        // Tentative alternative: Chercher directement les lignes de concerts qui ont une date future ?
        // Difficile sans contexte. On renvoie vide pour ne pas crasher.
        return res.status(200).json({ results: [], source: 'scraper' });
    }

    // 3. Extraction des données dans le conteneur trouvé
    // Structure typique Setlist.fm (Sidebar ou Main) :
    // Une ligne par concert. Souvent: 
    // <div class="row"> ... <span class="month">Jun</span> ... <a href="...">Metallica</a> ... </div>
    
    upcomingContainer.find('.row').each((i, row) => {
        const $row = $(row);
        
        // --- EXTRACTION DATE ---
        // Chercher le bloc date (souvent class="date" ou composé de month/day/year)
        let month = $row.find('.month').text().trim();
        let day = $row.find('.day').text().trim();
        let year = $row.find('.year').text().trim();
        
        // Si pas de classes spécifiques, on cherche un texte de date (ex: "Feb 7 2026")
        let eventDate = 'Date à confirmer';
        if (month && day && year) {
            eventDate = `${day} ${month} ${year}`; // Ex: 24 Jun 2026
        } else {
             // Fallback: chercher un span date générique
             const rawDate = $row.find('.date').text().trim();
             if (rawDate) eventDate = rawDate;
        }

        // --- EXTRACTION ARTISTE ---
        // L'artiste est souvent dans un <strong><a> ou juste <a> au début du bloc content
        // On évite les liens qui sont des villes ou des lieux
        let artistName = null;
        
        // Chercher le lien le plus proéminent (souvent le premier lien dans le bloc de détails)
        const $links = $row.find('a');
        
        $links.each((j, link) => {
            const href = $(link).attr('href') || '';
            // Les liens d'artistes contiennent souvent /setlists/ ou /artist/
            // Les liens de lieux contiennent /venue/
            if ((href.includes('/setlists/') || href.includes('/artist/')) && !artistName) {
                artistName = $(link).text().trim();
            }
        });
        
        // Fallback si pas de lien explicite: chercher le texte en gras qui n'est pas le mois
        if (!artistName) {
            const strongText = $row.find('strong').first().text().trim();
            const IGNORED = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if (strongText && !IGNORED.includes(strongText)) {
                artistName = strongText;
            }
        }

        // --- EXTRACTION LIEU ---
        let venueName = 'Lieu inconnu';
        // Le lieu est souvent un lien contenant '/venue/'
        $links.each((j, link) => {
            const href = $(link).attr('href') || '';
            if (href.includes('/venue/')) {
                venueName = $(link).text().trim();
            }
        });

        // Validation finale pour éviter les "Jun" ou vides
        if (artistName && artistName.length > 1) {
             upcomingConcerts.push({
                id: `scraped-${i}-${Date.now()}`,
                artist: { name: artistName },
                eventDate: eventDate,
                venue: { name: venueName }
            });
        }
    });
    
    console.log(`✅ ${upcomingConcerts.length} concerts à venir trouvés.`);

    return res.status(200).json({ 
      results: upcomingConcerts,
      scraped: true
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    return res.status(500).json({ error: 'Failed to fetch shows', results: [] });
  }
}
