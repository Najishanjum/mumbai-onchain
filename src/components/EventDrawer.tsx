import React, { useState } from 'react';
import { X, ExternalLink, MapPin, Clock, CheckCircle2, FileText } from 'lucide-react';
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

  const isCompleted = event.status === 'COMPLETED';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container (Right side on desktop, bottom sheet on mobile) */}
      <div className="relative w-full max-w-2xl bg-[#0A0A0A] border-l border-[#202020] h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        
        {/* Header bar */}
        <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 border-b border-[#202020] p-4 sm:p-6 flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <StatusBadge status={event.status} size="md" />
            <span className="font-mono text-xs text-zinc-400 uppercase">{event.category}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#141414] hover:bg-[#1F1F1F] text-zinc-400 hover:text-white border border-[#2B2B2B] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher for Drawer: Event Info vs Personal Notes */}
        <div className="flex border-b border-[#202020] bg-[#0E0E0E] px-6">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`px-4 py-3 font-mono text-xs font-semibold tracking-wider border-b-2 transition-all ${
              activeSubTab === 'info'
                ? 'border-[#627EEA] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            EVENT INFORMATION
          </button>

          <button
            onClick={() => setActiveSubTab('notes')}
            className={`px-4 py-3 font-mono text-xs font-semibold tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'notes'
                ? 'border-[#8B5CF6] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" />
            MY PERSONAL NOTES & RECAP
            {(note?.peopleMet || note?.takeaways) && (
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          
          {activeSubTab === 'info' ? (
            <div className="space-y-6">
              
              {/* Event Title & Organizer */}
              <div>
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-2">
                  {event.title}
                </h2>
                <p className="font-mono text-xs text-zinc-400">
                  Organized by: <span className="text-white font-semibold">{event.organizer}</span>
                </p>
              </div>

              {/* Status Update Control */}
              <div className="bg-[#121212] border border-[#222] p-4 rounded-2xl space-y-2">
                <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-widest block">UPDATE ATTENDANCE STATUS</span>
                <div className="flex flex-wrap gap-2">
                  {(['VOLUNTEER', 'ATTENDING', 'INTERESTED', 'PENDING', 'COMPLETED'] as EventStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateStatus(event.id, st)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                        event.status === st
                          ? 'bg-[#627EEA] text-white font-bold border border-[#627EEA]'
                          : 'bg-[#181818] text-zinc-400 hover:text-white border border-[#262626]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time & Venue Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#101010] p-4 rounded-2xl border border-[#202020] space-y-1">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#627EEA]" /> DATE & TIME
                  </span>
                  <div className="font-mono text-sm font-bold text-white">{event.startDate}</div>
                  <div className="font-mono text-xs text-zinc-400">{event.startTime} - {event.endTime} IST</div>
                </div>

                <div className="bg-[#101010] p-4 rounded-2xl border border-[#202020] space-y-1">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#22C55E]" /> VENUE LOCATION
                  </span>
                  <div className="font-mono text-sm font-bold text-white truncate">{event.location}</div>
                  <div className="font-mono text-xs text-zinc-400 truncate">{event.address || 'Mumbai, Maharashtra'}</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-mono text-xs text-zinc-400 uppercase tracking-widest">ABOUT THIS EVENT</h4>
                <p className="text-zinc-300 text-sm leading-relaxed font-sans bg-[#101010] p-4 rounded-2xl border border-[#202020]">
                  {event.description || 'No detailed description available for this event.'}
                </p>
              </div>

              {/* Devcon Tracks if applicable */}
              {event.devconTracks && (
                <div className="space-y-2">
                  <h4 className="font-mono text-xs text-zinc-400 uppercase tracking-widest">DEVCON TRACK FOCUS</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {event.devconTracks.map((tr, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] text-zinc-300 border border-[#262626]">
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#202020] space-y-3">
                <a
                  href={event.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#627EEA] hover:bg-[#526DDA] text-white px-5 py-3 rounded-xl font-mono text-xs font-bold tracking-wider transition-all shadow-glow-eth"
                >
                  <span>OPEN OFFICIAL EVENT WEBSITE</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {event.mapUrl && (
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 bg-[#181818] hover:bg-[#222] text-white border border-[#333] px-4 py-2.5 rounded-xl font-mono text-xs font-semibold"
                    >
                      <MapPin className="w-4 h-4 text-[#22C55E]" />
                      <span>OPEN MAP</span>
                    </a>
                  )}

                  <div className="w-full sm:w-1/2">
                    <CalendarButton event={event} size="md" />
                  </div>
                </div>

                <button
                  onClick={() => onUpdateStatus(event.id, isCompleted ? 'ATTENDING' : 'COMPLETED')}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold border transition-all ${
                    isCompleted
                      ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      : 'bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#4ADE80] border-[#22C55E]/40'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isCompleted ? 'MARKED COMPLETED' : 'MARK COMPLETED'}</span>
                </button>
              </div>

            </div>
          ) : (
            <NotesPanel
              event={event}
              note={note}
              onSave={(noteData) => onSaveNote(event.id, noteData)}
            />
          )}

        </div>

      </div>
    </div>
  );
};
