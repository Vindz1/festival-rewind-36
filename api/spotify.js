export default async function handler(req, res) {
  const { action, code, playlistName, uris, accessToken } = req.body;
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

  try {
    // 1. Échange du code contre un Token
    if (action === 'token') {
      const authOptions = {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ code, redirect_uri, grant_type: 'authorization_code' })
      };
      const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 2. Création de la playlist et ajout de titres
    if (action === 'create') {
      // Obtenir l'ID utilisateur
      const userRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const user = await userRes.json();

      // Créer la playlist
      const createRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playlistName, description: 'Généré par Festival Rewind', public: true })
      });
      const playlist = await createRes.json();

      // Ajouter les titres (par paquets de 100)
      if (uris.length > 0) {
        await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: uris.slice(0, 100) })
        });
      }

      return res.status(200).json({ url: playlist.external_urls.spotify });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
