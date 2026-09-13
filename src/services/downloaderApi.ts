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
