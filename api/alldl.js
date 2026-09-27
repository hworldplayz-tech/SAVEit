// Vercel Serverless Function: /api/alldl
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
    }
    const tracking = ["si", "igsh", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "feature", "pp"];
    tracking.forEach(p => parsed.searchParams.delete(p));
    return parsed.toString();
  } catch {
    return url;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = req.query?.url || '';
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  const clean = cleanUrl(rawUrl);

  try {
    const upstreamUrl = `https://ahm7xmakki.com/api/alldl?url=${encodeURIComponent(clean)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = await upstreamRes.json().catch(() => ({}));
    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'Standard engine proxy request failed' });
  }
}
