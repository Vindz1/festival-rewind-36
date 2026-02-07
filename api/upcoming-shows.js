import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    console.log(`🤖 Scraping "dumb mode" for: ${username}`);
    
    // On charge la page de profil
    const response = await fetch(`https://www.setlist.fm/user/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return res.status(404).json({ error: 'User not found' });

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const upcomingConcerts = [];

    // --- LOGIQUE SIMPLIFIÉE ---
    // 1. On cherche le titre "Upcoming Shows" (h2 ou h3)
    // 2. On prend son conteneur parent
    // 3. On prend toutes les lignes (.row) dedans. Point barre.
    
    let upcomingContainer = null;

    // On cherche le header qui contient le mot "Upcoming"
    $('h2, h3').each((i, el) => {
        if ($(el).text().includes('Upcoming')) {
            upcomingContainer = $(el).parent(); // Le parent contient généralement la liste
        }
    });

    if (upcomingContainer) {
        console.log("✅ Bloc 'Upcoming' trouvé !");
        
        // On cherche chaque ligne de concert dans ce bloc spécifique
        upcomingContainer.find('.row').each((i, row) => {
            const $row = $(row);
            
            // Extraction DATE (Texte brut)
            const month = $row.find('.month').text().trim();
            const day = $row.find('.day').text().trim();
            let year = $row.find('.year').text().trim();

            if (!year) {
                // Si l'année est masquée par Setlist.fm (année en cours), on force 2026 (ou l'année courante)
                // Pour être sûr, on met l'année actuelle par défaut
                year = new Date().getFullYear().toString();
            }

            // Extraction ARTISTE & LIEU (Premier lien = Artiste, Deuxième lien ou texte = Lieu)
            let artistName = "";
            let venueName = "";

            // On récupère tous les liens
            const links = $row.find('a');
            
            links.each((j, link) => {
                const href = $(link).attr('href') || "";
                const text = $(link).text().trim();

                // Si le lien contient 'artist' ou 'setlists', c'est l'artiste
                if ((href.includes('artist') || href.includes('setlists')) && !artistName) {
                    artistName = text;
                }
                // Si le lien contient 'venue', c'est le lieu
                else if (href.includes('venue') && !venueName) {
                    venueName = text;
                }
            });

            // Si on n'a pas trouvé le lieu via un lien, on cherche le texte après "at"
            if (!venueName) {
                const fullText = $row.text();
                if (fullText.includes(' at ')) {
                    venueName = fullText.split(' at ')[1]?.trim();
                }
            }

            // --- SAUVEGARDE SANS VÉRIFICATION ---
            // Si on a au moins un artiste et un jour, on ajoute.
            if (artistName && day) {
                const fullDate = `${day} ${month} ${year}`;
                
                console.log(`➕ Ajout: ${artistName} le ${fullDate}`);
                
                upcomingConcerts.push({
                    id: `scraped-${i}`,
                    artist: { name: artistName },
                    eventDate: fullDate,
                    venue: { name: venueName || "Lieu inconnu" }
                });
            }
        });
    } else {
        console.log("⚠️ Bloc 'Upcoming' introuvable via le titre.");
        // PLAN B : Si le titre a changé, on cherche juste les icônes de calendrier (souvent signe d'un concert)
        // Mais pour l'instant, restons sur le Plan A qui est le plus sûr.
    }

    return res.status(200).json({ 
      results: upcomingConcerts,
      scraped: true
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur', results: [] });
  }
}
