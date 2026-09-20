import React, { useState, useEffect } from 'react';
import type { EventItem } from '../types/event';
import { getNextUpcomingEvent, isEventLiveNow } from '../lib/date';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface NextEventProps {
  events: EventItem[];
  onSelectEvent: (eventId: string) => void;
}

export const NextEvent: React.FC<NextEventProps> = ({ events, onSelectEvent }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const liveEvents = events.filter(e => isEventLiveNow(e, now));
  const nextEvent = getNextUpcomingEvent(events, now);

  if (liveEvents.length > 0) {
    const current = liveEvents[0];
    return (
      <div className="w-full bg-[#FFFFFF] border-2 border-[#000000] p-5 sm:p-6 select-none shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-[#EF4444] animate-ping shrink-0" />
            <div>
              <span className="font-mono text-xs text-[#DC2626] font-bold uppercase tracking-widest block">
                ● LIVE NOW IN MUMBAI
              </span>
              <h3 className="font-heading font-black text-xl text-[#050505] mt-0.5">{current.title}</h3>
              <p className="font-mono text-xs text-[#555555] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#000000]" /> {current.location} • {current.startTime}—{current.endTime} IST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={current.status} />
            <button
              onClick={() => onSelectEvent(current.id)}
              className="bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-4 py-2 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span>VIEW DETAILS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!nextEvent) {
    return null;
  }

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#000000] p-4 sm:p-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="font-mono text-[11px] text-[#666666] uppercase tracking-wider font-bold">
            NEXT UP ON CALENDAR:
          </div>
          <h4 className="font-heading font-black text-lg text-[#050505]">
            {nextEvent.title}
          </h4>
          <div className="font-mono text-xs text-[#555555] flex items-center gap-2">
            <span>{nextEvent.startDate}</span>
            <span>•</span>
            <span>{nextEvent.startTime} — {nextEvent.endTime} IST</span>
            <span>•</span>
            <span className="text-[#000000] font-semibold">{nextEvent.location}</span>
          </div>
        </div>

        <button
          onClick={() => onSelectEvent(nextEvent.id)}
          className="bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-4 py-2 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-center"
        >
          <span>EVENT BRIEF →</span>
        </button>
      </div>
    </div>
  );
};
