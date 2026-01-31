export default async function handler(req, res) {
  const { action, query } = req.body;
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

  try {
    if (action === 'search') {
      // Get Spotify token (Client Credentials Flow)
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Search for artist
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      const searchData = await searchResponse.json();
      return res.status(200).json({ artists: searchData.artists?.items || [] });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({ error: error.message });
  }
}
