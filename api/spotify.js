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
    console.log('🎵 Début création playlist');
    
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
      return res.status(400).json({ error: 'Token invalide' });
    }

    const accessToken = tokenData.access_token;

    // 2. Récupérer l'ID utilisateur
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const user = await userResponse.json();

    // 3. Récupérer les songs
    const pendingSongs = req.body.songs || JSON.parse(req.body.pendingSongs || '[]');
    const playlistName = req.body.playlistName || 'Setlist Live - ' + new Date().getFullYear();

    console.log(`📋 ${pendingSongs.length} morceaux à traiter`);

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
    console.log(`✅ Playlist créée: ${playlist.id}`);

    // 5. Chercher et ajouter les tracks (MAX 100 pour éviter timeout Vercel)
    const trackUris = [];
    const maxTracks = 100;

    console.log(`🔍 Recherche max ${maxTracks} morceaux...`);

    for (const song of pendingSongs.slice(0, maxTracks)) {
      try {
        // Si URI déjà présent (mode upcoming)
        if (song.uri) {
          trackUris.push(song.uri);
          continue;
        }

        // Chercher sur Spotify
        const searchQuery = encodeURIComponent(`${song.title} ${song.artist}`);
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        const searchData = await searchResponse.json();

        if (searchData.tracks?.items?.[0]) {
          trackUris.push(searchData.tracks.items[0].uri);
        }
      } catch (err) {
        console.error(`Erreur ${song.title}:`, err.message);
      }
    }

    console.log(`✅ ${trackUris.length} morceaux trouvés`);

    // 6. Ajouter les tracks (par batch de 100)
    if (trackUris.length > 0) {
      await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
      });
    }

    console.log(`🎉 Terminé !`);

    // 7. Retourner
    return res.status(200).json({
      success: true,
      playlistUrl: playlist.external_urls.spotify,
      tracksAdded: trackUris.length,
      totalRequested: pendingSongs.length
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
}
