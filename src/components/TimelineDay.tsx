import React from 'react';
import type { EventItem } from '../types/event';
import { formatDateDisplay } from '../lib/date';
import { StatusBadge } from './StatusBadge';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';

interface TimelineDayProps {
  date: string;
  events: EventItem[];
  conflictEventIds: Set<string>;
  onSelectEvent: (eventId: string) => void;
}

export const TimelineDay: React.FC<TimelineDayProps> = ({
  date,
  events,
  conflictEventIds,
  onSelectEvent,
}) => {
  if (events.length === 0) return null;

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#202020] rounded-2xl p-5 space-y-4">
      
      {/* Date Header */}
      <div className="flex items-center justify-between border-b border-[#202020] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#627EEA]" />
          <h3 className="font-heading font-extrabold text-xl text-white tracking-wide">
            {formatDateDisplay(date, 'EEEE, dd MMM yyyy')}
          </h3>
        </div>
        <span className="font-mono text-xs text-zinc-500 bg-[#121212] px-2.5 py-1 rounded-lg border border-[#222]">
          {events.length} {events.length === 1 ? 'EVENT' : 'EVENTS'}
        </span>
      </div>

      {/* Events Timeline vertical list */}
      <div className="relative pl-4 border-l-2 border-[#202020] space-y-4 my-2">
        {events.map((evt) => {
          const hasConflict = conflictEventIds.has(evt.id);

          return (
            <div key={evt.id} className="relative group">
              
              {/* Timeline marker node */}
              <div className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 ${
                evt.isPrimary
                  ? 'bg-[#627EEA] border-white shadow-glow-eth'
                  : hasConflict
                  ? 'bg-red-500 border-red-300'
                  : 'bg-[#181818] border-[#444]'
              }`} />

              {/* Event Block */}
              <div
                onClick={() => onSelectEvent(evt.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  evt.isPrimary
                    ? 'bg-[#0D101C] border-[#627EEA]/60 hover:border-[#627EEA] shadow-card'
                    : hasConflict
                    ? 'bg-[#180A0A] border-red-500/40 hover:border-red-500'
                    : 'bg-[#101010] border-[#202020] hover:border-[#333] hover:bg-[#141414]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#627EEA] font-bold bg-[#627EEA]/10 px-2 py-0.5 rounded border border-[#627EEA]/30">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {evt.startTime} – {evt.endTime}
                    </span>
                    {hasConflict && (
                      <span className="font-mono text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> OVERLAP CONFLICT
                      </span>
                    )}
                  </div>
                  <StatusBadge status={evt.status} size="sm" />
                </div>

                <h4 className="font-heading font-bold text-base text-white group-hover:text-[#627EEA] transition-colors">
                  {evt.title}
                </h4>

                <div className="flex items-center gap-3 font-mono text-xs text-zinc-400 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#22C55E]" />
                    {evt.location}
                  </span>
                  <span>•</span>
                  <span>By: <strong className="text-zinc-300">{evt.organizer}</strong></span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
