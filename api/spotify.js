export default async function handler(req, res) {
  const { action, code, uris, accessToken } = req.body;
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = process.env;
  
  try {
    if (action === 'token') {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ 
          code, 
          redirect_uri: SPOTIFY_REDIRECT_URI, 
          grant_type: 'authorization_code' 
        })
      });
      return res.status(200).json(await response.json());
    }
    
    if (action === 'create') {
      const userRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const user = await userRes.json();
      
      const createRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          name: "Ma Time Capsule Live", 
          public: true 
        })
      });
      const playlist = await createRes.json();
      
      if (uris?.length > 0) {
        await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${accessToken}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ uris: uris.slice(0, 50) })
        });
      }
      return res.status(200).json({ url: playlist.external_urls.spotify });
    }
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
}
