import React from 'react';
import { MapPin, ExternalLink, ShieldCheck, HeartHandshake, Sparkles, Tag } from 'lucide-react';
import type { EventItem } from '../types/event';
import { CalendarButton } from './CalendarButton';

interface PrimaryEventProps {
  event: EventItem;
  onSelectEvent: (eventId: string) => void;
}

export const PrimaryEvent: React.FC<PrimaryEventProps> = ({ event, onSelectEvent }) => {
  const bgImage = event.imageUrl || '/images/devcon8-keyvisual.png';

  return (
    <div className="w-full bg-[#0A0A0A] border-2 border-[#627EEA]/40 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#627EEA]/70 group">
      
      {/* Devcon VIII Key Visual Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage}
          alt="Devcon 8 India Artwork"
          className="w-full h-full object-cover object-center opacity-30 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-[#050505]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80" />
      </div>

      {/* Visual background accents */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-[#627EEA]/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute inset-0 tech-grid-dense opacity-30 pointer-events-none z-0" />

      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10 border-b border-[#202020] pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#627EEA] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#627EEA]"></span>
          </span>
          <span className="font-mono text-xs text-[#627EEA] font-bold tracking-widest uppercase">
            PRIMARY MISSION // FEATURED EVENT
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(139,92,246,0.3)]">
            <HeartHandshake className="w-3.5 h-3.5 text-[#A78BFA]" />
            VOLUNTEER (PRIMARY PRIORITY)
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/40 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            ATTENDING
          </span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column: Title & Main Info */}
        <div className="lg:col-span-8">
          <div className="font-mono text-xs text-zinc-400 tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#627EEA]" />
            ORGANIZER: <span className="text-white font-semibold">{event.organizer}</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            {event.title}
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl font-sans">
            {event.description}
          </p>

          {/* Devcon Tracks */}
          {event.devconTracks && (
            <div className="mb-6">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3 text-zinc-400" /> Track Focus Areas:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {event.devconTracks.map((track, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#141414] text-zinc-300 border border-[#262626] hover:border-[#627EEA]/40 transition-colors"
                  >
                    {track}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location & Dates Quick Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#121212] p-4 rounded-2xl border border-[#222]">
            <div>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">DATES</span>
              <span className="font-mono text-base font-bold text-white">03—06 NOV 2026</span>
              <span className="font-mono text-xs text-zinc-400 block">09:00 - 18:00 IST</span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">VENUE</span>
              <span className="font-mono text-base font-bold text-white block truncate">{event.location}</span>
              <span className="font-mono text-xs text-zinc-400 block truncate">{event.address}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Planner Disclaimer */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-4">
          
          <div className="bg-[#121212] border border-[#222] p-5 rounded-2xl space-y-3">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider block">QUICK ACTIONS</span>
            
            <a
              href={event.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#627EEA] hover:bg-[#526DDA] text-white px-4 py-3 rounded-xl font-mono text-xs font-bold tracking-wider transition-all duration-200 shadow-glow-eth active:scale-95"
            >
              <span>VIEW OFFICIAL EVENT</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {event.mapUrl && (
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#181818] hover:bg-[#222] text-white border border-[#333] px-4 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-150 active:scale-95"
              >
                <MapPin className="w-4 h-4 text-[#22C55E]" />
                <span>OPEN VENUE MAP</span>
              </a>
            )}

            <div className="w-full">
              <CalendarButton event={event} size="md" />
            </div>

            <button
              onClick={() => onSelectEvent(event.id)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#1C1C1C] text-zinc-300 border border-[#2B2B2B] px-4 py-2.5 rounded-xl font-mono text-xs tracking-wider transition-colors"
            >
              <span>OPEN MY NOTES & DETAILS</span>
            </button>
          </div>

          {/* Personal Planner Disclaimer */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-3 rounded-xl text-[11px] font-mono text-zinc-500 leading-tight">
            <span className="text-zinc-400 font-bold block mb-1">PERSONAL EVENT PLANNER NOTICE</span>
            This is a personal trip command center built by Najish Anjum for Devcon 8. Not affiliated with Ethereum Foundation.
          </div>

        </div>

      </div>
    </div>
  );
};
