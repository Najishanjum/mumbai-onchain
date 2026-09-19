import React, { useState } from 'react';
import type { EventItem } from '../types/event';
import { TimelineDay } from './TimelineDay';
import { ConflictAlert } from './ConflictAlert';
import { detectScheduleConflicts } from '../lib/conflicts';
import { Clock } from 'lucide-react';

interface TimelineProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ events, onSelectEvent }) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');

  const days = [
    '2026-11-01',
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-06',
    '2026-11-07',
    '2026-11-08',
  ];

  const conflicts = detectScheduleConflicts(events);

  // Set of conflict event IDs for rapid highlighting
  const conflictEventIds = new Set<string>();
  conflicts.forEach(c => {
    conflictEventIds.add(c.event1.id);
    conflictEventIds.add(c.event2.id);
  });

  const activeDays = selectedDayFilter === 'ALL'
    ? days
    : [selectedDayFilter];

  return (
    <div className="space-y-8">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A0A0A] p-6 rounded-3xl border border-[#202020] tech-grid shadow-card">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#627EEA] uppercase tracking-widest mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>FULL EVENT TIMELINE // NOV 01 - NOV 08 2026</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
            SCHEDULE MATRIX & CONFLICT DETECTOR
          </h2>
        </div>

        {/* Day Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedDayFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap transition-all ${
              selectedDayFilter === 'ALL'
                ? 'bg-[#627EEA] text-white font-bold shadow-glow-eth'
                : 'bg-[#141414] text-zinc-400 hover:text-white border border-[#222]'
            }`}
          >
            SHOW ALL DAYS
          </button>
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDayFilter(d)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap transition-all ${
                selectedDayFilter === d
                  ? 'bg-[#627EEA] text-white font-bold shadow-glow-eth'
                  : 'bg-[#141414] text-zinc-400 hover:text-white border border-[#222]'
              }`}
            >
              NOV {d.slice(8)}
            </button>
          ))}
        </div>
      </div>

      {/* Conflict Alert Banner */}
      <ConflictAlert conflicts={conflicts} onSelectEvent={onSelectEvent} />

      {/* Timeline Days List */}
      <div className="space-y-6">
        {activeDays.map((dayDate) => {
          const dayEvents = events.filter(e => {
            if (e.startDate === dayDate) return true;
            if (e.startDate <= dayDate && e.endDate >= dayDate) return true;
            return false;
          }).sort((a, b) => {
            if (a.startTime === 'TBA') return 1;
            if (b.startTime === 'TBA') return -1;
            return a.startTime.localeCompare(b.startTime);
          });

          return (
            <TimelineDay
              key={dayDate}
              date={dayDate}
              events={dayEvents}
              conflictEventIds={conflictEventIds}
              onSelectEvent={onSelectEvent}
            />
          );
        })}
      </div>

    </div>
  );
};
