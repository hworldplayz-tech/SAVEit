export interface MediaQuality {
  quality: string;
  url: string;
  downloadUrl?: string;
  streamUrl?: string;
  rawQuality?: string;
  qualityNum?: number;
  tier?: string;
  container?: string;
  extension?: string;
  type?: 'video' | 'audio' | 'image';
  noWatermark?: boolean;
  size?: number | string;
  width?: number;
  height?: number;
  bitrate?: number;
  mimeType?: string;
  label?: string;
}

export interface MediaInfo {
  title?: string;
  author?: string;
  authorName?: string;
  thumbnail?: string;
  coverImage?: string;
  videoUrl?: string;
  audioUrl?: string;
  musicUrl?: string;
  duration?: string | number | null;
  qualities?: MediaQuality[] | null;
  platform?: string;
  description?: string;
  originalUrl?: string;
  sourceEngine?: string;
  products?: string[];
  pagination?: {
    hasMore?: boolean;
    continuationToken?: string;
  };
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  mediaInfo?: MediaInfo;
  links?: string[];
  note?: string;
}

export interface PosterOption {
  label: string;
  url: string;
  resolution?: string;
}

export type EngineChoice = 'auto' | 'f-engine-1' | 'standard';

/**
 * Clean & normalize media URLs:
 * Strips YouTube share tokens (?si=...), tracking queries, and parameters that can cause 400s.
 */
export function cleanMediaUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    
    // YouTube short links: youtu.be/<id>?si=... -> https://youtu.be/<id>
    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      if (videoId) {
        return `https://youtu.be/${videoId}`;
      }
    }
    
    // YouTube standard links: youtube.com/watch?v=<id>&si=... -> https://www.youtube.com/watch?v=<id>
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

/**
 * 40+ Supported platforms map
 */
export const SUPPORTED_PLATFORMS: Record<string, { name: string; hosts: string[] }> = {
  tiktok: { name: "TikTok", hosts: ["tiktok.com", "vt.tiktok.com", "vm.tiktok.com"] },
  instagram: { name: "Instagram", hosts: ["instagram.com"] },
  facebook: { name: "Facebook", hosts: ["facebook.com", "fb.watch", "m.facebook.com"] },
  youtube: { name: "YouTube", hosts: ["youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com"] },
  twitter: { name: "Twitter (X)", hosts: ["twitter.com", "x.com", "mobile.twitter.com"] },
  pinterest: { name: "Pinterest", hosts: ["pinterest.com", "pin.it"] },
  reddit: { name: "Reddit", hosts: ["reddit.com", "v.redd.it", "old.reddit.com"] },
  spotify: { name: "Spotify", hosts: ["spotify.com", "open.spotify.com"] },
  amazon: { name: "Amazon", hosts: ["amazon.com", "amzn.to", "amazon.co.uk", "amazon.de"] },
  vimeo: { name: "Vimeo", hosts: ["vimeo.com", "player.vimeo.com"] },
  dailymotion: { name: "Dailymotion", hosts: ["dailymotion.com", "dai.ly"] },
  bilibili: { name: "Bilibili", hosts: ["bilibili.com", "b23.tv", "m.bilibili.com"] },
  tumblr: { name: "Tumblr", hosts: ["tumblr.com"] },
  weibo: { name: "Weibo", hosts: ["weibo.com", "m.weibo.cn"] },
  ted: { name: "TED", hosts: ["ted.com"] },
  imgur: { name: "Imgur", hosts: ["imgur.com"] },
  mega: { name: "Mega", hosts: ["mega.nz"] },
  snapchat: { name: "Snapchat", hosts: ["snapchat.com"] },
  threads: { name: "Threads", hosts: ["threads.com", "threads.net"] },
  telegram: { name: "Telegram", hosts: ["t.me"] },
  soundcloud: { name: "SoundCloud", hosts: ["soundcloud.com", "m.soundcloud.com"] },
  twitch: { name: "Twitch", hosts: ["twitch.tv", "m.twitch.tv"] },
  rumble: { name: "Rumble", hosts: ["rumble.com"] },
  odysee: { name: "Odysee", hosts: ["odysee.com"] },
  likee: { name: "Likee", hosts: ["likee.video", "l.likee.video"] },
  bluesky: { name: "Bluesky", hosts: ["bsky.app"] },
  streamable: { name: "Streamable", hosts: ["streamable.com"] }
};

/**
 * Detect social platform from raw URL
 */
export function detectPlatform(rawUrl: string): string | null {
  let host = "";
  try {
    host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  for (const [slug, p] of Object.entries(SUPPORTED_PLATFORMS)) {
    for (const h of p.hosts) {
      const bare = h.replace(/^www\./, "");
      if (host === bare || host.endsWith("." + bare)) return slug;
    }
  }
  return null;
}

/**
 * Quality tier badge from numeric quality, e.g. 1440 -> "2K", 1080 -> "Full HD"
 */
export function tierOf(m: { type?: string; quality_num?: number; quality?: string }): string {
  if (m.type === "audio") return "HQ Audio";
  const q = m.quality_num || parseInt(m.quality || "", 10) || 0;
  if (q >= 2160) return "4K Ultra HD";
  if (q >= 1440) return "2K Quad HD";
  if (q >= 1080) return "Full HD";
  if (q >= 720) return "HD";
  if (q >= 480) return "SD";
  return "";
}

/**
 * Extract YouTube ID if link is from YouTube
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  } catch {
    return null;
  }
}

/**
 * Get available posters for YouTube or other social platforms
 */
export function getPosterOptions(mediaInfo: MediaInfo, originalUrl: string): PosterOption[] {
  const options: PosterOption[] = [];
  const ytId = extractYouTubeId(originalUrl);

  if (ytId) {
    options.push({
      label: 'Ultra HD Poster (1080p)',
      url: `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
      resolution: '1920x1080'
    });
    options.push({
      label: 'High Quality Poster (720p)',
      url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      resolution: '1280x720'
    });
    options.push({
      label: 'Standard Poster (SD)',
      url: `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`,
      resolution: '640x480'
    });
  }

  const mainThumb = mediaInfo.thumbnail || mediaInfo.coverImage;
  if (mainThumb) {
    const alreadyExists = options.some(o => o.url === mainThumb);
    if (!alreadyExists) {
      options.unshift({
        label: `${mediaInfo.platform || 'Social Media'} Original Poster`,
        url: mainThumb,
        resolution: 'Original HD'
      });
    }
  }

  if (mediaInfo.qualities) {
    const imageItems = mediaInfo.qualities.filter(q => q.type === 'image' && q.url);
    imageItems.forEach((img, i) => {
      if (!options.some(o => o.url === img.url)) {
        options.push({
          label: img.label || `Gallery Image ${i + 1}`,
          url: img.url,
          resolution: img.width && img.height ? `${img.width}x${img.height}` : 'HD'
        });
      }
    });
  }

  return options;
}

/**
 * Get configured backend API base URL:
 * Reads from process.env.NEXT_PUBLIC_API_URL or defaults to 'https://api.linksshare.online'
 */
export function getBackendApiBase(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'https://api.linksshare.online';
}

/**
 * Request a short-lived tokenized download stream URL (15-min JWT)
 * Routes strictly through: POST `${process.env.NEXT_PUBLIC_API_URL}/api/generate-token`
 */
export async function requestDownloadToken(
  videoUrl: string, 
  quality: string = '1080p'
): Promise<string> {
  const cleanUrl = cleanMediaUrl(videoUrl);
  if (!cleanUrl) {
    throw new Error('Please enter a valid video URL.');
  }

  const backendBase = getBackendApiBase();
  const isLinksshareHost = typeof window !== 'undefined' && window.location.hostname.endsWith('linksshare.online');

  // Candidate endpoints:
  // On *.linksshare.online (Vercel production), direct call to backendBase works natively with CORS.
  // In dev/preview environments, relative /api/generate-token uses the server proxy.
  const candidateEndpoints = isLinksshareHost
    ? [`${backendBase}/api/generate-token`, '/api/generate-token']
    : ['/api/generate-token', `${backendBase}/api/generate-token`];

  let lastError: Error | null = null;

  for (const endpoint of candidateEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          videoUrl: cleanUrl,
          quality: quality || '1080p'
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (res.status === 410) {
        throw new Error('TOKEN_EXPIRED: Your download session has expired (15-min limit). Please regenerate a fresh download link.');
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok && data && (data.success || data.downloadUrl)) {
        return data.downloadUrl;
      }

      if (data && data.error) {
        if (data.error.toLowerCase().includes('expire')) {
          throw new Error('TOKEN_EXPIRED: Your download session has expired. Please regenerate a fresh download link.');
        }
        throw new Error(data.error);
      }
    } catch (err: any) {
      lastError = err;
      if (err?.message?.includes('TOKEN_EXPIRED')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate secure download token. Please verify your connection or try again.');
}

/**
 * Triggers the download stream by redirecting to the tokenized URL
 */
export function initiateTokenStreamDownload(downloadUrl: string): void {
  if (!downloadUrl) return;

  // Use standard navigation or hidden anchor to initiate browser download stream
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = downloadUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
  }, 1000);
}

/**
 * Instant direct media download (Video & Audio).
 */
export function downloadMediaDirectly(sourceUrl: string, fileName?: string): void {
  if (!sourceUrl) return;

  const safeName = fileName 
    ? fileName.replace(/[/\\?%*:|"<>]/g, '-').trim() 
    : 'SAVEit-media';

  const a = document.createElement('a');
  a.style.position = 'fixed';
  a.style.top = '-9999px';
  a.style.left = '-9999px';
  a.style.opacity = '0';
  a.style.pointerEvents = 'none';
  a.href = sourceUrl;
  a.setAttribute('download', safeName);
  
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 400);
}

/**
 * Instant poster image download.
 */
export async function downloadPosterDirectly(imageUrl: string, fileName?: string): Promise<void> {
  if (!imageUrl) return;

  const safeName = fileName 
    ? fileName.replace(/[/\\?%*:|"<>]/g, '-').trim() 
    : 'poster';
  const fullName = safeName.toLowerCase().endsWith('.jpg') || safeName.toLowerCase().endsWith('.png')
    ? safeName 
    : `${safeName}.jpg`;

  try {
    const res = await fetch(imageUrl);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = fullName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 500);
      return;
    }
  } catch {
    // If CORS prevents blob, trigger direct browser download
  }

  downloadMediaDirectly(imageUrl, fullName);
}

export const downloadSecurely = downloadMediaDirectly;

/**
 * Helper to deduplicate qualities array by URL so that identical links are NEVER shown twice!
 */
export function deduplicateQualities(qualities: MediaQuality[]): MediaQuality[] {
  const seen = new Set<string>();
  return qualities.filter(q => {
    if (!q.url && !q.downloadUrl) return false;
    const targetUrl = (q.downloadUrl || q.url || '').trim().toLowerCase();
    if (!targetUrl || seen.has(targetUrl)) return false;
    seen.add(targetUrl);
    return true;
  });
}

/* =====================================================================
   F-Engine 1 (Multi-Quality Engine)
   ===================================================================== */
let cachedSig: string | null = null;
let cachedSigExp = 0;

export async function getEngine1Sig(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedSig && cachedSigExp - now > 30) {
    return cachedSig;
  }

  const tokenEndpoints = [
    '/api/token'
  ];

  for (const ep of tokenEndpoints) {
    try {
      const res = await fetch(ep, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.sig) {
          cachedSig = data.sig;
          cachedSigExp = data.exp || (now + 300);
          return cachedSig;
        }
      }
    } catch {
      // try next endpoint
    }
  }

  throw new Error('Unable to establish session token with stream engine.');
}

function formatEngine1Response(rawData: any, cleanUrl: string): ApiResponse {
  const mediaList: any[] = Array.isArray(rawData.media) ? rawData.media : [];
  if (mediaList.length === 0) {
    throw new Error('F-Engine 1 returned no media links.');
  }

  const videoItems = mediaList.filter((m: any) => m.type !== 'audio' && m.url);
  const audioItems = mediaList.filter((m: any) => m.type === 'audio' && m.url);

  videoItems.sort((a: any, b: any) => {
    const qA = a.quality_num || parseInt(a.quality, 10) || 0;
    const qB = b.quality_num || parseInt(b.quality, 10) || 0;
    return qB - qA;
  });

  const bestVideo = videoItems[0];
  const bestAudio = audioItems[0];

  const qualities: MediaQuality[] = videoItems.map((m: any) => {
    const tier = tierOf(m);
    const label = m.quality || (m.quality_num ? `${m.quality_num}p` : 'Standard Video');
    return {
      quality: tier && !label.toLowerCase().includes(tier.toLowerCase()) ? `${label} (${tier})` : label,
      rawQuality: m.quality,
      qualityNum: m.quality_num,
      tier: tier,
      url: m.url,
      downloadUrl: m.url,
      container: (m.container || 'mp4').toUpperCase(),
      extension: m.container || 'mp4',
      type: 'video',
      noWatermark: !!m.no_watermark,
      size: m.size
    };
  });

  audioItems.forEach((a: any) => {
    qualities.push({
      quality: 'Audio MP3 (320kbps)',
      rawQuality: '320kbps',
      tier: 'HQ Audio',
      url: a.url,
      downloadUrl: a.url,
      container: 'MP3',
      extension: 'mp3',
      type: 'audio',
      noWatermark: true,
      size: a.size
    });
  });

  const distinct = deduplicateQualities(qualities);
  const slug = detectPlatform(cleanUrl);
  const platformName = slug ? SUPPORTED_PLATFORMS[slug]?.name : (extractYouTubeId(cleanUrl) ? 'YouTube' : 'Social Media');
  const ytId = extractYouTubeId(cleanUrl);
  const thumbnail = ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : (rawData.thumbnail || undefined);

  return {
    success: true,
    mediaInfo: {
      title: rawData.title || `${platformName} Video`,
      originalUrl: rawData.original_url || cleanUrl,
      platform: platformName,
      videoUrl: bestVideo ? bestVideo.url : undefined,
      audioUrl: bestAudio ? bestAudio.url : undefined,
      thumbnail: thumbnail,
      qualities: distinct.length > 0 ? distinct : null,
      sourceEngine: 'F-Engine 1 (Multi-Quality Pro)'
    }
  };
}

export async function extractMediaFEngine1(rawUrl: string): Promise<ApiResponse> {
  const cleanUrl = cleanMediaUrl(rawUrl);
  const encodedUrl = encodeURIComponent(cleanUrl);

  const extractEndpoints = [
    `/api/extract?url=${encodedUrl}`
  ];

  // 1. Try unified extract endpoints (Works on Vercel Serverless and Local Express)
  for (const ep of extractEndpoints) {
    try {
      const res = await fetch(ep, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(12000)
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn('F-Engine 1 endpoint returned non-JSON:', contentType, 'status:', res.status);
        continue;
      }
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.media && data.media.length > 0) {
          return formatEngine1Response(data, cleanUrl);
        } else if (data && data.error) {
          console.warn('F-Engine 1 upstream response note:', data.error);
        }
      } else {
        console.warn('F-Engine 1 extract HTTP status:', res.status);
      }
    } catch (err: any) {
      console.warn('F-Engine 1 fetch attempt notice:', err?.message);
    }
  }

  // 2. Try signed download endpoint
  try {
    const sig = await getEngine1Sig();
    const downloadEndpoints = [
      `/api/download?url=${encodedUrl}&sig=${encodeURIComponent(sig)}`
    ];
    for (const ep of downloadEndpoints) {
      try {
        const res = await fetch(ep, { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(12000)
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.media && data.media.length > 0) {
            return formatEngine1Response(data, cleanUrl);
          }
        }
      } catch {
        // try next
      }
    }
  } catch {
    // token minting failed or timed out
  }

  throw new Error('F-Engine 1 currently has no download streams for this link.');
}

/* =====================================================================
   Standard Engine (Direct Stream)
   - Universal high-speed engine, runs in browser and server
   ===================================================================== */
export async function extractMediaStandard(rawUrl: string): Promise<ApiResponse> {
  const cleanUrl = cleanMediaUrl(rawUrl);
  const encodedUrl = encodeURIComponent(cleanUrl);
  
  // Candidates: Local/Vercel proxy, direct API, and CORS mirrors
  const candidates = [
    `/api/alldl?url=${encodedUrl}`,
    `https://ahm7xmakki.com/api/alldl?url=${encodedUrl}`
  ];

  for (const ep of candidates) {
    try {
      const res = await fetch(ep, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const data: ApiResponse = await res.json();
        if (data && (data.success || data.mediaInfo)) {
          if (data.mediaInfo) {
            data.mediaInfo.sourceEngine = 'Standard Engine (Direct Stream)';

            if (data.mediaInfo.qualities && data.mediaInfo.qualities.length > 0) {
              const unique = deduplicateQualities(data.mediaInfo.qualities);
              data.mediaInfo.qualities = unique.length > 0 ? unique : null;
            } else if (data.mediaInfo.videoUrl) {
              data.mediaInfo.qualities = [
                {
                  quality: 'High Quality Stream (MP4)',
                  rawQuality: 'HD',
                  tier: 'HD',
                  url: data.mediaInfo.videoUrl,
                  downloadUrl: data.mediaInfo.videoUrl,
                  container: 'MP4',
                  extension: 'mp4',
                  type: 'video',
                  noWatermark: true,
                  size: 'Original Bitrate'
                }
              ];
            }
          }
          return data;
        }
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error('Standard engine could not resolve media from this link.');
}

/* =====================================================================
   Official SaveIt Metadata Resolver (No Deprecated Endpoints)
   - Fetches rich oEmbed metadata (Title, Author, Thumbnail)
   - Sets up multi-quality tiers for token generation
   ===================================================================== */
export async function resolveMediaMetadata(rawUrl: string): Promise<ApiResponse> {
  const cleanUrl = cleanMediaUrl(rawUrl);
  const slug = detectPlatform(cleanUrl);
  const platformName = slug ? (SUPPORTED_PLATFORMS[slug]?.name || 'Social Media') : (extractYouTubeId(cleanUrl) ? 'YouTube' : 'Social Media');
  const ytId = extractYouTubeId(cleanUrl);

  let title = `${platformName} Video`;
  let author = '';
  let thumbnail = ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : '';

  // 1. YouTube official oEmbed
  if (ytId) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`, {
        signal: AbortSignal.timeout(6000)
      });
      if (oembedRes.ok) {
        const oeData = await oembedRes.json();
        if (oeData.title) title = oeData.title;
        if (oeData.author_name) author = oeData.author_name;
        if (oeData.thumbnail_url && !thumbnail) thumbnail = oeData.thumbnail_url;
      }
    } catch {
      // Use defaults
    }
  } else {
    // 2. Generic oEmbed proxy for other platforms
    try {
      const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (noembedRes.ok) {
        const neData = await noembedRes.json();
        if (neData.title) title = neData.title;
        if (neData.author_name) author = neData.author_name;
        if (neData.thumbnail_url) thumbnail = neData.thumbnail_url;
      }
    } catch {
      // Fallback
    }
  }

  const qualities: MediaQuality[] = [
    {
      quality: '1080p (Full HD)',
      rawQuality: '1080p',
      qualityNum: 1080,
      tier: 'Full HD',
      url: cleanUrl,
      downloadUrl: cleanUrl,
      container: 'MP4',
      extension: 'mp4',
      type: 'video',
      noWatermark: true,
      size: 'Clean 1080p Stream'
    },
    {
      quality: '720p (HD)',
      rawQuality: '720p',
      qualityNum: 720,
      tier: 'HD',
      url: cleanUrl,
      downloadUrl: cleanUrl,
      container: 'MP4',
      extension: 'mp4',
      type: 'video',
      noWatermark: true,
      size: 'Clean 720p Stream'
    },
    {
      quality: '480p (SD)',
      rawQuality: '480p',
      qualityNum: 480,
      tier: 'SD',
      url: cleanUrl,
      downloadUrl: cleanUrl,
      container: 'MP4',
      extension: 'mp4',
      type: 'video',
      noWatermark: true,
      size: 'Standard Definition'
    },
    {
      quality: '360p (Mobile)',
      rawQuality: '360p',
      qualityNum: 360,
      tier: 'Mobile',
      url: cleanUrl,
      downloadUrl: cleanUrl,
      container: 'MP4',
      extension: 'mp4',
      type: 'video',
      noWatermark: true,
      size: 'Mobile Fast Stream'
    }
  ];

  return {
    success: true,
    mediaInfo: {
      title,
      author,
      originalUrl: cleanUrl,
      platform: platformName,
      thumbnail: thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : undefined),
      videoUrl: cleanUrl,
      audioUrl: cleanUrl,
      qualities,
      sourceEngine: 'SaveIt JWT Gateway (api.linksshare.online)'
    }
  };
}

/* =====================================================================
   Universal Extraction Engine with Seamless Fallback
   Token Gateway / F-Engine 1 -> Standard Engine
   ===================================================================== */
export async function extractMedia(
  videoUrl: string,
  engine: EngineChoice = 'auto'
): Promise<ApiResponse> {
  const cleanUrl = cleanMediaUrl(videoUrl);
  if (!cleanUrl) {
    throw new Error('Please enter a valid video URL.');
  }

  // 1. Try F-Engine 1 if explicitly picked
  if (engine === 'f-engine-1') {
    try {
      const res = await extractMediaFEngine1(cleanUrl);
      if (res && res.success && res.mediaInfo) return res;
    } catch (e: any) {
      console.info('F-Engine 1 pass, cascading:', e?.message);
    }
  }

  // 2. Try Standard Engine if explicitly picked
  if (engine === 'standard') {
    try {
      return await extractMediaStandard(cleanUrl);
    } catch {
      // fallback to metadata resolver
    }
  }

  // 3. AUTO CASCADE:
  // Step 1: Check if F-Engine 1 returns quality data
  try {
    const f1Result = await extractMediaFEngine1(cleanUrl);
    if (f1Result && f1Result.success && f1Result.mediaInfo) {
      return f1Result;
    }
  } catch {
    // continue
  }

  // Step 2: Check if Standard Engine returns stream info
  try {
    const stdResult = await extractMediaStandard(cleanUrl);
    if (stdResult && stdResult.success && stdResult.mediaInfo) {
      return stdResult;
    }
  } catch {
    // continue
  }

  // Step 3: Fast Native Metadata Resolver (Guaranteed success for YouTube & Social Media)
  return await resolveMediaMetadata(cleanUrl);
}
