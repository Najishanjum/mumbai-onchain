import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanUsername, isValidXUsername, type NormalizedXProfile } from '../../lib/xProfileUtils';

export interface XProfileState {
  handle: string;
  setHandle: (h: string) => void;
  displayName: string;
  setDisplayName: (n: string) => void;
  xUserId: string;
  bio: string;
  location: string;
  profileUrl: string;
  avatarUrl: string;
  avatarImage: HTMLImageElement | null;
  isLoading: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
  fetchProfile: (overrideHandle?: string) => Promise<void>;
  fallbackInitials: string;
}

// Generate high-resolution procedural geometric fallback avatar
export function generateFallbackAvatar(seedText: string, size = 400): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  let hash = 2166136261;
  const clean = seedText.toLowerCase().replace(/[^a-z0-9]/g, '') || 'moc';
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const seed = hash >>> 0;

  const rand = (step: number) => {
    const x = Math.sin(seed + step) * 10000;
    return x - Math.floor(x);
  };

  // Cyberpunk dark gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#2D2875');
  grad.addColorStop(0.5, '#16194A');
  grad.addColorStop(1, '#0C0D2A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Decorative geometric polygons
  const colors = ['rgba(95,227,214,0.35)', 'rgba(181,156,242,0.4)', 'rgba(246,160,103,0.3)'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const px = rand(i * 3 + k) * size;
      const py = rand(i * 3 + k + 10) * size;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Initials (e.g. Vitalik Buterin -> VB, or Vitalik -> V)
  const words = seedText.trim().split(/\s+/).filter(Boolean);
  let initials = 'M';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    initials = words[0].slice(0, Math.min(2, words[0].length)).toUpperCase();
  }

  ctx.font = `800 ${size * 0.38}px "Bricolage Grotesque", "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFF8F0';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 16;
  ctx.fillText(initials, size / 2, size * 0.52);

  return canvas;
}

export function useXProfile(initialHandle = 'vitalik'): XProfileState {
  const [handle, setHandle] = useState(initialHandle);
  const [displayName, setDisplayName] = useState('');
  const [xUserId, setXUserId] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientCacheRef = useRef<Map<string, NormalizedXProfile>>(new Map());

  // Helper to load image onto an Image element
  const loadImageElement = useCallback((url: string | null, fallbackSeed: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      if (!url) {
        const canvas = generateFallbackAvatar(fallbackSeed, 400);
        const fallbackImg = new Image();
        fallbackImg.src = canvas.toDataURL();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => resolve(fallbackImg);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // In case CORS or image loading fails, render fallback avatar
        const canvas = generateFallbackAvatar(fallbackSeed, 400);
        const fallbackImg = new Image();
        fallbackImg.src = canvas.toDataURL();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => resolve(fallbackImg);
      };
      img.src = url;
    });
  }, []);

  const fetchProfile = useCallback(async (overrideHandle?: string) => {
    const raw = overrideHandle !== undefined ? overrideHandle : handle;
    const clean = cleanUsername(raw);

    if (!clean) {
      setErrorMessage('Please enter an X username.');
      setIsSuccess(false);
      return;
    }

    if (!isValidXUsername(clean)) {
      setErrorMessage('Please enter a valid X username (1-15 letters, numbers, or underscores).');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const cacheKey = clean.toLowerCase();

    // Check client-side memory cache
    if (clientCacheRef.current.has(cacheKey)) {
      const cached = clientCacheRef.current.get(cacheKey)!;
      setDisplayName(cached.name);
      setXUserId(cached.id);
      setBio(cached.bio);
      setLocation(cached.location);
      setProfileUrl(cached.url);
      setAvatarUrl(cached.avatar || '');

      const img = await loadImageElement(cached.avatar, cached.name || cached.username);
      setAvatarImage(img);
      setIsLoading(false);
      setIsSuccess(true);
      return;
    }

    try {
      const res = await fetch(`/api/x/profile?username=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.profile) {
        const errorText = data?.error || 'X profile not found.';
        setErrorMessage(errorText);
        setIsSuccess(false);

        // Fallback for visual display so card continues rendering
        const humanName = clean.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const fallbackImg = await loadImageElement(null, humanName);
        setAvatarImage(fallbackImg);
        setDisplayName(humanName);
        setXUserId(`fallback_${clean}`);
        setIsLoading(false);
        return;
      }

      const p: NormalizedXProfile = data.profile;
      clientCacheRef.current.set(cacheKey, p);

      setDisplayName(p.name);
      setXUserId(p.id);
      setBio(p.bio);
      setLocation(p.location);
      setProfileUrl(p.url);
      setAvatarUrl(p.avatar || '');

      const img = await loadImageElement(p.avatar, p.name || p.username);
      setAvatarImage(img);
      setIsLoading(false);
      setIsSuccess(true);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage('Unable to connect to profile lookup right now. Please try again.');
      setIsSuccess(false);

      // Fallback
      const humanName = clean.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const fallbackImg = await loadImageElement(null, humanName);
      setAvatarImage(fallbackImg);
      setDisplayName(humanName);
      setXUserId(`fallback_${clean}`);
      setIsLoading(false);
    }
  }, [handle, loadImageElement]);

  // Initial fetch on mount for default handle
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      fetchProfile(initialHandle);
    }
  }, [initialHandle, fetchProfile]);

  const initials = (displayName || handle).trim().slice(0, 2).toUpperCase() || 'M';

  return {
    handle: cleanUsername(handle),
    setHandle,
    displayName,
    setDisplayName,
    xUserId,
    bio,
    location,
    profileUrl,
    avatarUrl,
    avatarImage,
    isLoading,
    isSuccess,
    errorMessage,
    fetchProfile,
    fallbackInitials: initials
  };
}
