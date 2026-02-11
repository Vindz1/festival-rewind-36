/**
 * SPOTIFY WEB API - Alternative à iTunes
 * 
 * Spotify donne de meilleurs résultats car il a un endpoint dédié
 * pour récupérer le "Top Tracks" d'un artiste spécifique.
 * 
 * SETUP REQUIS :
 * 1. Créer une app sur https://developer.spotify.com/dashboard
 * 2. Récupérer Client ID et Client Secret
 * 3. Ajouter dans .env :
 *    VITE_SPOTIFY_CLIENT_ID=xxx
 *    VITE_SPOTIFY_CLIENT_SECRET=xxx
 * 
 * AVANTAGES vs iTunes :
 * - Résultats plus précis (endpoint dédié "top tracks")
 * - Pas de pollution par des featurings
 * - Popularité réelle basée sur les écoutes
 * - Meilleure qualité de métadonnées
 */

// Types
interface SpotifyTrack {
  artist: string;
  name: string;
  popularity?: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
}

// Cache du token (évite de le regénérer à chaque requête)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtenir un token d'accès Spotify
 */
export const getSpotifyToken = async (): Promise<string> => {
  // Si token en cache et pas expiré, on le retourne
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials manquantes dans .env');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache le token (expire généralement après 3600s)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000) - 60000 // -1min de marge
  };

  return data.access_token;
};

/**
 * Rechercher un artiste sur Spotify
 */
export const searchSpotifyArtist = async (artistName: string): Promise<SpotifyArtist | null> => {
  try {
    const token = await getSpotifyToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.artists?.items || data.artists.items.length === 0) {
      console.warn(`Aucun artiste trouvé sur Spotify pour: ${artistName}`);
      return null;
    }

    // Prendre le premier résultat (généralement le plus pertinent)
    const artist = data.artists.items[0];
    
    return {
      id: artist.id,
      name: artist.name,
      popularity: artist.popularity
    };
  } catch (err) {
    console.error(`Erreur recherche Spotify pour ${artistName}:`, err);
    return null;
  }
};

/**
 * Récupérer les top tracks d'un artiste Spotify
 */
export const fetchSpotifyTopTracks = async (
  artistName: string, 
  limit: number = 10
): Promise<SpotifyTrack[]> => {
  try {
    // 1. Chercher l'artiste
    const artist = await searchSpotifyArtist(artistName);
    
    if (!artist) {
      console.warn(`Artiste non trouvé sur Spotify: ${artistName}`);
      return [];
    }

    // 2. Récupérer ses top tracks
    const token = await getSpotifyToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify top tracks failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.tracks || data.tracks.length === 0) {
      console.warn(`Aucun top track pour ${artistName}`);
      return [];
    }

    // 3. Formater les résultats
    const tracks = data.tracks
      .slice(0, limit)
      .map((track: any) => ({
        artist: artist.name, // Utiliser le nom officiel Spotify
        name: track.name,
        popularity: track.popularity
      }));

    console.log(`  ✅ Spotify ${artistName}: ${tracks.length} top tracks`);
    
    return tracks;
  } catch (err) {
    console.error(`Erreur Spotify top tracks pour ${artistName}:`, err);
    return [];
  }
};

/**
 * Fonction hybride : essayer Spotify d'abord, fallback iTunes
 */
export const fetchTopTracks = async (
  artistName: string,
  limit: number = 10,
  useSpotify: boolean = true
): Promise<SpotifyTrack[]> => {
  
  if (useSpotify) {
    try {
      const spotifyTracks = await fetchSpotifyTopTracks(artistName, limit);
      
      if (spotifyTracks.length > 0) {
        return spotifyTracks;
      }
      
      console.warn(`⚠️ Spotify vide pour ${artistName}, fallback iTunes`);
    } catch (err) {
      console.error(`❌ Erreur Spotify, fallback iTunes:`, err);
    }
  }

  // Fallback sur iTunes (votre fonction existante améliorée)
  return fetchItunesImproved(artistName, limit);
};

/**
 * iTunes amélioré (même logique que dans Generate.tsx)
 */
const fetchItunesImproved = async (artist: string, limit: number = 10): Promise<SpotifyTrack[]> => {
  try {
    const searchLimit = Math.max(limit * 3, 30);
    
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=${searchLimit}&country=US`
    );
    
    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    const normalizedSearchArtist = normalizeString(artist);
    
    const scoredResults = data.results
      .map((item: any) => {
        const normalizedArtistName = normalizeString(item.artistName);
        let score = 0;
        
        if (normalizedArtistName === normalizedSearchArtist) {
          score += 100;
        } else if (normalizedArtistName.includes(normalizedSearchArtist)) {
          score += 50;
        } else {
          return { ...item, score: 0 };
        }
        
        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return scoredResults.map((item: any) => ({
      artist: item.artistName,
      name: item.trackName
    }));
  } catch (err) {
    console.error(`Erreur iTunes pour ${artist}:`, err);
    return [];
  }
};

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};
