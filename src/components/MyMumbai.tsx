import React from 'react';
import type { EventItem, UserEventNote, EventStatus } from '../types/event';
import { PostEventRecap } from './PostEventRecap';
import { Activity, FileText } from 'lucide-react';

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
  // Calculated stats directly from database state
  const totalEvents = events.length;
  const attendingCount = events.filter(e => e.status === 'ATTENDING').length;
  const volunteerCount = events.filter(e => e.status === 'VOLUNTEER').length;
  const pendingCount = events.filter(e => e.status === 'PENDING' || e.status === 'PENDING APPROVAL').length;
  const completedCount = events.filter(e => e.status === 'COMPLETED').length;

  const notesList = Object.values(notes).filter(n => n.peopleMet || n.projects || n.takeaways);

  return (
    <div className="space-y-8">
      
      {/* Dashboard Top Header */}
      <div className="bg-[#0A0A0A] border border-[#202020] rounded-3xl p-6 sm:p-8 tech-grid shadow-card">
        <div className="flex items-center gap-2 font-mono text-xs text-[#8B5CF6] uppercase tracking-widest mb-1">
          <Activity className="w-3.5 h-3.5" />
          <span>PERSONAL MISSION CONTROL DASHBOARD</span>
        </div>
        <h2 className="font-heading font-extrabold text-3xl text-white tracking-wide">
          MY MUMBAI DASHBOARD
        </h2>
        <p className="font-mono text-xs text-zinc-400 mt-1">
          Personal trip telemetry, attendance metrics, networking logs, and post-event recaps for Nov 1–8, 2026.
        </p>
      </div>

      {/* Calculated Real Telemetry Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        <div className="bg-[#0A0A0A] border border-[#202020] p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">TOTAL EVENTS</span>
          <span className="font-mono text-3xl font-extrabold text-white mt-1">{totalEvents}</span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#22C55E]/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[10px] text-[#22C55E] uppercase tracking-widest">ATTENDING</span>
          <span className="font-mono text-3xl font-extrabold text-[#4ADE80] mt-1">{attendingCount}</span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#8B5CF6]/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <span className="font-mono text-[10px] text-[#8B5CF6] uppercase tracking-widest">VOLUNTEER</span>
          <span className="font-mono text-3xl font-extrabold text-[#C4B5FD] mt-1">{volunteerCount}</span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#F59E0B]/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-widest">PENDING</span>
          <span className="font-mono text-3xl font-extrabold text-[#FBBF24] mt-1">{pendingCount}</span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#202020] p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">COMPLETED</span>
          <span className="font-mono text-3xl font-extrabold text-zinc-300 mt-1">{completedCount}</span>
        </div>

        <div className="bg-[#0A0A0A] border border-[#627EEA]/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[10px] text-[#627EEA] uppercase tracking-widest">DAYS IN MUMBAI</span>
          <span className="font-mono text-3xl font-extrabold text-white mt-1">8</span>
        </div>

      </div>

      {/* Main Grid: Saved Notes Summary & Post-Event Recap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Saved Personal Notes Overview */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-[#0A0A0A] border border-[#202020] rounded-3xl p-6 space-y-4 shadow-card">
            <div className="flex items-center justify-between border-b border-[#202020] pb-3">
              <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8B5CF6]" />
                SAVED NOTES & NETWORK LOGS
              </h3>
              <span className="font-mono text-xs text-zinc-500">({notesList.length} LOGS)</span>
            </div>

            {notesList.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-500">
                No personal notes saved yet. Open any event drawer to log contacts and ideas!
              </div>
            ) : (
              <div className="space-y-4">
                {notesList.map((n) => {
                  const evt = events.find(e => e.id === n.eventId);
                  return (
                    <div
                      key={n.eventId}
                      onClick={() => onSelectEvent(n.eventId)}
                      className="p-4 rounded-2xl bg-[#121212] border border-[#222] hover:border-[#8B5CF6]/50 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex justify-between text-xs font-mono text-[#8B5CF6]">
                        <span className="font-bold">{evt?.title || n.eventId}</span>
                        <span className="text-zinc-500">{n.updatedAt.slice(0, 10)}</span>
                      </div>

                      {n.peopleMet && (
                        <div className="text-xs font-mono text-zinc-300">
                          <strong className="text-[#627EEA]">Met:</strong> {n.peopleMet}
                        </div>
                      )}

                      {n.projects && (
                        <div className="text-xs font-mono text-zinc-300">
                          <strong className="text-[#8B5CF6]">Discovered:</strong> {n.projects}
                        </div>
                      )}

                      {n.takeaways && (
                        <div className="text-xs font-mono text-zinc-300">
                          <strong className="text-[#F59E0B]">Takeaways:</strong> {n.takeaways}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Post-Event Recap Interactive Form */}
        <div className="lg:col-span-6">
          <PostEventRecap
            events={events}
            notes={notes}
            onSaveNote={onSaveNote}
            onUpdateStatus={onUpdateStatus}
          />
        </div>

      </div>

    </div>
  );
};
