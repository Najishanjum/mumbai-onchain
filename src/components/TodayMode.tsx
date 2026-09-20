import React, { useState } from 'react';
import type { EventItem } from '../types/event';
import { formatDateDisplay, getEventsForDate } from '../lib/date';
import { MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CalendarButton } from './CalendarButton';

interface TodayModeProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export const TodayMode: React.FC<TodayModeProps> = ({ events, onSelectEvent }) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-04');

  const availableDates = [
    '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04',
    '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'
  ];

  const todayEvents = getEventsForDate(events, selectedDate);

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#000000] p-6 sm:p-8 space-y-6 select-none">
      
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#D8D8D8] pb-5">
        <div>
          <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
            DAILY RUN-SHEET // IST
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#050505] tracking-tight flex items-baseline gap-3 uppercase">
            TODAY MODE
            <span className="font-mono text-base font-bold text-[#000000] bg-[#F5F5F5] px-2.5 py-0.5 border border-[#D8D8D8]">
              {formatDateDisplay(selectedDate, 'dd MMM (EEEE)')}
            </span>
          </h2>
        </div>

        {/* Date Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {availableDates.map(date => {
            const count = getEventsForDate(events, date).length;
            const isSelected = date === selectedDate;
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1 font-mono text-xs transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                    : 'bg-[#FFFFFF] text-[#555555] hover:text-[#000000] border-[#D8D8D8] hover:border-[#000000]'
                }`}
              >
                <span>NOV {date.slice(8)}</span>
                <span className={`text-[10px] px-1 py-0.2 ${isSelected ? 'bg-white/20 text-white' : 'text-[#888888]'}`}>
                  [{count}]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Events List */}
      {todayEvents.length === 0 ? (
        <div className="py-10 text-center font-mono text-xs text-[#777777] border border-dashed border-[#D8D8D8]">
          NO SESSIONS SCHEDULED ON THIS DATE.
        </div>
      ) : (
        <div className="divide-y divide-[#D8D8D8]">
          {todayEvents.map(evt => (
            <div
              key={evt.id}
              onClick={() => onSelectEvent(evt.id)}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-[#000000] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {evt.startTime} — {evt.endTime}
                  </span>
                  <span className="text-[#666666] uppercase text-[11px]">
                    [{evt.category}]
                  </span>
                  <StatusBadge status={evt.status} size="sm" />
                </div>

                <h4 className="font-heading font-black text-lg text-[#050505] group-hover:underline">
                  {evt.title}
                </h4>

                <div className="flex items-center gap-2 font-mono text-xs text-[#555555]">
                  <MapPin className="w-3.5 h-3.5 text-[#000000]" />
                  <span>{evt.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center" onClick={(e) => e.stopPropagation()}>
                <CalendarButton event={evt} size="sm" />
                <button
                  onClick={() => onSelectEvent(evt.id)}
                  className="p-2 border border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] transition-colors"
                  aria-label="View event details"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
