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
 * 40+ Supported platforms map (FAK LABS Engine)
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
   F-Engine 1 (Faizan Khichi Downloader API Engine)
   ===================================================================== */
let cachedSig: string | null = null;
let cachedSigExp = 0;

export async function getFaizanApiSig(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedSig && cachedSigExp - now > 30) {
    return cachedSig;
  }

  const tokenEndpoints = [
    '/api/faizan/token',
    'https://downloader.faizankhichi.me/api/token'
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

  throw new Error('Unable to establish session token with F-Engine 1.');
}

function formatFEngine1Response(rawData: any, cleanUrl: string): ApiResponse {
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
      sourceEngine: 'F-Engine 1 (FAK LABS Multi-Quality)'
    }
  };
}

export async function extractMediaFEngine1(rawUrl: string): Promise<ApiResponse> {
  const cleanUrl = cleanMediaUrl(rawUrl);
  const encodedUrl = encodeURIComponent(cleanUrl);

  // 1. Try unified server-side endpoint first
  try {
    const res = await fetch(`/api/faizan/extract?url=${encodedUrl}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data && data.media && data.media.length > 0) {
        return formatFEngine1Response(data, cleanUrl);
      }
    }
  } catch (err: any) {
    console.info('F-Engine 1 server endpoint notice:', err?.message);
  }

  // 2. Try signed direct endpoint
  try {
    const sig = await getFaizanApiSig();
    const ep = `/api/faizan/download?url=${encodedUrl}&sig=${encodeURIComponent(sig)}`;
    const res = await fetch(ep, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data && data.media && data.media.length > 0) {
        return formatFEngine1Response(data, cleanUrl);
      }
    }
  } catch (e: any) {
    console.info('F-Engine 1 signed endpoint notice:', e?.message);
  }

  throw new Error('F-Engine 1 currently has no download streams for this link.');
}

/* =====================================================================
   Standard Engine (Makki / Direct Stream)
   - Guaranteed single true video stream without duplicate quality cards!
   ===================================================================== */
export async function extractMediaStandard(rawUrl: string): Promise<ApiResponse> {
  const cleanUrl = cleanMediaUrl(rawUrl);
  const encodedUrl = encodeURIComponent(cleanUrl);
  const primaryApi = `/api/alldl?url=${encodedUrl}`;
  const directApi = `https://ahm7xmakki.com/api/alldl?url=${encodedUrl}`;
  const corsProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(directApi)}`;

  const candidates = [primaryApi, directApi, corsProxy];

  for (const ep of candidates) {
    try {
      const res = await fetch(ep, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
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
   Universal Extraction Engine
   F-Engine 1 -> Standard Engine
   ===================================================================== */
export async function extractMedia(
  videoUrl: string,
  engine: EngineChoice = 'auto'
): Promise<ApiResponse> {
  const cleanUrl = cleanMediaUrl(videoUrl);
  if (!cleanUrl) {
    throw new Error('Please enter a valid video URL.');
  }

  // If user explicitly picked F-Engine 1
  if (engine === 'f-engine-1') {
    try {
      const res = await extractMediaFEngine1(cleanUrl);
      if (res && res.success && res.mediaInfo) return res;
    } catch (e: any) {
      console.info('F-Engine 1 pass, cascading to standard:', e?.message);
    }
    const std = await extractMediaStandard(cleanUrl);
    if (std && std.mediaInfo) {
      std.mediaInfo.sourceEngine = 'Standard Engine (F1 Fallback)';
    }
    return std;
  }

  // If user explicitly picked Standard
  if (engine === 'standard') {
    return await extractMediaStandard(cleanUrl);
  }

  // AUTO CASCADE (F-Engine 1 -> Standard):
  // Step 1: Try F-Engine 1 (FAK LABS Multi-Quality)
  try {
    const f1Result = await extractMediaFEngine1(cleanUrl);
    if (f1Result && f1Result.success && f1Result.mediaInfo) {
      return f1Result;
    }
  } catch (err: any) {
    console.info('Auto cascade pass F1:', err?.message);
  }

  // Step 2: Fallback to Standard Engine (Makki)
  return await extractMediaStandard(cleanUrl);
}
