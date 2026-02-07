import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // On cible la page de profil principale qui contient généralement la Sidebar "Upcoming"
    const response = await fetch(`https://www.setlist.fm/user/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log("❌ Profile page fetch failed");
      return res.status(404).json({ error: 'User not found' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const upcomingConcerts = [];
    const today = new Date();
    // On retire les heures pour comparer uniquement les jours
    today.setHours(0, 0, 0, 0);

    // Setlist.fm utilise souvent des div class="row" pour lister les events.
    // Chaque event a généralement une date stylisée avec .month, .day, .year
    
    $('.row').each((i, row) => {
        const $row = $(row);
        
        // 1. Extraction de la Date
        const monthStr = $row.find('.month').text().trim();
        const dayStr = $row.find('.day').text().trim();
        let yearStr = $row.find('.year').text().trim();

        // Si on n'a pas au moins le mois et le jour, ce n'est pas une ligne de concert
        if (!monthStr || !dayStr) return;

        // Si l'année est absente (cas fréquent pour l'année en cours sur setlist.fm), on devine
        if (!yearStr) {
            const currentYear = new Date().getFullYear();
            yearStr = currentYear.toString();
        }

        // Conversion en objet Date JS pour vérifier si c'est futur ou passé
        const dateString = `${dayStr} ${monthStr} ${yearStr}`;
        const concertDate = new Date(dateString);

        // Si la date est invalide, on saute
        if (isNaN(concertDate.getTime())) return;

        // FILTRE MAGIQUE : Si le concert est avant aujourd'hui, on l'ignore (c'est du passé)
        if (concertDate < today) {
            return;
        }

        // 2. Extraction Artiste et Lieu
        // L'artiste est souvent dans un <strong> > <a> ou juste un <a> au début
        let artistName = null;
        let venueName = null;

        const $links = $row.find('a');
        
        $links.each((j, link) => {
            const href = $(link).attr('href') || '';
            const text = $(link).text().trim();

            // Lien Artiste (contient /setlists/ ou /artist/)
            if (!artistName && (href.includes('/setlists/') || href.includes('/artist/'))) {
                artistName = text;
            }
            // Lien Lieu (contient /venue/)
            if (!venueName && href.includes('/venue/')) {
                venueName = text;
            }
        });

        // Nettoyage final pour éviter les bugs "Jun" ou vides
        if (artistName && artistName.length > 1) {
             
             // Création d'une date lisible pour l'affichage (ex: "24 Jun 2026")
             const displayDate = `${dayStr} ${monthStr} ${yearStr}`;

             // Vérification doublon (parfois la page mobile/desktop duplique les rows)
             const alreadyExists = upcomingConcerts.some(c => 
                 c.artist.name === artistName && c.eventDate === displayDate
             );

             if (!alreadyExists) {
                 upcomingConcerts.push({
                    id: `scraped-${upcomingConcerts.length}-${Date.now()}`,
                    artist: { name: artistName },
                    eventDate: displayDate, // Sera formaté par MyConcerts.tsx
                    venue: { name: venueName || 'Lieu inconnu' }
                });
             }
        }
    });

    // Tri par date (le plus proche d'abord)
    upcomingConcerts.sort((a, b) => {
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
    
    console.log(`✅ ${upcomingConcerts.length} concerts FUTURS trouvés via Date-Parsing.`);

    return res.status(200).json({ 
      results: upcomingConcerts,
      scraped: true
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    return res.status(500).json({ error: 'Failed to fetch shows', results: [] });
  }
}
