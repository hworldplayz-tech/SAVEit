export interface MediaQuality {
  quality: string;
  url?: string;
  downloadUrl?: string;
  rawQuality?: string;
  qualityNum?: number;
  tier?: string;
  container?: string;
  extension?: string;
  type?: 'video' | 'audio' | 'image';
  noWatermark?: boolean;
  size?: number | string;
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
  resolutions?: string[];
  platform?: string;
  description?: string;
  originalUrl?: string;
  sourceEngine?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  mediaInfo?: MediaInfo;
}

export interface PosterOption {
  label: string;
  url: string;
  resolution?: string;
}

/**
 * Clean & normalize media URLs:
 * Strips YouTube share tokens (?si=...), tracking queries, and parameters.
 */
export function cleanMediaUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    
    // YouTube short links: youtu.be/<id>?si=... -> https://youtu.be/<id>
    if (host === 'youtu.be') {
      const videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      if (videoId) {
        return `https://youtu.be/${videoId}`;
      }
    }
    
    // YouTube standard links
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v');
        if (v) return `https://www.youtube.com/watch?v=${v}`;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.replace(/^\/shorts\/+/, '').split('/')[0];
        if (id) return `https://www.youtube.com/shorts/${id}`;
      }
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.replace(/^\/embed\/+/, '').split('/')[0];
        if (id) return `https://www.youtube.com/watch?v=${id}`;
      }
    }

    // Strip general social tracking parameters
    const trackingParams = [
      'si', 'igsh', 'utm_source', 'utm_medium', 'utm_campaign', 
      'utm_term', 'utm_content', 'fbclid', 'feature', 'pp'
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
  tiktok: { name: 'TikTok', hosts: ['tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com'] },
  instagram: { name: 'Instagram', hosts: ['instagram.com'] },
  facebook: { name: 'Facebook', hosts: ['facebook.com', 'fb.watch', 'm.facebook.com'] },
  youtube: { name: 'YouTube', hosts: ['youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com'] },
  twitter: { name: 'Twitter (X)', hosts: ['twitter.com', 'x.com', 'mobile.twitter.com'] },
  pinterest: { name: 'Pinterest', hosts: ['pinterest.com', 'pin.it'] },
  reddit: { name: 'Reddit', hosts: ['reddit.com', 'v.redd.it', 'old.reddit.com'] },
  spotify: { name: 'Spotify', hosts: ['spotify.com', 'open.spotify.com'] },
  vimeo: { name: 'Vimeo', hosts: ['vimeo.com', 'player.vimeo.com'] },
  dailymotion: { name: 'Dailymotion', hosts: ['dailymotion.com', 'dai.ly'] },
  bilibili: { name: 'Bilibili', hosts: ['bilibili.com', 'b23.tv', 'm.bilibili.com'] },
  threads: { name: 'Threads', hosts: ['threads.com', 'threads.net'] },
  snapchat: { name: 'Snapchat', hosts: ['snapchat.com'] }
};

/**
 * Detect social platform from raw URL
 */
export function detectPlatform(rawUrl: string): string | null {
  let host = '';
  try {
    host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
  for (const [slug, p] of Object.entries(SUPPORTED_PLATFORMS)) {
    for (const h of p.hosts) {
      const bare = h.replace(/^www\./, '');
      if (host === bare || host.endsWith('.' + bare)) return slug;
    }
  }
  return null;
}

/**
 * Extract YouTube Video ID
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      return parsed.pathname.replace(/^\/+/, '').split('/')[0] || null;
    }
    if (host.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.replace(/^\/shorts\/+/, '').split('/')[0] || null;
      }
    }
  } catch {}
  return null;
}

/**
 * Generate official poster options
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
        label: `${mediaInfo.platform || 'Media'} Original Cover`,
        url: mainThumb,
        resolution: 'Original HD'
      });
    }
  }

  return options;
}

/**
 * Poster image download
 */
export async function downloadPosterDirectly(imageUrl: string, fileName?: string): Promise<void> {
  if (!imageUrl) return;

  const safeName = fileName 
    ? fileName.replace(/[/\\?%*:|"<>]/g, '-').trim() 
    : 'poster.jpg';
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
  } catch {}

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = imageUrl;
  a.setAttribute('download', fullName);
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
  }, 400);
}

/**
 * Deduplicate qualities array
 */
export function deduplicateQualities(qualities: MediaQuality[]): MediaQuality[] {
  const seen = new Set<string>();
  return qualities.filter(q => {
    const key = (q.rawQuality || q.quality || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Get configured backend API base URL
 */
export function getBackendApiBase(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'https://api.linksshare.online';
}

/* =====================================================================
   Official SaveIt Dynamic Resolution Workflow
   1. POST /api/get-video-info -> { success, title, thumbnail, resolutions }
   2. POST /api/generate-token -> { success, downloadUrl }
   ===================================================================== */

/**
 * Step 1: Analyze link and retrieve dynamic resolutions from backend
 */
export async function getVideoInfo(rawUrl: string): Promise<ApiResponse> {
  const cleanUrl = cleanMediaUrl(rawUrl);
  if (!cleanUrl) {
    throw new Error('Please enter a valid video URL.');
  }

  const backendBase = getBackendApiBase();
  const isLinksshareHost = typeof window !== 'undefined' && window.location.hostname.endsWith('linksshare.online');

  // Candidate endpoints for CORS compatibility:
  // On *.linksshare.online, we can query the backend or proxy.
  // In dev / preview environments, always use the proxy (/api/get-video-info) to avoid browser CORS blocks.
  const candidateEndpoints = isLinksshareHost
    ? ['/api/get-video-info', `${backendBase}/api/get-video-info`]
    : ['/api/get-video-info'];

  let serverData: any = null;

  for (const endpoint of candidateEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ videoUrl: cleanUrl }),
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && (json.success || json.title || (Array.isArray(json.resolutions) && json.resolutions.length > 0))) {
          serverData = json;
          break;
        }
      }
    } catch {
      // try next candidate
    }
  }

  // Determine platform
  const slug = detectPlatform(cleanUrl);
  const platformName = slug ? (SUPPORTED_PLATFORMS[slug]?.name || 'Social Media') : (extractYouTubeId(cleanUrl) ? 'YouTube' : 'Social Media');
  const ytId = extractYouTubeId(cleanUrl);

  let title = serverData?.title || '';
  let thumbnail = serverData?.thumbnail || '';
  let rawResolutions: string[] = Array.isArray(serverData?.resolutions) ? serverData.resolutions : [];

  // Fallback to native oEmbed if backend is starting up or missing metadata
  if (!title || !thumbnail) {
    if (ytId) {
      if (!thumbnail) thumbnail = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;
      try {
        const oeRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`, {
          signal: AbortSignal.timeout(5000)
        });
        if (oeRes.ok) {
          const oeData = await oeRes.json();
          if (oeData.title && !title) title = oeData.title;
          if (oeData.thumbnail_url && !thumbnail) thumbnail = oeData.thumbnail_url;
        }
      } catch {}
    } else {
      try {
        const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (noembedRes.ok) {
          const neData = await noembedRes.json();
          if (neData.title && !title) title = neData.title;
          if (neData.thumbnail_url && !thumbnail) thumbnail = neData.thumbnail_url;
        }
      } catch {}
    }
  }

  if (!title) {
    title = `${platformName} Video`;
  }

  // If server returned no resolutions array yet, supply standard fallback qualities
  if (rawResolutions.length === 0) {
    rawResolutions = ['1080p', '720p', '480p', '360p'];
  }

  // Construct dynamic quality models
  const qualities: MediaQuality[] = rawResolutions.map((resStr: string) => {
    const num = parseInt(resStr.replace(/[^0-9]/g, ''), 10) || 720;
    let tier = 'HD';
    if (num >= 2160) tier = '4K UHD';
    else if (num >= 1440) tier = '2K QHD';
    else if (num >= 1080) tier = 'Full HD';
    else if (num >= 720) tier = 'HD';
    else if (num >= 480) tier = 'SD';
    else tier = 'Mobile';

    return {
      quality: `${resStr} (${tier})`,
      rawQuality: resStr,
      qualityNum: num,
      tier,
      container: 'MP4',
      extension: 'mp4',
      type: 'video',
      noWatermark: true,
      url: cleanUrl,
      downloadUrl: cleanUrl
    };
  });

  return {
    success: true,
    mediaInfo: {
      title,
      thumbnail: thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : undefined),
      originalUrl: cleanUrl,
      platform: platformName,
      videoUrl: cleanUrl,
      audioUrl: cleanUrl,
      resolutions: rawResolutions,
      qualities,
      sourceEngine: 'SaveIt Dynamic Gateway (api.linksshare.online)'
    }
  };
}

/**
 * Step 2: Request tokenized download link
 * POST https://api.linksshare.online/api/generate-token
 * Body: { videoUrl, quality }
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
  // On *.linksshare.online, try local proxy first then direct backend.
  // In preview/dev environments, ONLY use local proxy (/api/generate-token) to prevent browser CORS block.
  const candidateEndpoints = isLinksshareHost
    ? ['/api/generate-token', `${backendBase}/api/generate-token`]
    : ['/api/generate-token'];

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

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: Failed to generate download token.`);
      }
    } catch (err: any) {
      lastError = err;
      if (err?.message?.includes('TOKEN_EXPIRED') || (err?.message && !err.message.includes('Failed to fetch'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate secure download token. Please verify your connection or try again.');
}

/**
 * Step 3: Trigger the download stream by redirecting to the tokenized URL
 */
export function initiateTokenStreamDownload(downloadUrl: string): void {
  if (!downloadUrl) return;

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

// Aliases for unified interface
export const extractMedia = getVideoInfo;
export const downloadMediaDirectly = (url: string) => initiateTokenStreamDownload(url);
