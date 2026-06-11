// api/upcoming-shows.js
import * as cheerio from 'cheerio';

async function fetchHtmlWithRetry(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (r.ok) return r;
      if ((r.status === 429 || r.status === 503) && attempt < retries) {
        await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
        continue;
      }
      return r;
    } catch (e) {
      if (attempt >= retries) throw e;
      await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
    }
  }
}

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    const response = await fetchHtmlWithRetry(`https://www.setlist.fm/attended/${username}`);

    if (!response || !response.ok) {
      return res.status(404).json({ error: 'User not found', results: [] });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const upcomingArtists = [];

    // --- LOGIQUE D'ORIGINE INCHANGÉE ---
    let foundUpcoming = false;
    let foundAttended = false;

    const IGNORED_TERMS = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
      'Date', 'Venue', 'Festival', 'Tour', 'Concert'
    ];

    $('*').each((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();

      if (text === 'Upcoming Shows' || text.includes('Upcoming Shows (')) {
        foundUpcoming = true;
        return;
      }

      if (foundUpcoming && (text === 'Attended Shows' || text.includes('Attended Shows ('))) {
        foundAttended = true;
        return false;
      }

      if (foundUpcoming && !foundAttended && $elem.is('strong')) {
        const artistName = text;

        if (artistName &&
            !artistName.match(/^\d/) &&
            !artistName.includes('Hellfest') &&
            !artistName.includes('2024') &&
            !artistName.includes('2025') &&
            !artistName.includes('2026') &&
            artistName.length > 2 &&
            !upcomingArtists.includes(artistName)) {

          const isMonth = IGNORED_TERMS.some(term => artistName.startsWith(term));

          if (!isMonth) {
            upcomingArtists.push(artistName);
          }
        }
      }
    });

    const results = upcomingArtists.map((name, idx) => ({
      id: `upcoming-${idx}`,
      artist: { name },
      eventDate: 'Date à confirmer',
      venue: { name: '—' }
    }));

    // Cache CDN Vercel : 5 min, stale 10 min
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
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
