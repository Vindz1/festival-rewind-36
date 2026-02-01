import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Fonction utilitaire pour nettoyer les noms (utile pour les 2 méthodes)
const cleanArtistName = (name) => {
  if (!name) return "";
  return name
    .replace(/\s*\(.*?\)\s*/g, '') // Enlève les parenthèses
    .replace(/\s*\[.*?\]\s*/g, '') // Enlève les crochets
    .split(' With ')[0]
    .split(' feat ')[0]
    .trim();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { mode, artists, playlistId, playlistName } = req.body;
  
  // 1. Authentification
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant. Êtes-vous connecté ?" });
  }
  const userAccessToken = authHeader.split(' ')[1];
  spotifyApi.setAccessToken(userAccessToken);

  try {
    // ============================================================
    // CAS 1 : NOUVELLE MÉTHODE (HELLFEST - PAR PAQUETS)
    // ============================================================
    if (mode) {
      // 1A. Création de la playlist vide
      if (mode === 'create') {
        const playlist = await spotifyApi.createPlaylist(playlistName, {
          description: 'Générée par SetlistMemory',
          public: true
        });
        return res.status(200).json({ 
          playlistId: playlist.body.id, 
          playlistUrl: playlist.body.external_urls.spotify 
        });
      }

      // 1B. Ajout des titres (paquet par paquet)
      if (mode === 'add') {
        if (!playlistId) return res.status(400).json({ error: "Playlist ID manquant" });

        const result = await processArtists(artists);
        
        if (result.uris.length > 0) {
          await spotifyApi.addTracksToPlaylist(playlistId, result.uris);
        }

        return res.status(200).json({
          success: true,
          tracksAdded: result.uris.length,
          found: result.found,
          notFound: result.notFound
        });
      }
    }

    // ============================================================
    // CAS 2 : ANCIENNE MÉTHODE (COMPATIBILITÉ "I WAS THERE")
    // ============================================================
    else {
      // C'est ici que ça bloquait : on restaure la logique "Tout en un"
      
      // A. Création Playlist
      const name = playlistName || `My Concerts - ${new Date().toLocaleDateString()}`;
      const playlist = await spotifyApi.createPlaylist(name, {
        description: 'Générée par SetlistMemory - Mes Concerts',
        public: true
      });
      const targetId = playlist.body.id;

      // B. Recherche des titres (tous d'un coup)
      // Note : On utilise la même logique améliorée de recherche
      const result = await processArtists(artists);

      // C. Ajout des titres (par lots de 100 car limite Spotify)
      const allUris = result.uris;
      for (let i = 0; i < allUris.length; i += 100) {
        const batch = allUris.slice(i, i + 100);
        await spotifyApi.addTracksToPlaylist(targetId, batch);
      }

      // D. Réponse format ancien (celui que "I was there" attend)
      return res.status(200).json({
        playlistId: targetId,
        playlistUrl: playlist.body.external_urls.spotify,
        tracksAdded: allUris.length,
        total: allUris.length // Pour compatibilité
      });
    }

  } catch (error) {
    console.error("Erreur API:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Fonction Helper pour chercher les artistes (commune aux deux méthodes)
async function processArtists(artistNames) {
  let allTrackUris = [];
  let foundArtists = [];
  let notFoundArtists = [];

  for (const rawName of artistNames) {
    // Si l'objet est complexe (vieux format), on prend .artist, sinon c'est une string
    const nameStr = typeof rawName === 'object' ? (rawName.artist || rawName.name) : rawName;
    
    let artist = null;
    let searchName = nameStr;

    try {
      // Essai 1 : Exact
      let searchRes = await spotifyApi.searchArtists(searchName, { limit: 1 });
      artist = searchRes.body.artists?.items[0];

      // Essai 2 : Nettoyé
      if (!artist) {
        searchName = cleanArtistName(nameStr);
        if (searchName !== nameStr) {
           searchRes = await spotifyApi.searchArtists(searchName, { limit: 1 });
           artist = searchRes.body.artists?.items[0];
        }
      }

      if (artist) {
        // On prend les top tracks
        const topTracksRes = await spotifyApi.getArtistTopTracks(artist.id, 'FR');
        // Max 5 titres pour ne pas saturer
        const tracks = topTracksRes.body.tracks.slice(0, 5);
        
        if (tracks.length > 0) {
          allTrackUris.push(...tracks.map(t => t.uri));
          foundArtists.push(nameStr);
        } else {
          notFoundArtists.push(nameStr);
        }
      } else {
        notFoundArtists.push(nameStr);
      }
    } catch (e) {
      console.log(`Erreur sur ${nameStr}`, e.message);
      notFoundArtists.push(nameStr);
    }
  }

  return { uris: allTrackUris, found: foundArtists, notFound: notFoundArtists };
}
