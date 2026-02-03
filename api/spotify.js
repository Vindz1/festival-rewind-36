export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

  if (!code) {
    return res.status(400).json({ error: 'Code manquant' });
  }

  try {
    // 1. Échanger le code contre un access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: 'https://festivalrewind.vercel.app/spotify-callback',
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Token error:', tokenData);
      return res.status(400).json({ error: 'Impossible d\'obtenir le token', details: tokenData });
    }

    const accessToken = tokenData.access_token;

    // 2. Récupérer l'ID de l'utilisateur
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const user = await userResponse.json();

    // 3. Récupérer les songs depuis localStorage (via le body)
    const pendingSongs = req.body.songs || JSON.parse(req.body.pendingSongs || '[]');
    const playlistName = req.body.playlistName || 'Setlist Live - ' + new Date().getFullYear();

    // 4. Créer la playlist
    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: playlistName,
        description: 'Créé avec Setlist Live',
        public: true
      })
    });

    const playlist = await createPlaylistResponse.json();



  } catch (error) {
    console.error('Spotify API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
