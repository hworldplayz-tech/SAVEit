// Vercel Serverless Function: /api/token
let cachedSig = null;
let cachedExp = 0;

const ENGINE_HEADERS = {
  'Accept': 'application/json',
  'Referer': 'https://downloader.faizankhichi.me/',
  'Origin': 'https://downloader.faizankhichi.me',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

async function fetchToken(forceFresh = false) {
  const now = Math.floor(Date.now() / 1000);
  if (!forceFresh && cachedSig && (cachedExp - now > 30)) {
    return { sig: cachedSig, exp: cachedExp };
  }

  const res = await fetch('https://downloader.faizankhichi.me/api/token', {
    headers: ENGINE_HEADERS
  });

  if (!res.ok) {
    throw new Error(`Failed to mint token: ${res.statusText}`);
  }

  const data = await res.json();
  if (!data || !data.sig) {
    throw new Error('Invalid token response');
  }

  cachedSig = data.sig;
  cachedExp = data.exp || (now + 300);
  return { sig: cachedSig, exp: cachedExp };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const token = await fetchToken();
    return res.status(200).json(token);
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'Token generation failed' });
  }
}
