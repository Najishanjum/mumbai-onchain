import React from 'react';
import type { EventItem } from '../types/event';
import { StatusBadge } from './StatusBadge';
import { MapPin, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { CalendarButton } from './CalendarButton';

interface EventCardProps {
  event: EventItem;
  hasConflict?: boolean;
  onSelectEvent: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, hasConflict = false, onSelectEvent }) => {
  return (
    <div
      className={`group relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
        event.isPrimary
          ? 'bg-[#0A0D18] border-[#627EEA]/50 shadow-glow-eth hover:border-[#627EEA]'
          : hasConflict
          ? 'bg-[#120808] border-red-500/50 hover:border-red-500'
          : 'bg-[#101010] border-[#202020] hover:border-[#333] hover:bg-[#141414]'
      }`}
    >
      {/* Event Banner Image if available */}
      {event.imageUrl && (
        <div
          onClick={() => onSelectEvent(event.id)}
          className="w-full h-36 rounded-xl overflow-hidden mb-4 border border-zinc-800/80 cursor-pointer relative group-hover:border-[#627EEA]/50 transition-colors"
        >
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        </div>
      )}

      {/* Header Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#627EEA]">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-bold">{event.startTime} - {event.endTime}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {hasConflict && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> OVERLAP
              </span>
            )}
            <StatusBadge status={event.status} size="sm" />
          </div>
        </div>

        {/* Title & Category */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider bg-[#181818] px-2 py-0.5 rounded border border-[#252525]">
              {event.category}
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              {event.startDate}
            </span>
          </div>

          <h3
            onClick={() => onSelectEvent(event.id)}
            className="font-heading font-bold text-base sm:text-lg text-white group-hover:text-[#627EEA] transition-colors cursor-pointer leading-snug line-clamp-2"
          >
            {event.title}
          </h3>
        </div>

        {/* Location & Organizer */}
        <div className="space-y-1 font-mono text-xs text-zinc-400 mb-4">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#627EEA] shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            By: <strong className="text-zinc-400">{event.organizer}</strong>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[#1A1A1A] flex items-center justify-between gap-2">
        <button
          onClick={() => onSelectEvent(event.id)}
          className="text-xs font-mono text-zinc-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
        >
          <span>DETAILS</span>
        </button>

        <div className="flex items-center gap-1.5">
          <a
            href={event.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-[#181818] hover:bg-[#222] text-zinc-400 hover:text-white border border-[#333] transition-colors"
            title="Open official event page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <CalendarButton event={event} size="sm" />
        </div>
      </div>
    </div>
  );
};
