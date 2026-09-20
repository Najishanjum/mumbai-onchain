import React from 'react';
import type { EventItem } from '../types/event';
import { StatusBadge } from './StatusBadge';
import { MapPin, Clock, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { CalendarButton } from './CalendarButton';

interface EventCardProps {
  event: EventItem;
  index?: number;
  hasConflict?: boolean;
  onSelectEvent: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  index,
  hasConflict = false,
  onSelectEvent,
}) => {
  // Format numeric identifier for exhibition catalogue: 01, 02, 03...
  const displayNumber = index !== undefined
    ? String(index + 1).padStart(2, '0')
    : '01';

  return (
    <div
      className={`group relative bg-[#FFFFFF] border p-6 flex flex-col justify-between transition-all duration-200 select-none overflow-hidden ${
        event.isPrimary
          ? 'border-2 border-[#000000] shadow-sm'
          : hasConflict
          ? 'border-2 border-[#EF4444]'
          : 'border-[#D8D8D8] hover:border-[#000000]'
      }`}
    >
      {/* Giant Subtle Background Numbering (as requested in Section 13 & 14) */}
      <div className="absolute right-2 -bottom-4 font-mono font-black text-7xl sm:text-8xl text-[#F2F2F2] group-hover:text-[#EAEAEA] transition-colors pointer-events-none select-none z-0">
        {displayNumber}
      </div>

      <div className="relative z-10 space-y-4">
        
        {/* Card Header: Exhibition Index + Conflict Alert + Status Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs sm:text-sm text-[#000000] font-bold">
              [{displayNumber}]
            </span>
            <span className="font-mono text-[11px] text-[#666666] uppercase">
              {event.startDate.slice(5)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasConflict && (
              <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-[#EF4444] text-white flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> COLLISION
              </span>
            )}
            <StatusBadge status={event.status} size="sm" />
          </div>
        </div>

        {/* Category & Time */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold text-[#000000] bg-[#F5F5F5] px-2 py-0.5 border border-[#E0E0E0]">
              {event.category}
            </span>
            <span className="font-mono text-xs text-[#555555] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#000000]" />
              {event.startTime} — {event.endTime}
            </span>
          </div>

          {/* Event Title */}
          <h3
            onClick={() => onSelectEvent(event.id)}
            className="font-heading font-black text-xl sm:text-2xl text-[#050505] group-hover:text-[#000000] transition-colors cursor-pointer leading-snug pt-1"
          >
            {event.title}
          </h3>
        </div>

        {/* Location & Organizer */}
        <div className="space-y-1 font-mono text-xs text-[#555555] pt-1">
          <div className="flex items-start gap-1.5 text-[#222222]">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#000000]" />
            <span className="truncate font-semibold">{event.location}</span>
          </div>
          <div className="text-[11px] text-[#777777] pl-5">
            By: <strong className="text-[#333333]">{event.organizer}</strong>
          </div>
        </div>

      </div>

      {/* Card Footer: Action Links */}
      <div className="relative z-10 pt-6 mt-4 border-t border-[#EAEAEA] flex items-center justify-between gap-3">
        <button
          onClick={() => onSelectEvent(event.id)}
          className="font-mono text-xs font-bold text-[#000000] hover:underline flex items-center gap-1 transition-all"
        >
          <span>VIEW DETAILS</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>

        <div className="shrink-0">
          <CalendarButton event={event} size="sm" />
        </div>
      </div>

    </div>
  );
};
