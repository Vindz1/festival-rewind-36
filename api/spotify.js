export default async function handler(req, res) {
  const { action, code, songs, playlistName } = req.body;
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI || 'https://votre-site.vercel.app/callback';

  // Logique simplifiée de création (nécessite SPOTIFY_CLIENT_SECRET dans Vercel)
  try {
    if (action === 'login') {
      const scope = 'playlist-modify-public playlist-modify-private';
      const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
      return res.status(200).json({ url });
    }
    // ... La suite de la logique de création sera ajoutée une fois les clés configurées
    res.status(200).json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
