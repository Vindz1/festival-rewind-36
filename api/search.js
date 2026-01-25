export default async function handler(req, res) {
  const { query } = req.query;
  const apiKey = process.env.SETLIST_FM_API_KEY || 'ovRH4H1pKy1yumS7vWuHrg7q4dwF30FsICjj';

  try {
    const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?venueName=${encodeURIComponent(query)}&p=1`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur tunnel" });
  }
}
