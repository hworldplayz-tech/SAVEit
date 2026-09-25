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
  const targetUrl = req.query.url as string;
  let sig = req.query.sig as string;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

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
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

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
   F-Engine 2 (Faizan Khichi AllDL Universal Engine) Integration
   ===================================================================== */
const ALLDL_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Referer': 'https://alldl.faizankhichi.me/',
  'Origin': 'https://alldl.faizankhichi.me',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

// Security config for Turnstile
app.get('/api/f-engine-2/security-config', async (_req: Request, res: Response) => {
  try {
    const upstreamRes = await fetch('https://alldl.faizankhichi.me/api/security/config', {
      headers: ALLDL_HEADERS,
      signal: AbortSignal.timeout(10000)
    });
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: 'Failed to fetch AllDL security config' });
    }
    const data = await upstreamRes.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'F-Engine 2 security config error' });
  }
});

// F-Engine 2 media extraction endpoint
app.post('/api/f-engine-2/media', async (req: Request, res: Response) => {
  const { url, turnstileToken, continuationToken } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" in request body' });
  }

  try {
    const payload: Record<string, any> = { url };
    if (turnstileToken) payload.turnstileToken = turnstileToken;
    if (continuationToken) payload.continuationToken = continuationToken;

    const upstreamRes = await fetch('https://alldl.faizankhichi.me/api/media', {
      method: 'POST',
      headers: ALLDL_HEADERS,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(35000)
    });

    const data = await upstreamRes.json().catch(() => ({}));
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'F-Engine 2 request failed' });
  }
});

// F-Engine 2 stream/download proxy helper
app.get('/api/f-engine-2/stream', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': ALLDL_HEADERS['User-Agent'],
        'Referer': 'https://alldl.faizankhichi.me/'
      }
    });

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    if (upstreamRes.headers.get('content-length')) {
      res.setHeader('Content-Length', upstreamRes.headers.get('content-length')!);
    }

    if (!upstreamRes.body) {
      return res.status(500).send('No response stream');
    }

    // Pipe response
    const reader = upstreamRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    return res.end();
  } catch (err: any) {
    return res.status(502).send(err?.message || 'Proxy error');
  }
});

/* =====================================================================
   Standard Engine (Makki / AllDL) Proxy
   ===================================================================== */
app.get('/api/alldl', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

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
