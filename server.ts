import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Basic JSON parser
app.use(express.json());

// Enable universal CORS so browser never hits "Failed to fetch"
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/* =====================================================================
   Faizan Khichi Engine Server-Side Integration
   ===================================================================== */
let cachedFaizanSig: string | null = null;
let cachedFaizanExp = 0;

export function cleanMediaUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    
    // YouTube short links: youtu.be/<id>?si=...
    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      if (videoId) {
        return `https://youtu.be/${videoId}`;
      }
    }
    
    // YouTube standard links: youtube.com/watch?v=<id>&si=...
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

    // Strip general social/share tracking query parameters (si, igsh, utm_*, fbclid, feature, pp, etc.)
    const trackingParams = [
      "si", "igsh", "utm_source", "utm_medium", "utm_campaign", 
      "utm_term", "utm_content", "fbclid", "feature", "pp"
    ];
    trackingParams.forEach(p => parsed.searchParams.delete(p));
    return parsed.toString();
  } catch {
    return url;
  }
}

const FAIZAN_HEADERS = {
  'Accept': 'application/json',
  'Referer': 'https://downloader.faizankhichi.me/',
  'Origin': 'https://downloader.faizankhichi.me',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

async function fetchFaizanToken(forceFresh = false): Promise<{ sig: string; exp: number }> {
  const now = Math.floor(Date.now() / 1000);
  if (!forceFresh && cachedFaizanSig && (cachedFaizanExp - now > 30)) {
    return { sig: cachedFaizanSig, exp: cachedFaizanExp };
  }

  const res = await fetch('https://downloader.faizankhichi.me/api/token', {
    headers: FAIZAN_HEADERS
  });

  if (!res.ok) {
    throw new Error(`Failed to mint session token from Faizan engine: ${res.statusText}`);
  }

  const data = await res.json() as any;
  if (!data || !data.sig) {
    throw new Error('Invalid token response from Faizan engine');
  }

  cachedFaizanSig = data.sig;
  cachedFaizanExp = data.exp || (now + 300);
  return { sig: cachedFaizanSig, exp: cachedFaizanExp };
}

// Token route
app.get('/api/faizan/token', async (_req: Request, res: Response) => {
  try {
    const token = await fetchFaizanToken();
    return res.json(token);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'Token minting failed' });
  }
});

// Download proxy route
app.get('/api/faizan/download', async (req: Request, res: Response) => {
  const rawTargetUrl = req.query.url as string;
  let sig = req.query.sig as string;

  if (!rawTargetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  const targetUrl = cleanMediaUrl(rawTargetUrl);

  try {
    if (!sig) {
      const token = await fetchFaizanToken();
      sig = token.sig;
    }

    let downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(targetUrl)}&sig=${encodeURIComponent(sig)}`;
    let upstreamRes = await fetch(downloadUrl, { headers: FAIZAN_HEADERS });

    // Handle token expiration mid-flight (403 retry as in Faizan app.js)
    if (upstreamRes.status === 403) {
      cachedFaizanSig = null;
      const freshToken = await fetchFaizanToken(true);
      downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(targetUrl)}&sig=${encodeURIComponent(freshToken.sig)}`;
      upstreamRes = await fetch(downloadUrl, { headers: FAIZAN_HEADERS });
    }

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'Faizan engine request failed' });
  }
});

// All-in-one Faizan extract endpoint (simplifies client code)
app.get('/api/faizan/extract', async (req: Request, res: Response) => {
  const rawTargetUrl = req.query.url as string;
  if (!rawTargetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  const targetUrl = cleanMediaUrl(rawTargetUrl);

  try {
    const token = await fetchFaizanToken();
    let downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(targetUrl)}&sig=${encodeURIComponent(token.sig)}`;
    let upstreamRes = await fetch(downloadUrl, { headers: FAIZAN_HEADERS });

    if (upstreamRes.status === 403) {
      const fresh = await fetchFaizanToken(true);
      downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(targetUrl)}&sig=${encodeURIComponent(fresh.sig)}`;
      upstreamRes = await fetch(downloadUrl, { headers: FAIZAN_HEADERS });
    }

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'Faizan engine extraction failed' });
  }
});

/* =====================================================================
   Standard Engine (Makki / AllDL) Proxy
   ===================================================================== */
app.get('/api/alldl', async (req: Request, res: Response) => {
  const rawTargetUrl = req.query.url as string;
  if (!rawTargetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  const targetUrl = cleanMediaUrl(rawTargetUrl);

  try {
    const upstreamUrl = `https://ahm7xmakki.com/api/alldl?url=${encodeURIComponent(targetUrl)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'Standard engine proxy request failed' });
  }
});

/* =====================================================================
   Vite Middleware (Dev) vs Static Assets (Prod)
   ===================================================================== */
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SAVEit] Server running at http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[SAVEit] Server failed to start:', err);
  process.exit(1);
});
