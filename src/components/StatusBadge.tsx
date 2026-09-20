import React from 'react';
import type { EventStatus } from '../types/event';

interface StatusBadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = (st: EventStatus) => {
    switch (st) {
      case 'VOLUNTEER':
        return 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold';
      case 'ATTENDING':
        return 'bg-[#FFFFFF] text-[#000000] border-[#000000] font-bold';
      case 'INTERESTED':
        return 'bg-[#F4F4F5] text-[#333333] border-[#D8D8D8]';
      case 'PENDING':
      case 'PENDING APPROVAL':
        return 'bg-[#FFFBEB] text-[#B45309] border-[#F59E0B]/60';
      case 'CONFLICT':
        return 'bg-[#FEF2F2] text-[#DC2626] border-[#EF4444] font-bold';
      case 'COMPLETED':
        return 'bg-[#F4F4F5] text-[#888888] border-[#D8D8D8] line-through';
      default:
        return 'bg-[#FAFAFA] text-[#444444] border-[#D8D8D8]';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-mono uppercase tracking-wider ${getStyle(
        status
      )} ${sizeClasses}`}
    >
      {status === 'VOLUNTEER' && <span className="w-1.5 h-1.5 bg-[#F97316]" />}
      {status === 'ATTENDING' && <span className="w-1.5 h-1.5 bg-[#000000]" />}
      {status}
    </span>
  );
};
