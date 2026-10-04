// Vercel Serverless Function: /api/get-video-info
// Forwards to SaveIt Backend: https://api.linksshare.online/api/get-video-info

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const { videoUrl } = body || {};
  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing "videoUrl" in request body' });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.linksshare.online';

  try {
    const upstreamRes = await fetch(`${backendUrl}/api/get-video-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://saveit.linksshare.online',
        'Referer': 'https://saveit.linksshare.online/',
      },
      body: JSON.stringify({ videoUrl })
    });

    const data = await upstreamRes.json().catch(() => ({}));
    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    return res.status(502).json({ 
      error: err?.message || 'Failed to communicate with SaveIt Backend video info service' 
    });
  }
}
