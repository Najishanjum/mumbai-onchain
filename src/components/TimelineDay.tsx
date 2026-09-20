import React from 'react';
import type { EventItem } from '../types/event';
import { formatDateDisplay } from '../lib/date';
import { StatusBadge } from './StatusBadge';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { CalendarButton } from './CalendarButton';

interface TimelineDayProps {
  date: string;
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export const TimelineDay: React.FC<TimelineDayProps> = ({
  date,
  events,
  onSelectEvent,
}) => {
  if (events.length === 0) return null;

  // Extract date parts
  const dayNumber = date.slice(8); // '01', '04', etc.
  const weekday = formatDateDisplay(date, 'EEEE').toUpperCase(); // 'SUNDAY', 'WEDNESDAY', etc.

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#000000] p-6 sm:p-8 select-none">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* Left Column: Date Visual Anchor */}
        <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-[#D8D8D8] pb-4 md:pb-0 md:pr-6">
          <div className="space-y-0.5 sticky top-24">
            <span className="font-mono text-xs font-bold text-[#666666] tracking-widest block">
              NOV
            </span>
            <span className="font-heading font-black text-6xl sm:text-7xl lg:text-8xl text-[#050505] leading-none block select-none">
              {dayNumber}
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#000000] tracking-wider block pt-1">
              {weekday}
            </span>
            <span className="font-mono text-[11px] text-[#777777] block pt-2">
              {events.length} {events.length === 1 ? 'SESSION / TRACK' : 'SESSIONS / TRACKS'}
            </span>
          </div>
        </div>

        {/* Right Column: Editorial Programme List */}
        <div className="md:col-span-9 divide-y divide-[#D8D8D8]">
          {events.map((evt) => {
            return (
              <div
                key={evt.id}
                className={`py-5 first:pt-0 last:pb-0 transition-colors group cursor-pointer ${
                  evt.isPrimary ? 'bg-[#FAFAFA] -mx-4 px-4 py-6 border-l-4 border-l-[#000000]' : ''
                }`}
                onClick={() => onSelectEvent(evt.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                  
                  {/* Time Stamp */}
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="font-bold text-[#000000] text-sm bg-[#F5F5F5] px-2 py-0.5 border border-[#E0E0E0]">
                      {evt.startTime} — {evt.endTime}
                    </span>
                    <span className="text-[#666666] uppercase text-[11px]">
                      {evt.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={evt.status} size="sm" />
                    <CalendarButton event={evt} size="sm" />
                  </div>
                </div>

                {/* Event Title */}
                <h4 className="font-heading font-black text-xl sm:text-2xl text-[#050505] group-hover:underline flex items-center justify-between">
                  <span>{evt.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#888888] group-hover:text-[#000000] transition-colors shrink-0 ml-2" />
                </h4>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-[#555555] mt-2">
                  <span className="flex items-center gap-1 text-[#222222]">
                    <MapPin className="w-3.5 h-3.5 text-[#000000]" />
                    {evt.location}
                  </span>
                  <span>•</span>
                  <span>Organizer: <strong className="text-[#000000]">{evt.organizer}</strong></span>
                </div>

                {evt.isPrimary && (
                  <div className="mt-3 font-mono text-[11px] text-[#000000] font-bold uppercase tracking-wider bg-[#EEEEEE] px-3 py-1 inline-block">
                    ★ PRIMARY VOLUNTEER & ATTENDEE MISSION
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
