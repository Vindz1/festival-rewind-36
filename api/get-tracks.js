import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS pour autoriser l'appel depuis le navigateur
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { artist } = req.query;

  if (!artist || typeof artist !== 'string') {
    return res.status(400).json({ error: 'Artiste manquant' });
  }

  try {
    // 1. On interroge iTunes
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=5&attribute=artistTerm`;
    
    // IMPORTANT : On ajoute un User-Agent pour ne pas être bloqué
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Setlive/1.0;)'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erreur iTunes: ${response.status}`);
    }

    const data = await response.json();

    // 2. On renvoie les résultats SANS filtrage strict
    // Si iTunes trouve quelque chose, on le prend.
    const tracks = data.results.map((item: any) => ({
        artist: item.artistName,
        name: item.trackName,
        album: item.collectionName,
        preview: item.previewUrl 
    }));

    return res.status(200).json(tracks);

  } catch (error) {
    console.error("API Error:", error);
    // On renvoie un tableau vide en cas d'erreur
    return res.status(200).json([]); 
  }
}
