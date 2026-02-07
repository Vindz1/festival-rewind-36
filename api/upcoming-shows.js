import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // On charge la page principale du profil
    const response = await fetch(`https://www.setlist.fm/user/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'User not found' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const upcomingConcerts = [];
    const processedIds = new Set(); // Pour éviter les doublons

    console.log(`🔍 Scanning page for user: ${username}`);

    // LISTE DES MOIS pour la détection
    const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // MÉTHODE BULLDOZER : On scanne tous les conteneurs susceptibles de contenir un event
    // div.row, div.col-*, li, tr
    $('div, li, tr').each((i, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        
        // 1. FILTRE RAPIDE : Est-ce qu'il y a une année future dans ce bloc ?
        if (!text.includes('2025') && !text.includes('2026')) {
            return; // On passe au suivant
        }

        // 2. FILTRE ARTISTE : Y a-t-il un lien vers un artiste dans ce bloc ?
        // Les liens artistes ressemblent à /setlists/nom-du-groupe-... ou /artist/nom...
        const artistLink = $el.find('a[href*="/setlists/"], a[href*="/artist/"]').first();
        
        if (artistLink.length === 0) return;

        const artistName = artistLink.text().trim();
        const href = artistLink.attr('href');

        // On ignore si le nom de l'artiste est vide ou si c'est un lien générique
        if (!artistName || artistName.length < 2 || artistName === 'Play' || artistName === 'Edit') return;

        // 3. EXTRACTION DE LA DATE
        // On cherche un format de date dans le texte du bloc (ex: "Jun 24 2026" ou "24 Jun 2026")
        let foundDate = null;
        let foundMonth = null;

        // On cherche quel mois est présent dans le texte
        for (const m of MONTHS_EN) {
            if (text.includes(m)) {
                foundMonth = m;
                break;
            }
        }

        if (!foundMonth) return; // Pas de mois trouvé = pas une date de concert

        // On essaie de trouver le jour (un ou deux chiffres proches du mois)
        // Regex simple : MotMois + espaces + Chiffres OU Chiffres + espaces + MotMois
        const dateRegex = new RegExp(`(${foundMonth})\\s+(\\d{1,2})|(\\d{1,2})\\s+(${foundMonth})`, 'i');
        const match = text.match(dateRegex);

        if (match) {
            // On reconstruit une date lisible
            const day = match[2] || match[3];
            const year = text.includes('2026') ? '2026' : '2025'; // On priorise l'année future trouvée
            foundDate = `${day} ${foundMonth} ${year}`;
        } else {
            // Fallback : on met au moins le mois et l'année
            const year = text.includes('2026') ? '2026' : '2025';
            foundDate = `${foundMonth} ${year}`; 
        }

        // 4. EXTRACTION DU LIEU
        // On cherche un lien avec /venue/
        let venueName = 'Lieu inconnu';
        const venueLink = $el.find('a[href*="/venue/"]').first();
        if (venueLink.length > 0) {
            venueName = venueLink.text().trim();
        } else {
            // Parfois le lieu n'est pas un lien, on essaie de trouver du texte après l'artiste
            // C'est risqué, on laisse "Lieu inconnu" ou on cherche la ville
            const cityLink = $el.find('a[href*="/city/"]').first();
            if (cityLink.length > 0) {
                venueName = `${cityLink.text().trim()} (Ville)`;
            }
        }

        // 5. VALIDATION ET AJOUT
        // On crée un ID unique pour éviter d'ajouter le même concert 3 fois (car on scanne des divs imbriquées)
        const uniqueId = `${artistName}-${foundDate}`;
        
        if (!processedIds.has(uniqueId)) {
            // Vérification finale : on ignore les mois parsés comme artistes (le bug "Jun")
            if (!MONTHS_EN.includes(artistName)) {
                console.log(`🎸 Concert trouvé : ${artistName} le ${foundDate} à ${venueName}`);
                
                upcomingConcerts.push({
                    id: `scan-${upcomingConcerts.length}`,
                    artist: { name: artistName },
                    eventDate: foundDate,
                    venue: { name: venueName }
                });
                
                processedIds.add(uniqueId);
            }
        }
    });

    // Tri chronologique simple
    upcomingConcerts.sort((a, b) => {
        // Astuce pour trier grossièrement par année
        if (a.eventDate.includes('2025') && b.eventDate.includes('2026')) return -1;
        if (a.eventDate.includes('2026') && b.eventDate.includes('2025')) return 1;
        return 0;
    });

    console.log(`✅ ${upcomingConcerts.length} concerts envoyés au front.`);

    return res.status(200).json({ 
      results: upcomingConcerts,
      scraped: true
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    return res.status(500).json({ error: 'Failed to fetch shows', results: [] });
  }
}
