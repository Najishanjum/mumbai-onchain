import React, { useState } from 'react';
import type { EventItem } from '../types/event';
import { TimelineDay } from './TimelineDay';
import { ConflictAlert } from './ConflictAlert';
import { detectScheduleConflicts } from '../lib/conflicts';

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
    <div className="space-y-8 select-none">
      
      {/* Editorial Header & Day Filter Controls */}
      <div className="bg-[#FFFFFF] border border-[#000000] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D8D8D8] pb-6">
          <div>
            <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
              PROGRAMME // 01—08 NOVEMBER 2026
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] tracking-tight uppercase">
              SCHEDULE MATRIX
            </h2>
            <p className="font-mono text-xs text-[#555555] mt-1 max-w-xl">
              Chronological exhibition programme across Mumbai with automated collision detection between concurrent sessions.
            </p>
          </div>

          <div className="font-mono text-xs text-right">
            <span className="text-[#000000] font-bold block">TIMEZONE: ASIA/KOLKATA (IST)</span>
            <span className="text-[#777777]">UTC +05:30 • MUMBAI</span>
          </div>
        </div>

        {/* Day Selector Buttons */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] text-[#666666] uppercase tracking-widest block font-bold">
            FILTER BY DATE:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedDayFilter('ALL')}
              className={`px-3.5 py-1.5 font-mono text-xs whitespace-nowrap transition-all border ${
                selectedDayFilter === 'ALL'
                  ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                  : 'bg-[#FFFFFF] text-[#050505] border-[#D8D8D8] hover:border-[#000000]'
              }`}
            >
              ALL DAYS (01—08)
            </button>
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDayFilter(d)}
                className={`px-3.5 py-1.5 font-mono text-xs whitespace-nowrap transition-all border ${
                  selectedDayFilter === d
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                    : 'bg-[#FFFFFF] text-[#050505] border-[#D8D8D8] hover:border-[#000000]'
                }`}
              >
                NOV {d.slice(8)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Automatic Collision Detector */}
      <ConflictAlert conflicts={conflicts} onSelectEvent={onSelectEvent} />

      {/* Timeline Days */}
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
