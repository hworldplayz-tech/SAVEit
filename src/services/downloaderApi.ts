export interface MediaQuality {
  quality: string;
  url: string;
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

  // Add primary thumbnail or cover image if available
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

  return options;
}

/**
 * Instant direct media download (Video & Audio).
 * Triggers the browser's native download manager immediately without buffering
 * whole files into memory, and without popup blocking or blank new tabs.
 */
export function downloadMediaDirectly(sourceUrl: string, fileName?: string): void {
  if (!sourceUrl) return;

  const safeName = fileName 
    ? fileName.replace(/[/\\?%*:|"<>]/g, '-').trim() 
    : 'SAVEit-media';

  // 1. Create ephemeral anchor element
  const a = document.createElement('a');
  a.style.position = 'fixed';
  a.style.top = '-9999px';
  a.style.left = '-9999px';
  a.style.opacity = '0';
  a.style.pointerEvents = 'none';
  a.href = sourceUrl;
  a.setAttribute('download', safeName);
  
  // NEVER use target="_blank" - target="_blank" triggers mobile browser popup blockers!
  // Since the media server sends Content-Disposition: attachment, clicking this anchor in the same frame
  // immediately hands off to the native browser download manager without navigating away from the page.
  document.body.appendChild(a);
  a.click();

  // Safely remove after dispatch
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 300);
}

/**
 * Instant poster image download.
 * Since images are tiny (~50-100KB), we fetch via blob for a clean .jpg save,
 * or fallback to direct download anchor if CORS applies.
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

// Backward compatibility alias
export const downloadSecurely = downloadMediaDirectly;

/**
 * Robust extraction utility that tries:
 * 1. Local/Vercel edge proxy (/api/alldl)
 * 2. Direct vendor API (https://ahm7xmakki.com/api/alldl)
 * 3. Public CORS proxy fallback (if browser environment blocks direct requests)
 */
export async function extractMedia(videoUrl: string): Promise<ApiResponse> {
  const cleanUrl = videoUrl.trim();
  if (!cleanUrl) {
    throw new Error('Please enter a valid video URL.');
  }

  const encodedUrl = encodeURIComponent(cleanUrl);
  const primaryApi = `/api/alldl?url=${encodedUrl}`;
  const directApi = `https://ahm7xmakki.com/api/alldl?url=${encodedUrl}`;

  // Strategy 1: Local or Vercel proxy
  try {
    const res = await fetch(primaryApi, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data: ApiResponse = await res.json();
      if (data && (data.success || data.mediaInfo)) {
        return data;
      }
    }
  } catch {
    // Proceed to next fallback
  }

  // Strategy 2: Direct request to provider API
  try {
    const res = await fetch(directApi, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data: ApiResponse = await res.json();
      if (data && (data.success || data.mediaInfo)) {
        return data;
      }
    }
  } catch {
    // Proceed to fallback
  }

  // Strategy 3: Public CORS-safe proxy fallback
  try {
    const corsProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(directApi)}`;
    const res = await fetch(corsProxy, {
      method: 'GET',
    });

    if (res.ok) {
      const data: ApiResponse = await res.json();
      if (data && (data.success || data.mediaInfo)) {
        return data;
      }
    }
  } catch {
    // Fallthrough to standard error
  }

  throw new Error('Unable to extract media from this link. Please check that the URL is public and supported, or try again.');
}
