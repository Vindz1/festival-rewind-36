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

    // Parse the "Upcoming Shows" section
    // The structure is typically in a section with upcoming concerts
    $('.upcomingConcert, .setlistPreview').each((i, elem) => {
      try {
        const $elem = $(elem);
        
        // Extract artist name
        const artistName = $elem.find('.artistName a, h3.artistName a').first().text().trim();
        
        // Extract date
        const dateText = $elem.find('.dateBlock, .concertDate').first().text().trim();
        
        // Extract venue
        const venueName = $elem.find('.venueName, .venue a').first().text().trim();
        
        // Extract event ID for linking
        const setlistLink = $elem.find('a[href*="/setlist/"]').first().attr('href');
        const eventId = setlistLink ? setlistLink.split('/setlist/')[1]?.split('-')[0] : null;

        if (artistName) {
          upcomingShows.push({
            id: eventId || `upcoming-${i}`,
            artist: { name: artistName },
            eventDate: dateText,
            venue: { name: venueName || null }
          });
        }
      } catch (err) {
        console.error('Error parsing concert:', err);
      }
    });

    // If no upcoming shows found with class selectors, try alternative parsing
    if (upcomingShows.length === 0) {
      // Look for "Upcoming Shows" heading and parse following elements
      $('h2, h3').each((i, heading) => {
        const headingText = $(heading).text().trim();
        if (headingText.includes('Upcoming') || headingText.includes('upcoming')) {
          // Get the parent container
          const container = $(heading).parent();
          
          // Find all concert entries after this heading
          container.find('.vevent, [itemtype*="Event"]').each((idx, event) => {
            try {
              const $event = $(event);
              const artistName = $event.find('[itemprop="name"], .summary').first().text().trim();
              const dateText = $event.find('[itemprop="startDate"], .dtstart').first().text().trim();
              const venueName = $event.find('[itemprop="location"], .location').first().text().trim();
              
              if (artistName) {
                upcomingShows.push({
                  id: `upcoming-${idx}`,
                  artist: { name: artistName },
                  eventDate: dateText,
                  venue: { name: venueName || null }
                });
              }
            } catch (err) {
              console.error('Error parsing event:', err);
            }
          });
        }
      });
    }

    return res.status(200).json({ 
      results: upcomingShows,
      scraped: true 
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch upcoming shows',
      results: []
    });
  }
}
