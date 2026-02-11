import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { q } = req.query; // "q" comme query

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Recherche manquante' });
  }

  const apiKey = process.env.SETLIST_FM_API_KEY;

  try {
    // On cherche les setlists par nom d'artiste (triées par date)
    const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(q)}&p=1&sort=date`, {
      headers: {
        'x-api-key': apiKey || '',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
        return res.status(response.status).json({ error: 'Erreur setlist.fm' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
