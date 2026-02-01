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
    
    // Find all text nodes and headings
    const allText = $('body').text();
    
    // Split by the two section headers
    const upcomingIndex = allText.indexOf('Upcoming Shows');
    const attendedIndex = allText.indexOf('Attended Shows');
    
    if (upcomingIndex === -1 || attendedIndex === -1) {
      console.log('❌ Could not find section markers');
      return res.status(200).json({ results: [], scraped: true });
    }
    
    // Extract the text between the two sections
    const upcomingSection = allText.substring(upcomingIndex, attendedIndex);
    
    console.log('📄 Upcoming section text (first 500 chars):', upcomingSection.substring(0, 500));
    
    // Now find all <strong> tags in the HTML between these sections
    // We'll search for the actual HTML elements
    let foundUpcoming = false;
    let foundAttended = false;
    
    $('*').each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      
      // Detect section boundaries
      if (text === 'Upcoming Shows' || text.startsWith('Upcoming Shows (')) {
        foundUpcoming = true;
        console.log('✅ Found Upcoming Shows marker');
        return;
      }
      
      if (foundUpcoming && (text === 'Attended Shows' || text.startsWith('Attended Shows ('))) {
        foundAttended = true;
        console.log('✅ Found Attended Shows marker, stopping');
        return false; // break
      }
      
      // If we're in the upcoming section and this is a <strong> tag
      if (foundUpcoming && !foundAttended && $elem.is('strong')) {
        const artistName = $elem.text().trim();
        
        // Filter out non-artist text (dates, venues, etc.)
        if (artistName && 
            !artistName.match(/^\d/) && // Not starting with number
            !artistName.includes('Hellfest') && // Not venue
            !artistName.includes('2026') && // Not year
            artistName.length > 2 && // At least 3 chars
            !upcomingArtists.includes(artistName)) { // Not duplicate
          
          console.log(`🎸 Found artist: ${artistName}`);
          upcomingArtists.push(artistName);
        }
      }
    });
    
    console.log(`✅ Total artists found: ${upcomingArtists.length}`);
    
    // Convert to expected format
    const results = upcomingArtists.map((name, idx) => ({
      id: `upcoming-${idx}`,
      artist: { name },
      eventDate: 'À venir',
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
