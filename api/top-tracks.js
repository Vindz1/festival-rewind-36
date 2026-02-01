import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { mode, artists, playlistId, playlistName } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) return res.status(401).json({ error: "Non autorisé" });
  const userAccessToken = authHeader.split(' ')[1];
  spotifyApi.setAccessToken(userAccessToken);

  try {
    if (mode === 'create') {
      // VRAIE URL SPOTIFY gérée par la lib
      const playlist = await spotifyApi.createPlaylist(playlistName || 'My Playlist', { public: true });
      return res.status(200).json({ 
        playlistId: playlist.body.id, 
        playlistUrl: playlist.body.external_urls.spotify 
      });
    }

    if (mode === 'add') {
      let allTrackUris = [];
      for (const name of artists) {
        const cleanName = typeof name === 'string' ? name : (name.artist || name.name);
        const searchRes = await spotifyApi.searchArtists(cleanName, { limit: 1 });
        const artist = searchRes.body.artists?.items[0];
        if (artist) {
          const topTracks = await spotifyApi.getArtistTopTracks(artist.id, 'FR');
          allTrackUris.push(...topTracks.body.tracks.slice(0, 5).map(t => t.uri));
        }
      }
      if (allTrackUris.length > 0) {
        await spotifyApi.addTracksToPlaylist(playlistId, allTrackUris);
      }
      return res.status(200).json({ success: true, tracksAdded: allTrackUris.length });
    }
  } catch (error) {
    console.error("Spotify API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
