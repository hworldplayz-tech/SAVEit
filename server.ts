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
   F-Engine 1 Server-Side Integration
   ===================================================================== */
let cachedEngine1Sig: string | null = null;
let cachedEngine1Exp = 0;

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

const ENGINE1_HEADERS = {
  'Accept': 'application/json',
  'Referer': 'https://downloader.faizankhichi.me/',
  'Origin': 'https://downloader.faizankhichi.me',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

async function fetchEngine1Token(forceFresh = false): Promise<{ sig: string; exp: number }> {
  const now = Math.floor(Date.now() / 1000);
  if (!forceFresh && cachedEngine1Sig && (cachedEngine1Exp - now > 30)) {
    return { sig: cachedEngine1Sig, exp: cachedEngine1Exp };
  }

  const res = await fetch('https://downloader.faizankhichi.me/api/token', {
    headers: ENGINE1_HEADERS
  });

  if (!res.ok) {
    throw new Error(`Failed to mint session token from stream engine: ${res.statusText}`);
  }

  const data = await res.json() as any;
  if (!data || !data.sig) {
    throw new Error('Invalid token response from stream engine');
  }

  cachedEngine1Sig = data.sig;
  cachedEngine1Exp = data.exp || (now + 300);
  return { sig: cachedEngine1Sig, exp: cachedEngine1Exp };
}

// Token route
const tokenHandler = async (_req: Request, res: Response) => {
  try {
    const token = await fetchEngine1Token();
    return res.json(token);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'Token minting failed' });
  }
};
app.get('/api/token', tokenHandler);
app.get('/api/faizan/token', tokenHandler);

// Download proxy route
const downloadHandler = async (req: Request, res: Response) => {
  const rawTargetUrl = req.query.url as string;
  let sig = req.query.sig as string;

  if (!rawTargetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  const targetUrl = cleanMediaUrl(rawTargetUrl);

  try {
    if (!sig) {
      const token = await fetchEngine1Token();
      sig = token.sig;
    }

    let downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(targetUrl)}&sig=${encodeURIComponent(sig)}`;
    let upstreamRes = await fetch(downloadUrl, { headers: ENGINE1_HEADERS });

    if (upstreamRes.status === 403) {
      cachedEngine1Sig = null;
      const freshToken = await fetchEngine1Token(true);
      downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(targetUrl)}&sig=${encodeURIComponent(freshToken.sig)}`;
      upstreamRes = await fetch(downloadUrl, { headers: ENGINE1_HEADERS });
    }

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'Engine request failed' });
  }
};
app.get('/api/download', downloadHandler);
app.get('/api/faizan/download', downloadHandler);

// All-in-one extract endpoint
const extractHandler = async (req: Request, res: Response) => {
  const rawTargetUrl = (req.query.url as string) || (req.body && req.body.url);
  if (!rawTargetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  const targetUrl = cleanMediaUrl(rawTargetUrl);

  try {
    const token = await fetchEngine1Token();
    let downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(targetUrl)}&sig=${encodeURIComponent(token.sig)}`;
    let upstreamRes = await fetch(downloadUrl, { headers: ENGINE1_HEADERS });

    if (upstreamRes.status === 403) {
      const fresh = await fetchEngine1Token(true);
      downloadUrl = `https://downloader.faizankhichi.me/api/download?url=${encodeURIComponent(targetUrl)}&sig=${encodeURIComponent(fresh.sig)}`;
      upstreamRes = await fetch(downloadUrl, { headers: ENGINE1_HEADERS });
    }

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'Engine extraction failed' });
  }
};
app.get('/api/extract', extractHandler);
app.post('/api/extract', extractHandler);
app.get('/api/faizan/extract', extractHandler);

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
