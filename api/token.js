// Vercel Serverless Function: /api/token
const ENGINE_HEADERS = {
  'Accept': 'application/json',
  'Referer': 'https://downloader.faizankhichi.me/',
  'Origin': 'https://downloader.faizankhichi.me',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const upstreamRes = await fetch('https://downloader.faizankhichi.me/api/token', {
      headers: ENGINE_HEADERS
    });

    if (!upstreamRes.ok) {
      throw new Error(`Failed to mint token: ${upstreamRes.statusText}`);
    }

    const data = await upstreamRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'Token generation failed' });
  }
}
