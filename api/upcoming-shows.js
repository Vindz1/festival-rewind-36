import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    console.log(`🔍 Scraping started for user: ${username}`);
    
    // On cible la page principale du profil
    const response = await fetch(`https://www.setlist.fm/user/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log("❌ Profile page fetch failed:", response.status);
      return res.status(404).json({ error: 'User not found' });
    }

    const html = await response.text();
    console.log(`📄 HTML retrieved (${html.length} chars)`);
    
    const $ = cheerio.load(html);
    const upcomingConcerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Dictionnaire pour convertir les mois texte en numéros
    const MONTH_MAP = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    // On parcourt chaque ligne qui ressemble à un concert
    $('.row').each((i, row) => {
        const $row = $(row);
        
        // 1. Extraction de la Date
        const monthStr = $row.find('.month').text().trim(); // Ex: "Jun"
        const dayStr = $row.find('.day').text().trim();     // Ex: "24"
        let yearStr = $row.find('.year').text().trim();     // Ex: "2026" ou vide

        // Si pas de mois ou jour, ce n'est pas un concert, on passe
        if (!monthStr || !dayStr) return;

        // LOGIQUE ANNÉE MANQUANTE
        let year = parseInt(yearStr);
        if (!year || isNaN(year)) {
            const currentYear = new Date().getFullYear();
            const monthIndex = MONTH_MAP[monthStr];
            const currentMonth = new Date().getMonth();

            // Si le mois du concert (ex: Jan) est avant le mois actuel (ex: Juin),
            // c'est probablement l'année prochaine. Sinon c'est cette année.
            if (monthIndex !== undefined && monthIndex < currentMonth) {
                year = currentYear + 1;
            } else {
                year = currentYear;
            }
        }

        // Création de l'objet Date
        const monthIndex = MONTH_MAP[monthStr];
        if (monthIndex === undefined) return; // Mois inconnu

        const concertDate = new Date(year, monthIndex, parseInt(dayStr));

        // Si c'est passé, on ignore
        if (concertDate < today) {
            // console.log(`Skipping past concert: ${dayStr} ${monthStr} ${year}`);
            return;
        }

        // 2. Extraction Artiste et Lieu
        let artistName = null;
        let venueName = null;

        const $links = $row.find('a');
        
        $links.each((j, link) => {
            const href = $(link).attr('href') || '';
            const text = $(link).text().trim();

            // L'artiste a un lien vers /setlist/ ou /artist/ (et n'est pas "View")
            if (!artistName && (href.includes('/setlists/') || href.includes('/artist/')) && text !== 'View') {
                artistName = text;
            }
            // Le lieu a un lien vers /venue/
            if (!venueName && href.includes('/venue/')) {
                venueName = text;
            }
        });

        // Fallback: Si pas de lieu trouvé dans les liens, chercher le texte après l'artiste
        if (!venueName) {
             // Parfois le lieu n'est pas un lien cliquable
             const contentText = $row.text(); // Tout le texte de la ligne
             // C'est approximatif, mais mieux que rien
        }

        if (artistName) {
             const displayDate = `${dayStr} ${monthStr} ${year}`; // Format lisible pour MyConcerts.tsx
             
             // Vérification doublon
             const exists = upcomingConcerts.some(c => c.artist.name === artistName && c.eventDate === displayDate);
             
             if (!exists) {
                 console.log(`Found upcoming: ${artistName} on ${displayDate} @ ${venueName}`);
                 upcomingConcerts.push({
                    id: `scraped-${upcomingConcerts.length}-${Date.now()}`,
                    artist: { name: artistName },
                    eventDate: displayDate,
                    venue: { name: venueName || 'Lieu à confirmer' }
                });
             }
        }
    });

    // Tri chronologique
    upcomingConcerts.sort((a, b) => {
        // Re-parsing rapide pour le tri
        const parse = (d) => {
             const parts = d.split(' '); // "24 Jun 2026"
             return new Date(parseInt(parts[2]), MONTH_MAP[parts[1]], parseInt(parts[0]));
        };
        return parse(a.eventDate) - parse(b.eventDate);
    });
    
    console.log(`✅ Returns ${upcomingConcerts.length} upcoming concerts.`);

    return res.status(200).json({ 
      results: upcomingConcerts,
      scraped: true
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    return res.status(500).json({ error: 'Failed to fetch shows', results: [] });
  }
}
