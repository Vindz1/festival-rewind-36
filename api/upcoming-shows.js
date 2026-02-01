import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // Fetch the HTML page
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
    
    const upcomingShows = [];

    // Find the "Upcoming Shows" heading
    let foundUpcomingSection = false;
    
    $('h2, h3').each((i, heading) => {
      const headingText = $(heading).text().trim();
      
      if (headingText.includes('Upcoming Shows')) {
        foundUpcomingSection = true;
        console.log('Found Upcoming Shows section:', headingText);
        
        // Get the next div after the heading which contains the concerts
        let currentElement = $(heading).next();
        
        // Look through siblings until we hit the next section
        while (currentElement.length > 0 && !currentElement.is('h2, h3')) {
          // Find all links to setlists within this element
          currentElement.find('a[href*="/setlist/"]').each((idx, link) => {
            const $link = $(link);
            
            // Artist name is in the <strong> tag
            const artistName = $link.find('strong').text().trim();
            
            // Get all text from the link (includes venue and date)
            const fullText = $link.text().trim();
            
            // The date/event info comes after the artist name
            // Format: "Artist\nVenue • Date"
            const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
            
            let eventInfo = '';
            if (lines.length > 1) {
              eventInfo = lines.slice(1).join(' ');
            }
            
            if (artistName) {
              console.log('Found upcoming concert:', { 
                artist: artistName, 
                info: eventInfo 
              });
              
              upcomingShows.push({
                id: `upcoming-${idx}`,
                artist: { name: artistName },
                eventDate: eventInfo || 'Date à venir',
                venue: { name: eventInfo.split('•')[0]?.trim() || null }
              });
            }
          });
          
          currentElement = currentElement.next();
        }
        
        return false; // Stop after finding the section
      }
    });

    console.log(`Total upcoming shows found: ${upcomingShows.length}`);

    return res.status(200).json({ 
      results: upcomingShows,
      scraped: true,
      found_section: foundUpcomingSection
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch upcoming shows',
      results: []
    });
  }
}
