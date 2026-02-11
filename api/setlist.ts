import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID manquant' });
  }

  const apiKey = process.env.SETLIST_FM_API_KEY;

  try {
    const response = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${id}`, {
      headers: {
        'x-api-key': apiKey || '',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
        // Si erreur, on renvoie une erreur propre
        return res.status(response.status).json({ error: 'Erreur setlist.fm' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
