import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import type { ScheduleConflict } from '../types/event';

interface ConflictAlertProps {
  conflicts: ScheduleConflict[];
  onSelectEvent: (eventId: string) => void;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({ conflicts, onSelectEvent }) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {conflicts.map((conflict, idx) => (
        <div
          key={idx}
          className="w-full bg-[#1A0A0A] border-2 border-red-500/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-2xl animate-in fade-in duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                  SCHEDULE CONFLICT DETECTED // OVERLAP ({conflict.date})
                </span>
                <span className="font-mono text-xs text-zinc-400 bg-red-950/40 px-2.5 py-0.5 rounded border border-red-800/40">
                  <Clock className="w-3 h-3 inline mr-1 text-red-400" />
                  OVERLAP: {conflict.overlapStart} – {conflict.overlapEnd} IST
                </span>
              </div>

              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                2 scheduled events overlap during this timeframe. Review both events and adjust attendance priority:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Event 1 */}
                <div
                  onClick={() => onSelectEvent(conflict.event1.id)}
                  className="bg-[#121212] hover:bg-[#1A1A1A] p-3 rounded-xl border border-red-900/30 hover:border-red-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>{conflict.event1.startTime} - {conflict.event1.endTime}</span>
                    <span className="text-red-400 font-bold">{conflict.event1.status}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
                    <span className="truncate">{conflict.event1.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1 text-zinc-500 group-hover:text-red-400" />
                  </h4>
                </div>

                {/* Event 2 */}
                <div
                  onClick={() => onSelectEvent(conflict.event2.id)}
                  className="bg-[#121212] hover:bg-[#1A1A1A] p-3 rounded-xl border border-red-900/30 hover:border-red-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>{conflict.event2.startTime} - {conflict.event2.endTime}</span>
                    <span className="text-red-400 font-bold">{conflict.event2.status}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-white group-hover:text-red-400 transition-colors flex items-center justify-between">
                    <span className="truncate">{conflict.event2.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1 text-zinc-500 group-hover:text-red-400" />
                  </h4>
                </div>
              </div>

            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
