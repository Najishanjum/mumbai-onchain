import React, { useState } from 'react';

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

  const hasValidImage = avatarUrl && avatarUrl.trim().length > 0 && !imgError;

  return (
    <div
      className={`relative shrink-0 rounded-none border border-[#000000] overflow-hidden flex items-center justify-center font-mono font-black select-none ${sizeClasses[size]} ${colorClass} ${className}`}
    >
      {hasValidImage ? (
        <img
          src={avatarUrl}
          alt={name}
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
