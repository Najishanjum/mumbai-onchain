import React from 'react';
import { ExternalLink, MapPin, Tag } from 'lucide-react';
import type { EventItem } from '../types/event';
import { CalendarButton } from './CalendarButton';

interface PrimaryEventProps {
  event: EventItem;
  onSelectEvent: (eventId: string) => void;
}

export const PrimaryEvent: React.FC<PrimaryEventProps> = ({ event, onSelectEvent }) => {
  return (
    <section className="w-full bg-[#FFFFFF] border-2 border-[#000000] p-6 sm:p-10 lg:p-12 relative overflow-hidden select-none">
      
      {/* Top Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D8D8] pb-4 mb-8">
        <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-[#050505]">
          <span className="w-2.5 h-2.5 bg-[#000000]" />
          <span>PRIMARY MISSION // 01</span>
        </div>
        <div className="font-mono text-xs text-[#555555]">
          PERSONAL EVENT PLAN • JIO WORLD CENTRE, BKC
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Giant Editorial Typography & Event Metadata */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Big Date Anchor */}
          <div className="flex items-baseline gap-3">
            <span className="font-pixel text-3xl sm:text-4xl text-[#050505]">03—06</span>
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#050505] tracking-tight">NOV 2026</span>
          </div>

          {/* Huge Editorial Heading */}
          <div>
            <h2 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl text-[#050505] leading-[0.95] uppercase tracking-tighter">
              DEVCON 8<br />
              <span className="font-light text-[#555555]">INDIA</span>
            </h2>
          </div>

          {/* Organizer & Location */}
          <div className="space-y-1 font-mono text-xs sm:text-sm text-[#333333] border-l-2 border-[#000000] pl-4">
            <div className="font-bold text-[#000000] uppercase tracking-wider">
              BY: ETHEREUM FOUNDATION
            </div>
            <div>
              JIO WORLD CENTRE • BANDRA KURLA COMPLEX (BKC), MUMBAI
            </div>
            <div className="text-[#666666]">
              09:00 — 18:00 IST • 4 DAYS OF IMMERSION
            </div>
          </div>

          {/* Description */}
          <p className="font-sans text-sm sm:text-base text-[#333333] leading-relaxed max-w-xl">
            {event.description}
          </p>

          {/* Volunteer Status (Giant Typographic Treatment as requested) */}
          <div className="border border-[#D8D8D8] bg-[#FAFAFA] p-5 space-y-2">
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#666666]">
              MY ROLE // ATTENDANCE STATUS
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="font-heading font-black text-3xl sm:text-5xl text-[#000000] tracking-tight">
                VOLUNTEER
              </span>
              <span className="font-mono text-xs sm:text-sm text-[#555555] font-semibold">
                + FULL ATTENDEE PASS
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#777777]">
              Selected for on-ground community & production support at Devcon 8.
            </p>
          </div>

          {/* Devcon Tracks */}
          {event.devconTracks && (
            <div className="space-y-2 pt-2">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#666666] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Devcon Track Focus:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {event.devconTracks.map((track, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[11px] px-2.5 py-1 bg-[#FFFFFF] text-[#111111] border border-[#D8D8D8]"
                  >
                    {track}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: High-Contrast Black Information Panel & CTAs */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-[#000000] text-[#FFFFFF] p-6 sm:p-8 space-y-6">
            
            <div>
              <span className="font-mono text-[10px] text-[#A0A0A0] uppercase tracking-widest block mb-1">
                EXHIBITION / EVENT TELEMETRY
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#FFFFFF] uppercase tracking-wide">
                COMMAND ACTIONS
              </h3>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-3">
              <a
                href={event.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-between bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#000000] px-5 py-3.5 font-mono text-xs font-bold tracking-wider transition-all duration-150 active:scale-98"
              >
                <span>VIEW DEVCON 8 →</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {event.mapUrl && (
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-between bg-transparent hover:bg-[#1A1A1A] text-[#FFFFFF] border border-[#444444] hover:border-[#FFFFFF] px-5 py-3.5 font-mono text-xs font-semibold tracking-wider transition-all duration-150 active:scale-98"
                >
                  <span>OPEN VENUE MAP (BKC) →</span>
                  <MapPin className="w-4 h-4 text-[#FFFFFF]" />
                </a>
              )}

              <button
                onClick={() => onSelectEvent(event.id)}
                className="w-full inline-flex items-center justify-between bg-transparent hover:bg-[#1A1A1A] text-[#CCCCCC] hover:text-[#FFFFFF] border border-[#333333] px-5 py-3 font-mono text-xs tracking-wider transition-colors"
              >
                <span>OPEN MY DEVCON NOTES →</span>
                <span className="font-pixel text-[10px]">[01]</span>
              </button>
            </div>

            {/* Calendar Export */}
            <div className="pt-2 border-t border-[#222222]">
              <CalendarButton event={event} size="md" />
            </div>

          </div>

          {/* Personal Event Planner Disclaimer Box */}
          <div className="border border-[#D8D8D8] bg-[#FAFAFA] p-4 text-[11px] font-mono text-[#555555] leading-relaxed">
            <span className="font-bold text-[#050505] block mb-0.5">PERSONAL EVENT PLAN NOTICE</span>
            This is an independent personal command center created by Najish Anjum for Devcon 8 and Mumbai Onchain Week. Not an official Ethereum Foundation portal.
          </div>

        </div>

      </div>

    </section>
  );
};
