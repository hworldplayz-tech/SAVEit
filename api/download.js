// Vercel Serverless Function: /api/download
let cachedSig = null;
let cachedExp = 0;

const ENGINE_HEADERS = {
  'Accept': 'application/json',
  'Referer': 'https://downloader.faizankhichi.me/',
  'Origin': 'https://downloader.faizankhichi.me',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

function cleanUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = String(rawUrl).trim();
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      if (id) return `https://youtu.be/${id}`;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        const v = parsed.searchParams.get("v");
        if (v) return `https://www.youtube.com/watch?v=${v}`;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.replace(/^\/shorts\/+/, "").split("/")[0];
        if (id) return `https://www.youtube.com/shorts/${id}`;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.replace(/^\/embed\/+/, "").split("/")[0];
        if (id) return `https://www.youtube.com/watch?v=${id}`;
      }
    }
    const tracking = ["si", "igsh", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "feature", "pp"];
    tracking.forEach(p => parsed.searchParams.delete(p));
    return parsed.toString();
  } catch {
    return url;
  }
}

async function fetchToken(forceFresh = false) {
  const now = Math.floor(Date.now() / 1000);
  if (!forceFresh && cachedSig && (cachedExp - now > 30)) {
    return { sig: cachedSig, exp: cachedExp };
  }
  const res = await fetch('https://downloader.faizankhichi.me/api/token', {
    headers: ENGINE_HEADERS
  });
  if (!res.ok) throw new Error('Token error: ' + res.statusText);
  const data = await res.json();
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

  const rawUrl = (req.query && req.query.url) || '';
  let sig = (req.query && req.query.sig) || '';

  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  const clean = cleanUrl(rawUrl);

  try {
    if (!sig) {
      const token = await fetchToken();
      sig = token.sig;
    }

    let downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(clean)}&sig=${encodeURIComponent(sig)}`;
    let upstreamRes = await fetch(downloadUrl, { headers: ENGINE_HEADERS });

    if (upstreamRes.status === 403) {
      const fresh = await fetchToken(true);
      downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(clean)}&sig=${encodeURIComponent(fresh.sig)}`;
      upstreamRes = await fetch(downloadUrl, { headers: ENGINE_HEADERS });
    }

    const data = await upstreamRes.json().catch(() => ({}));
    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'Download request failed' });
  }
}
