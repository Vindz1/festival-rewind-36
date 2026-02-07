import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
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
    
    // Find all text nodes
    const allText = $('body').text();
    
    // Split sections
    const upcomingIndex = allText.indexOf('Upcoming Shows');
    const attendedIndex = allText.indexOf('Attended Shows');
    
    if (upcomingIndex === -1 || attendedIndex === -1) {
      console.log('❌ Could not find section markers');
      return res.status(200).json({ results: [], scraped: true });
    }
    
    // Liste des mois à ignorer (souvent parsés par erreur comme Artistes)
    const IGNORED_TERMS = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
        'Date', 'Venue', 'Festival'
    ];

    let foundUpcoming = false;
    let foundAttended = false;
    
    $('*').each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      
      // Detect section boundaries
      if (text === 'Upcoming Shows' || text.startsWith('Upcoming Shows (')) {
        foundUpcoming = true;
        return;
      }
      
      if (foundUpcoming && (text === 'Attended Shows' || text.startsWith('Attended Shows ('))) {
        foundAttended = true;
        return false; // break
      }
      
      // Look for strong tags in upcoming section
      if (foundUpcoming && !foundAttended && $elem.is('strong')) {
        const artistName = $elem.text().trim();
        
        // Improved Filtering
        if (artistName && 
            !artistName.match(/^\d/) && // Not starting with number
            !artistName.includes('Hellfest') && // Not venue
            !artistName.includes('2026') && // Not year
            artistName.length > 2 && // At least 3 chars
            !upcomingArtists.includes(artistName)) {
            
            // Check if it's a Month name
            const isMonth = IGNORED_TERMS.some(term => artistName.startsWith(term));
            
            if (!isMonth) {
                console.log(`🎸 Found artist: ${artistName}`);
                upcomingArtists.push(artistName);
            } else {
                console.log(`⚠️ Ignored date/month text: ${artistName}`);
            }
        }
      }
    });
    
    console.log(`✅ Total artists found: ${upcomingArtists.length}`);
    
    // Convert to expected format
    const results = upcomingArtists.map((name, idx) => ({
      id: `upcoming-${idx}`,
      artist: { name },
      eventDate: 'À venir', // Hardcoded car non récupéré par ce script
      venue: { name: null }
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
