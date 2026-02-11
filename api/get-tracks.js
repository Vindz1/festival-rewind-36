import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // On autorise tout le monde (CORS) pour éviter les blocages
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  // Gestion du "preflight" (requête de vérification du navigateur)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // On récupère le nom de l'artiste depuis l'URL (ex: ?artist=Metallica)
  const { artist } = req.query;

  if (!artist || typeof artist !== 'string') {
    return res.status(400).json({ error: 'Artiste manquant' });
  }

  try {
    // 1. On interroge l'API Publique iTunes
    // entity=song : on veut des chansons
    // limit=5 : les 5 plus populaires
    // attribute=artistTerm : on cherche bien par nom d'artiste
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=10&attribute=artistTerm`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('Erreur iTunes');
    }

    const data = await response.json();

    // 2. Nettoyage et Filtrage
    // iTunes est parfois "trop gentil" et renvoie des homonymes. On filtre.
    const searchClean = artist.toLowerCase();
    
    const tracks = data.results
        .filter((item: any) => {
            const itemArtist = item.artistName.toLowerCase();
            return itemArtist.includes(searchClean) || searchClean.includes(itemArtist);
        })
        .slice(0, 5) // On garde le TOP 5
        .map((item: any) => ({
            artist: item.artistName,
            name: item.trackName,
            album: item.collectionName,
            preview: item.previewUrl // Bonus : un lien vers un extrait audio de 30s !
        }));

    // 3. Réponse propre
    return res.status(200).json(tracks);

  } catch (error) {
    console.error(error);
    // En cas de pépin, on renvoie une liste vide pour ne pas faire planter l'appli
    return res.status(200).json([]); 
  }
}
