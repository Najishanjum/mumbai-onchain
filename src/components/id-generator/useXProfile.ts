





import { useState, useEffect, useRef } from 'react';

export interface XProfile {
  handle: string;
  displayName: string;
  avatarUrl: string;
  avatarImage: HTMLImageElement | null;
  isLoading: boolean;
  isError: boolean;
  fallbackInitials: string;
}

// Generate fallback geometric avatar on offscreen canvas
export function generateFallbackAvatar(handle: string, size = 400): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Pseudo-random seed from handle
  let hash = 2166136261;
  for (let i = 0; i < handle.length; i++) {
    hash ^= handle.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const seed = hash >>> 0;

  const rand = (step: number) => {
    const x = Math.sin(seed + step) * 10000;
    return x - Math.floor(x);
  };

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#2D2875');
  grad.addColorStop(0.5, '#16194A');
  grad.addColorStop(1, '#0C0D2A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Geometric abstract shapes
  const colors = ['rgba(95,227,214,0.4)', 'rgba(181,156,242,0.45)', 'rgba(246,160,103,0.35)'];
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = colors[i % 3];
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

  // Initial letter
  const char = (handle.replace(/[^a-zA-Z0-9]/g, '')[0] || 'M').toUpperCase();
  ctx.font = `800 ${size * 0.45}px "Bricolage Grotesque", "Inter", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFF8F0';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 16;
  ctx.fillText(char, size / 2, size * 0.52);

  return canvas;
}

export function useXProfile(initialHandle = 'vitalik') {
  const [handle, setHandle] = useState(initialHandle);
  const [displayName, setDisplayName] = useState('');
  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const cleanHandle = handle.replace(/^@/, '').trim();
  const cacheRef = useRef<Map<string, { img: HTMLImageElement; url: string; name: string }>>(new Map());

  useEffect(() => {
    if (!cleanHandle) {
      setDisplayName('');
      setAvatarImage(null);
      setAvatarUrl('');
      setIsLoading(false);
      return;
    }

    // Check memory cache
    if (cacheRef.current.has(cleanHandle.toLowerCase())) {
      const cached = cacheRef.current.get(cleanHandle.toLowerCase())!;
      setAvatarImage(cached.img);
      setAvatarUrl(cached.url);
      setDisplayName(cached.name);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    // Humanize handle for fallback display name
    const defaultDisplayName = cleanHandle
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Try reliable unavatar / avatar endpoints
    const url = `https://unavatar.io/twitter/${encodeURIComponent(cleanHandle)}?fallback=https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanHandle)}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    let isMounted = true;

    img.onload = () => {
      if (!isMounted) return;
      cacheRef.current.set(cleanHandle.toLowerCase(), {
        img,
        url,
        name: defaultDisplayName
      });
      setAvatarImage(img);
      setAvatarUrl(url);
      setDisplayName(defaultDisplayName);
      setIsLoading(false);
      setIsError(false);
    };

    img.onerror = () => {
      if (!isMounted) return;
      // Graceful fallback: generate procedural image element from canvas
      const fallbackCanvas = generateFallbackAvatar(cleanHandle, 400);
      const fallbackImg = new Image();
      fallbackImg.src = fallbackCanvas.toDataURL();
      fallbackImg.onload = () => {
        if (!isMounted) return;
        setAvatarImage(fallbackImg);
        setAvatarUrl(fallbackImg.src);
        setDisplayName(defaultDisplayName);
        setIsLoading(false);
        setIsError(false);
      };
    };

    img.src = url;

    return () => {
      isMounted = false;
    };
  }, [cleanHandle]);

  return {
    handle: cleanHandle,
    setHandle,
    displayName,
    setDisplayName,
    avatarImage,
    avatarUrl,
    isLoading,
    isError,
    fallbackInitials: (cleanHandle[0] || 'M').toUpperCase()
  };
}
