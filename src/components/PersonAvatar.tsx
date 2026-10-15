import React, { useState } from 'react';

// Profile photos saved as data: URLs are big strings the browser re-decodes
// every time an <img> mounts, so the photo visibly loads on each screen.
// Turn each into a blob URL once and keep a decoded copy alive, so every
// later avatar for that photo paints straight away.
const blobUrls = new Map<string, string>();
const decoded = new Map<string, HTMLImageElement>();

function cachedImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  let out = trimmed;
  if (trimmed.startsWith('data:')) {
    const hit = blobUrls.get(trimmed);
    if (hit) out = hit;
    else {
      try {
        const [head, body] = trimmed.split(',', 2);
        const mime = head.match(/^data:([^;]+)/)?.[1] ?? 'image/jpeg';
        const bytes = head.includes(';base64') ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(body));
        out = URL.createObjectURL(new Blob([bytes], { type: mime }));
        blobUrls.set(trimmed, out);
      } catch {
        out = trimmed;
      }
    }
  }
  if (!decoded.has(out) && typeof Image !== 'undefined') {
    const img = new Image();
    img.src = out;
    img.decode?.().catch(() => {});
    decoded.set(out, img);
  }
  return out;
}

interface PersonAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // Compute initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?';

  // Deterministic background tone based on name
  const colors = [
    'bg-[#050505] text-[#FFFFFF]',
    'bg-[#18181B] text-[#FAFAFA]',
    'bg-[#27272A] text-[#F4F4F5]',
    'bg-[#09090B] text-[#FFFFFF]',
  ];
  const charSum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorClass = colors[charSum % colors.length];

  const sizeClasses = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const src = avatarUrl ? cachedImageUrl(avatarUrl) : '';
  const hasValidImage = src.length > 0 && !imgError;

  return (
    <div
      className={`relative shrink-0 rounded-none border border-[#000000] overflow-hidden flex items-center justify-center font-mono font-black select-none ${sizeClasses[size]} ${colorClass} ${className}`}
    >
      {hasValidImage ? (
        <img
          src={src}
          alt={name}
          decoding="sync"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#111111] text-[#FFFFFF] tracking-wider">
          {initials}
        </div>
      )}
    </div>
  );
};
