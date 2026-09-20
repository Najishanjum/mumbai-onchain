import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ExternalLink, ChevronDown, Download } from 'lucide-react';
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
    ? 'px-2.5 py-1 text-[11px]' 
    : 'px-3.5 py-2 text-xs font-mono tracking-wider';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 bg-[#FFFFFF] hover:bg-[#F5F5F5] text-[#000000] border border-[#000000] font-mono transition-all duration-150 active:scale-95 ${sizeClasses}`}
        aria-label="Add to calendar options"
      >
        <Calendar className="w-3.5 h-3.5 text-[#000000]" />
        <span>CALENDAR</span>
        <ChevronDown className={`w-3 h-3 text-[#555555] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-[#FFFFFF] border border-[#000000] shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
          <div className="px-3 py-1.5 text-[10px] font-mono text-[#777777] uppercase border-b border-[#EAEAEA] bg-[#FAFAFA]">
            ADD TO CALENDAR
          </div>
          
          <button
            onClick={() => {
              window.open(getGoogleCalendarUrl(event), '_blank');
              setIsOpen(false);
            }}
            className="w-full text-left px-3.5 py-2 text-xs font-mono text-[#000000] hover:bg-[#F5F5F5] flex items-center justify-between border-b border-[#EAEAEA] transition-colors"
          >
            <span>Google Calendar</span>
            <ExternalLink className="w-3 h-3 text-[#777777]" />
          </button>

          <button
            onClick={() => {
              window.open(getOutlookCalendarUrl(event), '_blank');
              setIsOpen(false);
            }}
            className="w-full text-left px-3.5 py-2 text-xs font-mono text-[#000000] hover:bg-[#F5F5F5] flex items-center justify-between border-b border-[#EAEAEA] transition-colors"
          >
            <span>Outlook Web</span>
            <ExternalLink className="w-3 h-3 text-[#777777]" />
          </button>

          <button
            onClick={() => {
              downloadICSFile(event);
              setIsOpen(false);
            }}
            className="w-full text-left px-3.5 py-2 text-xs font-mono text-[#000000] hover:bg-[#F5F5F5] flex items-center justify-between transition-colors"
          >
            <span>Apple / iCal (.ics)</span>
            <Download className="w-3 h-3 text-[#777777]" />
          </button>
        </div>
      )}
    </div>
  );
};
