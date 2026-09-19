import React, { useState } from 'react';
import type { EventItem } from '../types/event';
import { formatDateDisplay, getEventsForDate } from '../lib/date';
import { Calendar, Sparkles, MapPin, Clock, ExternalLink } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CalendarButton } from './CalendarButton';

interface TodayModeProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export const TodayMode: React.FC<TodayModeProps> = ({ events, onSelectEvent }) => {
  // Allow toggling through dates during Onchain Week (Nov 01 - Nov 08)
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-04'); // Defaults to mid-week highlight

  const availableDates = [
    '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04',
    '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'
  ];

  const todayEvents = getEventsForDate(events, selectedDate);

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#202020] rounded-3xl p-6 sm:p-8 space-y-6 tech-grid shadow-card">
      
      {/* Today Mode Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202020] pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#22C55E] uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DAILY SCHEDULE OVERVIEW // ASIA/KOLKATA</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wide flex items-center gap-3">
            TODAY MODE
            <span className="font-mono text-base font-normal text-[#627EEA] bg-[#627EEA]/10 px-3 py-1 rounded-lg border border-[#627EEA]/30">
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
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#627EEA] text-white font-bold shadow-glow-eth'
                    : 'bg-[#141414] text-zinc-400 hover:text-white hover:bg-[#1C1C1C] border border-[#222]'
                }`}
              >
                <span>NOV {date.slice(8)}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events List for Selected Day */}
      {todayEvents.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[#222] rounded-2xl bg-[#080808]">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <h4 className="font-mono text-sm text-zinc-300 font-bold uppercase">NO EVENTS TODAY</h4>
          <p className="text-xs text-zinc-500 mt-1 font-mono">Your schedule is clear for {formatDateDisplay(selectedDate, 'dd MMM')}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todayEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                evt.isPrimary
                  ? 'bg-[#0E0F17] border-[#627EEA]/50 shadow-glow-eth'
                  : 'bg-[#101010] border-[#222] hover:border-[#333]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-[#627EEA] font-bold bg-[#627EEA]/10 px-2.5 py-0.5 rounded border border-[#627EEA]/20">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {evt.startTime} – {evt.endTime}
                  </span>
                  <StatusBadge status={evt.status} size="sm" />
                  <span className="font-mono text-[11px] text-zinc-500 uppercase">{evt.category}</span>
                </div>

                <h3 className="font-heading font-bold text-lg text-white hover:text-[#627EEA] transition-colors cursor-pointer" onClick={() => onSelectEvent(evt.id)}>
                  {evt.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#627EEA]" />
                    {evt.location}
                  </span>
                  <span>•</span>
                  <span>By: <strong className="text-zinc-300">{evt.organizer}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#1A1A1A]">
                <a
                  href={evt.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#181818] hover:bg-[#222] text-zinc-300 hover:text-white border border-[#333] transition-colors"
                  title="Official Link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <CalendarButton event={evt} size="sm" />

                <button
                  onClick={() => onSelectEvent(evt.id)}
                  className="px-3.5 py-2 rounded-lg bg-[#181818] hover:bg-[#222] text-white border border-[#333] font-mono text-xs font-semibold transition-colors"
                >
                  DETAILS & NOTES
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
