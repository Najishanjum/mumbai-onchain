import React, { useState } from 'react';
import type { EventItem } from '../types/event';
import { TimelineDay } from './TimelineDay';

interface TimelineProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ events, onSelectEvent }) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');

  const days = [
    { date: '2026-11-01', label: 'NOV 01 (SUN)', description: 'India Blockchain Week' },
    { date: '2026-11-02', label: 'NOV 02 (MON)', description: 'IBW Day 2 & Satellite Summits' },
    { date: '2026-11-03', label: 'NOV 03 (TUE)', description: 'Devcon 8 Day 1 & EIP Hub' },
    { date: '2026-11-04', label: 'NOV 04 (WED)', description: 'Devcon 8 Day 2 — Quantstamp Common Defense Mumbai Lounge' },
    { date: '2026-11-05', label: 'NOV 05 (THU)', description: 'Devcon 8 Day 3 — Builder Arena' },
    { date: '2026-11-06', label: 'NOV 06 (FRI)', description: 'Devcon 8 Day 4 — Revcon' },
    { date: '2026-11-07', label: 'NOV 07 (SAT)', description: 'ETHGlobal Mumbai Finals — EIP Hub — Devcon' },
  ];

  const activeDays = selectedDayFilter === 'ALL'
    ? days.map(d => d.date)
    : [selectedDayFilter];

  return (
    <div className="space-y-8 select-none">
      
      {/* Editorial Header & Day Filter Controls */}
      <div className="bg-[#FFFFFF] border border-[#000000] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D8D8D8] pb-6">
          <div>
            <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
              PROGRAMME // 01—07 NOVEMBER 2026
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] tracking-tight uppercase">
              SCHEDULE MATRIX
            </h2>
            <p className="font-mono text-xs text-[#555555] mt-1 max-w-xl">
              India Blockchain Week (Nov 1, Sun) → Devcon 8 India (Nov 3–6) → ETHGlobal Mumbai &amp; EIP Hub (Nov 7, Sat). Quantstamp Common Defense Mumbai Lounge, Revcon, Builder Arena and more.
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
            SELECT DAY:
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
              ALL DAYS (01—07 NOV)
            </button>
            {days.map((d) => (
              <button
                key={d.date}
                onClick={() => setSelectedDayFilter(d.date)}
                title={d.description}
                className={`px-3 py-1.5 font-mono text-xs whitespace-nowrap transition-all border ${
                  selectedDayFilter === d.date
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                    : 'bg-[#FFFFFF] text-[#050505] border-[#D8D8D8] hover:border-[#000000]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Days (Clean Schedule without collision banners) */}
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
              onSelectEvent={onSelectEvent}
            />
          );
        })}
      </div>

    </div>
  );
};
