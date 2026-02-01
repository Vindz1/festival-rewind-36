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
    
    const upcomingShows = [];
    let inUpcomingSection = false;

    // Parse each element in order
    $('body *').each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      
      // Check if we're entering the Upcoming Shows section
      if (text.startsWith('Upcoming Shows')) {
        console.log('✅ Entering Upcoming Shows section');
        inUpcomingSection = true;
        return; // continue
      }
      
      // Check if we're leaving the Upcoming Shows section
      if (inUpcomingSection && text.startsWith('Attended Shows')) {
        console.log('❌ Leaving Upcoming Shows section, entering Attended');
        inUpcomingSection = false;
        return false; // break
      }
      
      // If we're in the upcoming section and this is a setlist link
      if (inUpcomingSection && $elem.is('a') && $elem.attr('href')?.includes('/setlist/')) {
        const artistName = $elem.find('strong').first().text().trim();
        
        if (artistName) {
          const fullText = $elem.text().trim();
          
          // Extract event info (everything after the artist name)
          const eventInfo = fullText.replace(artistName, '').trim();
          
          console.log(`Found concert: ${artistName} | ${eventInfo}`);
          
          upcomingShows.push({
            id: `upcoming-${upcomingShows.length}`,
            artist: { name: artistName },
            eventDate: eventInfo || 'Date à venir',
            venue: { name: eventInfo.split('•')[0]?.trim() || null }
          });
        }
      }
    });

    console.log(`✅ Total: ${upcomingShows.length} upcoming shows`);

    return res.status(200).json({ 
      results: upcomingShows,
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
