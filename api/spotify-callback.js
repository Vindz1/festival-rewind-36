export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code, error } = req.query;

  // Si l'utilisateur refuse l'autorisation
  if (error) {
    return res.redirect(`/?error=${error}`);
  }

  // Si pas de code, erreur
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI || 'https://festival-rewind-36.vercel.app/spotify-callback'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Spotify token error:', errorData);
      return res.status(tokenResponse.status).json({ error: errorData });
    }

    const tokenData = await tokenResponse.json();

    // Rediriger vers la page principale avec les tokens
    // Tu peux aussi les stocker dans une session ou base de données
    const redirectUrl = `/?spotify_access_token=${tokenData.access_token}&spotify_refresh_token=${tokenData.refresh_token}&expires_in=${tokenData.expires_in}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
