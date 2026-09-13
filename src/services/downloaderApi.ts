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
 * Trigger masked download without exposing static href links in the DOM
 */
export async function downloadSecurely(sourceUrl: string, fileName: string): Promise<void> {
  if (!sourceUrl) return;

  // Clean filename
  const safeName = fileName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'media';

  // Strategy 1: Fetch as blob to download cleanly via in-memory object URL
  try {
    const res = await fetch(sourceUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      return;
    }
  } catch {
    // If CORS blocks direct blob stream, proceed to transient trigger
  }

  // Strategy 2: Ephemeral DOM node removed immediately after dispatch
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = sourceUrl;
  a.setAttribute('download', safeName);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 100);
}

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
