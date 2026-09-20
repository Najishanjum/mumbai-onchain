import React from 'react';
import type { EventItem, UserEventNote, EventStatus } from '../types/event';
import { PostEventRecap } from './PostEventRecap';
import { ArrowUpRight } from 'lucide-react';

interface MyMumbaiProps {
  events: EventItem[];
  notes: Record<string, UserEventNote>;
  onSelectEvent: (eventId: string) => void;
  onSaveNote: (eventId: string, noteData: Partial<UserEventNote>) => void;
  onUpdateStatus: (eventId: string, status: EventStatus) => void;
}

export const MyMumbai: React.FC<MyMumbaiProps> = ({
  events,
  notes,
  onSelectEvent,
  onSaveNote,
  onUpdateStatus,
}) => {
  const totalEvents = events.length;
  const attendingCount = events.filter(e => e.status === 'ATTENDING').length;
  const volunteerCount = events.filter(e => e.status === 'VOLUNTEER').length;
  const pendingCount = events.filter(e => e.status === 'PENDING' || e.status === 'PENDING APPROVAL').length;
  const completedCount = events.filter(e => e.status === 'COMPLETED').length;

  const notesList = Object.entries(notes).filter(([_, n]) => n.peopleMet || n.projects || n.takeaways);

  return (
    <div className="space-y-12 select-none">
      
      {/* Top Editorial Dashboard Header */}
      <div className="bg-[#FFFFFF] border border-[#000000] p-6 sm:p-10 space-y-4">
        <div className="font-mono text-xs text-[#666666] uppercase tracking-widest">
          TELEMETRY & PERSONAL MISSION REPORT
        </div>
        <h2 className="font-heading font-black text-5xl sm:text-7xl lg:text-8xl text-[#050505] leading-none tracking-tighter uppercase">
          MY<br />
          MUMBAI
        </h2>
        <p className="font-mono text-xs sm:text-sm text-[#444444] max-w-xl">
          A real-time command overview of verified tickets, volunteer assignments, and community meetings across 01—08 Nov 2026.
        </p>
      </div>

      {/* Giant Editorial Statistics (Section 24) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Total Events */}
        <div className="bg-[#FFFFFF] border border-[#000000] p-6 flex flex-col justify-between">
          <span className="font-mono text-xs font-bold text-[#666666] uppercase tracking-widest">
            EVENTS
          </span>
          <div className="mt-6">
            <span className="font-mono font-black text-6xl sm:text-7xl text-[#050505] leading-none block">
              {String(totalEvents).padStart(2, '0')}
            </span>
            <span className="font-mono text-[11px] text-[#888888] tracking-wider uppercase mt-2 block">
              TRACKED ONCHAIN
            </span>
          </div>
        </div>

        {/* Days in Mumbai */}
        <div className="bg-[#FFFFFF] border border-[#000000] p-6 flex flex-col justify-between">
          <span className="font-mono text-xs font-bold text-[#666666] uppercase tracking-widest">
            DAYS
          </span>
          <div className="mt-6">
            <span className="font-mono font-black text-6xl sm:text-7xl text-[#050505] leading-none block">
              08
            </span>
            <span className="font-mono text-[11px] text-[#888888] tracking-wider uppercase mt-2 block">
              NOV 01—08 2026
            </span>
          </div>
        </div>

        {/* Volunteer Missions */}
        <div className="bg-[#000000] text-[#FFFFFF] border-2 border-[#000000] p-6 flex flex-col justify-between">
          <span className="font-mono text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">
            VOLUNTEER
          </span>
          <div className="mt-6">
            <span className="font-mono font-black text-6xl sm:text-7xl text-[#FFFFFF] leading-none block">
              {String(volunteerCount).padStart(2, '0')}
            </span>
            <span className="font-mono text-[11px] text-[#F97316] font-bold tracking-wider uppercase mt-2 block">
              DEVCON 8 PRIMARY
            </span>
          </div>
        </div>

        {/* Attending */}
        <div className="bg-[#FFFFFF] border border-[#000000] p-6 flex flex-col justify-between">
          <span className="font-mono text-xs font-bold text-[#666666] uppercase tracking-widest">
            ATTENDING
          </span>
          <div className="mt-6">
            <span className="font-mono font-black text-6xl sm:text-7xl text-[#050505] leading-none block">
              {String(attendingCount).padStart(2, '0')}
            </span>
            <span className="font-mono text-[11px] text-[#888888] tracking-wider uppercase mt-2 block">
              CONFIRMED PASSES
            </span>
          </div>
        </div>

        {/* Pending & Completed */}
        <div className="bg-[#FFFFFF] border border-[#000000] p-6 flex flex-col justify-between">
          <span className="font-mono text-xs font-bold text-[#666666] uppercase tracking-widest">
            COMPLETED
          </span>
          <div className="mt-6">
            <span className="font-mono font-black text-6xl sm:text-7xl text-[#050505] leading-none block">
              {String(completedCount).padStart(2, '0')}
            </span>
            <span className="font-mono text-[11px] text-[#888888] tracking-wider uppercase mt-2 block">
              {pendingCount} STILL PENDING
            </span>
          </div>
        </div>

      </div>

      {/* Post Event Recap Form */}
      <PostEventRecap
        events={events}
        notes={notes}
        onSaveNote={onSaveNote}
        onUpdateStatus={onUpdateStatus}
      />

      {/* Section 25: MY ONCHAIN WEEK (Personal Journey & Journal Entries) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#000000] pb-4">
          <div>
            <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
              ARCHIVE & LOGBOOK
            </div>
            <h3 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] uppercase tracking-tight">
              MY ONCHAIN WEEK
            </h3>
          </div>
          <p className="font-mono text-xs text-[#555555]">
            Chronological notes, networking connections, and protocol ideas documented in Mumbai.
          </p>
        </div>

        {notesList.length === 0 ? (
          <div className="p-8 border border-dashed border-[#D8D8D8] text-center font-mono text-xs text-[#777777] bg-[#FAFAFA]">
            NO JOURNAL ENTRIES RECORDED YET. SELECT AN EVENT ABOVE TO ADD NOTES & REFLECTIONS.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notesList.map(([evtId, note]) => {
              const evt = events.find(e => e.id === evtId);
              return (
                <div
                  key={evtId}
                  className="border border-[#000000] bg-[#FFFFFF] p-6 space-y-4 font-mono text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#D8D8D8] pb-3">
                    <span className="font-pixel text-xs text-[#000000]">
                      [{evt?.startDate.slice(5) || 'NOV'}]
                    </span>
                    <button
                      onClick={() => onSelectEvent(evtId)}
                      className="font-bold underline hover:text-[#555555] flex items-center gap-1"
                    >
                      <span>VIEW EVENT</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-heading font-black text-xl text-[#050505]">
                    {evt?.title || 'Mumbai Session'}
                  </h4>

                  {note.peopleMet && (
                    <div className="space-y-1">
                      <span className="font-bold text-[#000000] block uppercase tracking-wider">
                        PEOPLE MET:
                      </span>
                      <p className="font-sans text-xs text-[#333333] bg-[#FAFAFA] p-2.5 border border-[#EAEAEA]">
                        {note.peopleMet}
                      </p>
                    </div>
                  )}

                  {note.takeaways && (
                    <div className="space-y-1">
                      <span className="font-bold text-[#000000] block uppercase tracking-wider">
                        TAKEAWAYS:
                      </span>
                      <p className="font-sans text-xs text-[#333333] bg-[#FAFAFA] p-2.5 border border-[#EAEAEA]">
                        {note.takeaways}
                      </p>
                    </div>
                  )}

                  {note.projects && (
                    <div className="space-y-1">
                      <span className="font-bold text-[#000000] block uppercase tracking-wider">
                        PROJECTS / IDEAS:
                      </span>
                      <p className="font-sans text-xs text-[#333333] bg-[#FAFAFA] p-2.5 border border-[#EAEAEA]">
                        {note.projects}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 text-[10px] text-[#888888] border-t border-[#EAEAEA]">
                    LAST UPDATED: {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
