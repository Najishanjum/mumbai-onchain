import React, { useState, useEffect } from 'react';
import type { EventItem } from '../types/event';
import { getNextUpcomingEvent, isEventLiveNow, getEventStartDateTime } from '../lib/date';
import { Clock, MapPin, ArrowRight, Radio } from 'lucide-react';
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

  // Check if any event is currently live
  const liveEvents = events.filter(e => isEventLiveNow(e, now));
  const nextEvent = getNextUpcomingEvent(events, now);

  if (liveEvents.length > 0) {
    const current = liveEvents[0];
    return (
      <div className="w-full bg-[#120B0B] border border-red-500/40 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div>
              <span className="font-mono text-xs text-red-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE NOW IN MUMBAI
              </span>
              <h3 className="font-heading font-bold text-lg text-white mt-0.5">{current.title}</h3>
              <p className="font-mono text-xs text-zinc-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-red-400" /> {current.location} • {current.startTime}–{current.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={current.status} />
            <button
              onClick={() => onSelectEvent(current.id)}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 px-3.5 py-2 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>VIEW DETAILS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!nextEvent) {
    return (
      <div className="w-full bg-[#0A0A0A] border border-[#202020] rounded-2xl p-5 text-center font-mono text-xs text-zinc-500">
        NO UPCOMING EVENTS SCHEDULED FOR TODAY
      </div>
    );
  }

  const startDateTime = getEventStartDateTime(nextEvent);
  const diffMs = startDateTime ? startDateTime.getTime() - now.getTime() : 0;
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#222] rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-card hover:border-[#627EEA]/40 transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#627EEA] uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>NEXT UPCOMING EVENT</span>
          </div>

          <h3 className="font-heading font-bold text-xl text-white tracking-wide">
            {nextEvent.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-zinc-400 mt-2">
            <span>DATE: <strong className="text-zinc-200">{nextEvent.startDate}</strong></span>
            <span>•</span>
            <span>TIME: <strong className="text-zinc-200">{nextEvent.startTime}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#627EEA]" /> {nextEvent.location}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#202020] pt-3 md:pt-0 md:pl-6">
          {diffMs > 0 && (
            <div className="text-left md:text-right">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">STARTS IN</span>
              <span className="font-mono text-lg font-bold text-[#627EEA]">
                {diffHours > 0 ? `${diffHours}H ` : ''}{diffMins}M
              </span>
            </div>
          )}

          <button
            onClick={() => onSelectEvent(nextEvent.id)}
            className="bg-[#181818] hover:bg-[#222] text-white border border-[#333] px-4 py-2.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 ml-auto"
          >
            <span>VIEW EVENT</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#627EEA]" />
          </button>
        </div>

      </div>
    </div>
  );
};
