import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Download, ExternalLink, ChevronDown } from 'lucide-react';
import type { EventItem } from '../types/event';
import { downloadICSFile, getGoogleCalendarUrl, getOutlookCalendarUrl } from '../lib/calendar';

interface CalendarButtonProps {
  event: EventItem;
  size?: 'sm' | 'md';
}

export const CalendarButton: React.FC<CalendarButtonProps> = ({ event, size = 'md' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1.5 text-xs' 
    : 'px-3.5 py-2 text-xs font-mono tracking-wider';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 bg-[#181818] hover:bg-[#222] text-[#F5F5F5] border border-[#333] rounded-lg transition-all duration-150 active:scale-95 ${sizeClasses}`}
        aria-label="Add to calendar options"
      >
        <Calendar className="w-4 h-4 text-[#627EEA]" />
        <span>ADD TO CALENDAR</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0F0F0F] border border-[#252525] shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 text-[10px] font-mono text-zinc-500 uppercase border-b border-[#202020]">
            Export Event
          </div>
          
          <button
            onClick={() => {
              window.open(getGoogleCalendarUrl(event), '_blank');
              setIsOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-mono text-zinc-200 hover:bg-[#1A1A1A] hover:text-white flex items-center justify-between border-b border-[#1A1A1A] transition-colors"
          >
            <span>Google Calendar</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          <button
            onClick={() => {
              downloadICSFile(event);
              setIsOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-mono text-zinc-200 hover:bg-[#1A1A1A] hover:text-white flex items-center justify-between border-b border-[#1A1A1A] transition-colors"
          >
            <span>Apple Calendar (.ics)</span>
            <Download className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          <button
            onClick={() => {
              window.open(getOutlookCalendarUrl(event), '_blank');
              setIsOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-mono text-zinc-200 hover:bg-[#1A1A1A] hover:text-white flex items-center justify-between border-b border-[#1A1A1A] transition-colors"
          >
            <span>Outlook Web</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          <button
            onClick={() => {
              downloadICSFile(event);
              setIsOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-mono text-[#627EEA] hover:bg-[#1A1A1A] hover:text-[#8299F0] flex items-center justify-between transition-colors"
          >
            <span>Download iCal File</span>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
