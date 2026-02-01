export default async function handler(req, res) {
  const { artists } = req.body; // Array of artist names
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

  if (!artists || !Array.isArray(artists)) {
    return res.status(400).json({ error: 'Artists array required' });
  }

  try {
    // Get Spotify token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('Spotify Auth Error:', tokenData);
      throw new Error('Failed to get access token');
    }
    
    const accessToken = tokenData.access_token;

    const artistsWithTracks = [];

    for (const artistName of artists) {
      try {
        // Search for artist
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        const searchData = await searchResponse.json();
        const artist = searchData.artists?.items?.[0];

        if (!artist) {
          console.log(`⚠️ Artist not found: ${artistName}`);
          continue;
        }

        // Get top tracks
        const topTracksResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=FR`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        const topTracksData = await topTracksResponse.json();
        const topTracks = topTracksData.tracks?.slice(0, 10) || [];

        console.log(`✅ ${artistName}: ${topTracks.length} tracks`);

        artistsWithTracks.push({
          artistName: artist.name,
          artistId: artist.id,
          artistImage: artist.images?.[0]?.url,
          tracks: topTracks.map(track => ({
            id: track.id,
            name: track.name,
            uri: track.uri,
            album: track.album.name,
            albumImage: track.album.images?.[0]?.url,
            duration: track.duration_ms,
            preview_url: track.preview_url
          }))
        });

      } catch (err) {
        console.error(`Error fetching ${artistName}:`, err);
      }
    }

    return res.status(200).json({ 
      artists: artistsWithTracks,
      total: artistsWithTracks.length
    });

  } catch (error) {
    console.error('Top tracks error:', error);
    return res.status(500).json({ error: error.message });
  }
}
