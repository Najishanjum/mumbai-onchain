// Vercel Serverless Function: Official X API v2 Profile Fetcher

interface XUserResponse {
  data?: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    description?: string;
    location?: string;
    url?: string;
  };
  errors?: Array<{ detail: string; title: string }>;
}

// In-memory cache with 15-minute TTL per serverless instance
const profileCache = new Map<string, { profile: any; expiry: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function normalizeAvatar(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  if (rawUrl.includes('_normal.')) {
    return rawUrl.replace('_normal.', '_400x400.');
  }
  return rawUrl;
}

export default async function handler(req: any, res: any) {
  // Set CORS and JSON headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawUsername = req.query?.username || '';
  const cleanUsername = String(rawUsername).trim().replace(/^@+/, '').trim();

  // 1. Validation
  if (!cleanUsername) {
    return res.status(400).json({ error: 'Please enter a valid X username.' });
  }

  if (!/^[A-Za-z0-9_]{1,15}$/.test(cleanUsername)) {
    return res.status(400).json({ error: 'Please enter a valid X username (1-15 characters, letters, numbers, and underscores only).' });
  }

  const cacheKey = cleanUsername.toLowerCase();
  const now = Date.now();

  // 2. Cache check
  const cached = profileCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    return res.status(200).json({
      success: true,
      profile: cached.profile
    });
  }

  // 3. Security: Read Token from Server Environment
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    // Graceful diagnostic response without exposing internal credentials
    return res.status(500).json({
      error: 'X API token is not configured on the server. Please set X_BEARER_TOKEN.'
    });
  }

  // 4. Official X API v2 URL
  const xApiUrl = `https://api.x.com/2/users/by/username/${encodeURIComponent(cleanUsername)}?user.fields=id,name,username,profile_image_url,description,location,url`;

  try {
    const response = await fetch(xApiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'application/json'
      }
    });

    if (response.status === 404) {
      return res.status(404).json({ error: 'X profile not found.' });
    }

    if (response.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }

    if (response.status === 401 || response.status === 403) {
      return res.status(502).json({ error: 'X API authentication or access issue. Please verify server token permissions.' });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: 'We could not access X right now. Please try again.' });
    }

    const payload: XUserResponse = await response.json();

    if (!payload.data) {
      return res.status(404).json({ error: 'X profile not found.' });
    }

    const user = payload.data;
    const normalizedProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: normalizeAvatar(user.profile_image_url),
      bio: user.description || '',
      location: user.location || '',
      url: user.url || `https://x.com/${user.username}`
    };

    // Store in instance cache
    profileCache.set(cacheKey, {
      profile: normalizedProfile,
      expiry: now + CACHE_TTL_MS
    });

    return res.status(200).json({
      success: true,
      profile: normalizedProfile
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Unable to connect to X at this moment. Please try again.'
    });
  }
}
