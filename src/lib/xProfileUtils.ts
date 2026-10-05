// Shared utilities for X profile validation, normalization, and MOC ID generation

export interface NormalizedXProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string;
  location: string;
  url: string;
}

export function cleanUsername(input: string): string {
  if (!input) return '';
  return input.trim().replace(/^@+/, '').trim();
}

export function isValidXUsername(username: string): boolean {
  const clean = cleanUsername(username);
  if (!clean) return false;
  // X usernames must be 1 to 15 characters, containing only A-Z, a-z, 0-9, and _
  return /^[A-Za-z0-9_]{1,15}$/.test(clean);
}

// Convert X profile images from small '_normal' size to high-res '_400x400'
export function normalizeAvatarUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  // If the image URL ends with _normal.ext, replace with _400x400.ext
  if (rawUrl.includes('_normal.')) {
    return rawUrl.replace('_normal.', '_400x400.');
  }
  return rawUrl;
}

// Generate deterministic permanent MOC ID from X User ID (or handle as fallback)
export function calculateMocId(xUserIdOrHandle: string): number {
  if (!xUserIdOrHandle) return 1;
  const clean = xUserIdOrHandle.toLowerCase().replace(/[^a-z0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 8900) + 101;
}
