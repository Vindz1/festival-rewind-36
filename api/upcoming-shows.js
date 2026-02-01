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

    // Debug: Log page title to confirm we got the right page
    console.log('Page title:', $('title').text());

    // Method 1: Look for the "Upcoming Shows" section specifically
    let upcomingSection = null;
    $('h2, h3').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.toLowerCase().includes('upcoming')) {
        upcomingSection = $(elem).parent();
        console.log('Found upcoming section:', text);
        return false; // break
      }
    });

    if (upcomingSection) {
      // Find all concert rows within this section
      upcomingSection.find('.setlistPreview, .vevent, tr').each((idx, row) => {
        const $row = $(row);
        
        // Try multiple patterns for artist name
        const artistName = 
          $row.find('.headliner a').first().text().trim() ||
          $row.find('a[href*="/setlist/"]').first().text().trim() ||
          $row.find('.summary').first().text().trim() ||
          '';
        
        // Try multiple patterns for date
        const dateElem = $row.find('.dateBlock, .concertDate, time, .dtstart').first();
        const dateText = dateElem.text().trim() || dateElem.attr('datetime') || '';
        
        // Try multiple patterns for venue
        const venueName = 
          $row.find('.venueName a').first().text().trim() ||
          $row.find('.location').first().text().trim() ||
          '';

        if (artistName) {
          console.log('Found concert:', { artistName, dateText, venueName });
          upcomingShows.push({
            id: `upcoming-${idx}`,
            artist: { name: artistName },
            eventDate: dateText,
            venue: { name: venueName || null }
          });
        }
      });
    }

    // Method 2: If nothing found, try direct table parsing
    if (upcomingShows.length === 0) {
      console.log('Trying alternative method: direct table parsing');
      
      $('table tr, .setlistList .setlistPreview').each((idx, row) => {
        const $row = $(row);
        const allLinks = $row.find('a');
        
        allLinks.each((i, link) => {
          const href = $(link).attr('href') || '';
          if (href.includes('/setlist/')) {
            const artistName = $(link).text().trim();
            if (artistName && !artistName.toLowerCase().includes('edit')) {
              console.log('Found via table method:', artistName);
              upcomingShows.push({
                id: `upcoming-table-${idx}`,
                artist: { name: artistName },
                eventDate: $row.find('.dateBlock, time').first().text().trim() || 'Date à venir',
                venue: { name: $row.find('.venueName').first().text().trim() || null }
              });
            }
          }
        });
      });
    }

    console.log(`Total upcoming shows found: ${upcomingShows.length}`);

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
