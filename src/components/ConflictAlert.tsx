import React from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { ScheduleConflict } from '../types/event';

interface ConflictAlertProps {
  conflicts: ScheduleConflict[];
  onSelectEvent: (eventId: string) => void;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({ conflicts, onSelectEvent }) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="w-full space-y-4 select-none">
      {conflicts.map((conflict, idx) => (
        <div
          key={idx}
          className="w-full bg-[#FFFFFF] border-2 border-[#EF4444] p-5 sm:p-6 relative overflow-hidden"
        >
          {/* Top Banner Tag */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FCA5A5] pb-3 mb-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#DC2626] font-bold tracking-widest">
              <AlertTriangle className="w-4 h-4" />
              <span>SCHEDULE COLLISION // {conflict.date}</span>
            </div>
            <div className="font-bold text-[#000000] bg-[#FEE2E2] px-2.5 py-1">
              OVERLAP INTERVAL: {conflict.overlapStart} — {conflict.overlapEnd} IST
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-heading font-black text-2xl sm:text-3xl text-[#050505] tracking-tight leading-tight">
              {conflict.event1.title}
              <span className="text-[#EF4444] mx-3">×</span>
              {conflict.event2.title}
            </div>

            <p className="font-mono text-xs text-[#555555]">
              Direct timing collision detected on your Mumbai itinerary. Both tracks require physical attendance simultaneously.
            </p>

            {/* Two Competing Events Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              {/* Event 1 */}
              <div
                onClick={() => onSelectEvent(conflict.event1.id)}
                className="bg-[#FAFAFA] hover:bg-[#F4F4F5] p-4 border border-[#D8D8D8] hover:border-[#000000] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center font-mono text-[11px] text-[#666666] mb-1.5">
                  <span>{conflict.event1.startTime} — {conflict.event1.endTime}</span>
                  <span className="font-bold text-[#000000] border border-[#000000] px-1.5 py-0.2">
                    {conflict.event1.status}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-base text-[#050505] group-hover:underline flex items-center justify-between">
                  <span className="truncate">{conflict.event1.title}</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0 ml-1 text-[#555555] group-hover:text-[#000000]" />
                </h4>
                <div className="font-mono text-[11px] text-[#777777] mt-1 truncate">
                  {conflict.event1.location}
                </div>
              </div>

              {/* Event 2 */}
              <div
                onClick={() => onSelectEvent(conflict.event2.id)}
                className="bg-[#FAFAFA] hover:bg-[#F4F4F5] p-4 border border-[#D8D8D8] hover:border-[#000000] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center font-mono text-[11px] text-[#666666] mb-1.5">
                  <span>{conflict.event2.startTime} — {conflict.event2.endTime}</span>
                  <span className="font-bold text-[#000000] border border-[#000000] px-1.5 py-0.2">
                    {conflict.event2.status}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-base text-[#050505] group-hover:underline flex items-center justify-between">
                  <span className="truncate">{conflict.event2.title}</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0 ml-1 text-[#555555] group-hover:text-[#000000]" />
                </h4>
                <div className="font-mono text-[11px] text-[#777777] mt-1 truncate">
                  {conflict.event2.location}
                </div>
              </div>

            </div>
          </div>

        </div>
      ))}
    </div>
  );
};
