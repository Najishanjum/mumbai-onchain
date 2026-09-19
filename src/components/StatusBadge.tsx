import React from 'react';
import type { EventStatus } from '../types/event';

interface StatusBadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showDot = true }) => {
  const getStyle = (st: EventStatus) => {
    switch (st) {
      case 'VOLUNTEER':
        return 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/40 font-semibold shadow-[0_0_10px_rgba(139,92,246,0.2)]';
      case 'ATTENDING':
        return 'bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/40 font-semibold';
      case 'INTERESTED':
        return 'bg-[#627EEA]/15 text-[#8299F0] border-[#627EEA]/40';
      case 'PENDING':
      case 'PENDING APPROVAL':
        return 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/40';
      case 'MAYBE':
        return 'bg-zinc-800/60 text-zinc-400 border-zinc-700';
      case 'CONFLICT':
        return 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40 font-bold animate-pulse';
      case 'COMPLETED':
        return 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const getDotStyle = (st: EventStatus) => {
    switch (st) {
      case 'VOLUNTEER': return 'bg-[#8B5CF6] animate-ping';
      case 'ATTENDING': return 'bg-[#22C55E]';
      case 'INTERESTED': return 'bg-[#627EEA]';
      case 'PENDING':
      case 'PENDING APPROVAL': return 'bg-[#F59E0B]';
      case 'CONFLICT': return 'bg-[#EF4444]';
      case 'COMPLETED': return 'bg-zinc-500';
      default: return 'bg-zinc-400';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wider',
    md: 'px-2.5 py-1 text-xs tracking-wider',
    lg: 'px-3.5 py-1.5 text-sm tracking-widest',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-mono uppercase transition-all duration-200 ${getStyle(status)} ${sizeClasses}`}>
      {showDot && (
        <span className="relative flex h-2 w-2">
          {status === 'VOLUNTEER' && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${getDotStyle(status)}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${getDotStyle(status)}`} />
        </span>
      )}
      {status}
    </span>
  );
};
