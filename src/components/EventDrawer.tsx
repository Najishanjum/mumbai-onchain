import React, { useState } from 'react';
import { X, ExternalLink, MapPin } from 'lucide-react';
import type { EventItem, UserEventNote, EventStatus } from '../types/event';
import { StatusBadge } from './StatusBadge';
import { CalendarButton } from './CalendarButton';
import { NotesPanel } from './NotesPanel';

interface EventDrawerProps {
  event: EventItem | null;
  note?: UserEventNote;
  onClose: () => void;
  onUpdateStatus: (eventId: string, newStatus: EventStatus) => void;
  onSaveNote: (eventId: string, noteData: Partial<UserEventNote>) => void;
}

export const EventDrawer: React.FC<EventDrawerProps> = ({
  event,
  note,
  onClose,
  onUpdateStatus,
  onSaveNote,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'notes'>('info');

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-end animate-in fade-in duration-150 select-none">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container (Editorial Side Panel) */}
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] border-l-2 border-[#000000] h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        
        {/* Header bar */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#000000] p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-base font-bold text-[#000000]">
              CATALOGUE ENTRY
            </span>
            <span className="text-[#999999]">•</span>
            <StatusBadge status={event.status} size="sm" />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Info vs Notes */}
        <div className="flex border-b border-[#D8D8D8] bg-[#FAFAFA] px-6">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`px-4 py-3 font-mono text-xs font-bold tracking-wider border-b-2 transition-all ${
              activeSubTab === 'info'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#777777] hover:text-[#000000]'
            }`}
          >
            01 // EVENT DETAILS
          </button>
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`px-4 py-3 font-mono text-xs font-bold tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'notes'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#777777] hover:text-[#000000]'
            }`}
          >
            <span>02 // MY NOTES & CONTACTS</span>
            {(note?.peopleMet || note?.takeaways) && (
              <span className="w-2 h-2 rounded-full bg-[#000000]" />
            )}
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="p-6 sm:p-8 flex-1 space-y-6">
          {activeSubTab === 'info' ? (
            <div className="space-y-6">
              
              {/* Event Title & Category */}
              <div>
                <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
                  CATEGORY: <span className="font-bold text-[#000000]">{event.category}</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#050505] uppercase tracking-tight leading-tight">
                  {event.title}
                </h2>
              </div>

              {/* Status Updater Radio/Button Group */}
              <div className="border border-[#D8D8D8] bg-[#FAFAFA] p-4 space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#666666] font-bold block">
                  UPDATE MY STATUS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['VOLUNTEER', 'ATTENDING', 'INTERESTED', 'PENDING', 'COMPLETED'] as EventStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateStatus(event.id, st)}
                      className={`px-2.5 py-1 font-mono text-xs transition-all border ${
                        event.status === st
                          ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                          : 'bg-[#FFFFFF] text-[#555555] border-[#D8D8D8] hover:border-[#000000] hover:text-[#000000]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Metadata Table */}
              <div className="border border-[#000000] divide-y divide-[#D8D8D8] font-mono text-xs">
                <div className="p-3.5 flex justify-between bg-[#FAFAFA]">
                  <span className="text-[#666666]">DATE:</span>
                  <span className="font-bold text-[#000000]">{event.startDate}</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-[#666666]">TIME:</span>
                  <span className="font-bold text-[#000000]">{event.startTime} — {event.endTime} IST</span>
                </div>
                <div className="p-3.5 flex justify-between bg-[#FAFAFA]">
                  <span className="text-[#666666]">ORGANIZER:</span>
                  <span className="font-bold text-[#000000]">{event.organizer}</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-[#666666]">LOCATION:</span>
                  <span className="font-bold text-[#000000] text-right">{event.location}</span>
                </div>
                {event.address && (
                  <div className="p-3.5 flex justify-between bg-[#FAFAFA]">
                    <span className="text-[#666666]">ADDRESS:</span>
                    <span className="text-[#333333] text-right max-w-xs">{event.address}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="space-y-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#666666] font-bold block">
                    OVERVIEW:
                  </span>
                  <p className="font-sans text-sm text-[#333333] leading-relaxed border-l-2 border-[#000000] pl-4">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4">
                <a
                  href={event.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-between bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-5 py-3.5 font-mono text-xs font-bold tracking-wider transition-all"
                >
                  <span>OPEN OFFICIAL EVENT PORTAL →</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {event.mapUrl && (
                  <a
                    href={event.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-between bg-transparent hover:bg-[#F5F5F5] text-[#000000] border border-[#000000] px-5 py-3.5 font-mono text-xs font-semibold tracking-wider transition-all"
                  >
                    <span>OPEN MAP DESTINATION →</span>
                    <MapPin className="w-4 h-4" />
                  </a>
                )}

                <div className="pt-2">
                  <CalendarButton event={event} size="md" />
                </div>
              </div>

            </div>
          ) : (
            <NotesPanel event={event} note={note} onSave={(data) => onSaveNote(event.id, data)} />
          )}
        </div>

        {/* Footer info strip */}
        <div className="p-4 bg-[#FAFAFA] border-t border-[#D8D8D8] text-[11px] font-mono text-[#777777] flex items-center justify-between">
          <span>MUMBAI // ONCHAIN WEEK 2026</span>
          <span>SAVED TO LOCAL STORAGE & SUPABASE</span>
        </div>

      </div>

    </div>
  );
};
