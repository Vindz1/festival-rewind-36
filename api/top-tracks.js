import SpotifyWebApi from 'spotify-web-api-node';

// Initialisation (à adapter selon votre config d'auth)
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { artists, playlistId, isFirstBatch, playlistName } = req.body;
  
  // ICI : Il faut récupérer le token de l'utilisateur connecté
  // Cela dépend de comment vous gérez le login (NextAuth, Supabase Auth avec provider Spotify...)
  // Pour l'exemple, on suppose que le token est passé dans les headers
  const userAccessToken = req.headers.authorization?.split(' ')[1];

  if (!userAccessToken) {
    return res.status(401).json({ error: "Utilisateur non connecté à Spotify" });
  }

  spotifyApi.setAccessToken(userAccessToken);

  try {
    let targetPlaylistId = playlistId;

    // 1. Création de la playlist si c'est le premier paquet
    if (isFirstBatch && !targetPlaylistId) {
      const me = await spotifyApi.getMe();
      const playlist = await spotifyApi.createPlaylist(playlistName, {
        description: 'Générée par SetlistMemory - Hellfest 2026',
        public: true
      });
      targetPlaylistId = playlist.body.id;
    }

    // 2. Recherche des titres
    let allTrackUris = [];

    for (const artistName of artists) {
      try {
        // Recherche artiste
        const searchRes = await spotifyApi.searchArtists(artistName, { limit: 1 });
        const artist = searchRes.body.artists?.items[0];

        if (artist) {
          // Top tracks
          const topTracksRes = await spotifyApi.getArtistTopTracks(artist.id, 'FR');
          const tracks = topTracksRes.body.tracks.slice(0, 10); // Max 10 titres
          const uris = tracks.map(t => t.uri);
          allTrackUris = [...allTrackUris, ...uris];
        }
      } catch (e) {
        console.log(`Erreur pour ${artistName}`, e);
      }
    }

    // 3. Ajout des titres à la playlist
    if (allTrackUris.length > 0) {
        // L'API Spotify limite à 100 URI par appel, mais comme notre paquet (BATCH_SIZE)
        // est de 4 artistes * 10 chansons = 40 chansons, on est large !
        await spotifyApi.addTracksToPlaylist(targetPlaylistId, allTrackUris);
    }

    return res.status(200).json({
      playlistId: targetPlaylistId,
      playlistUrl: `https://open.spotify.com/playlist/${targetPlaylistId}`,
      tracksAdded: allTrackUris.length
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
