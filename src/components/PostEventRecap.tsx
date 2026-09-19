import React, { useState } from 'react';
import type { EventItem, UserEventNote, EventStatus } from '../types/event';
import { CheckCircle2, Sparkles, Users, FolderGit2, Lightbulb, Share2 } from 'lucide-react';

interface PostEventRecapProps {
  events: EventItem[];
  notes: Record<string, UserEventNote>;
  onSaveNote: (eventId: string, noteData: Partial<UserEventNote>) => void;
  onUpdateStatus: (eventId: string, status: EventStatus) => void;
}

export const PostEventRecap: React.FC<PostEventRecapProps> = ({
  events,
  notes,
  onSaveNote,
  onUpdateStatus,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const currentNote = notes[selectedEventId] || {};

  const [peopleMet, setPeopleMet] = useState(currentNote.peopleMet || '');
  const [projects, setProjects] = useState(currentNote.projects || '');
  const [takeaways, setTakeaways] = useState(currentNote.takeaways || '');
  const [contentIdea, setContentIdea] = useState(currentNote.contentIdea || '');

  const handleRecapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    onSaveNote(selectedEventId, {
      peopleMet,
      projects,
      takeaways,
      contentIdea,
    });

    onUpdateStatus(selectedEventId, 'COMPLETED');
    alert('Post-event recap saved and event marked COMPLETED!');
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#202020] rounded-3xl p-6 sm:p-8 space-y-6 tech-grid shadow-card">
      <div className="border-b border-[#202020] pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[#8B5CF6] uppercase tracking-widest mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>POST-EVENT RECAP & REFLECTION</span>
        </div>
        <h3 className="font-heading font-extrabold text-2xl text-white tracking-wide">
          WHAT HAPPENED?
        </h3>
        <p className="font-mono text-xs text-zinc-400 mt-0.5">
          Record your networking, learnings, and key takeaways after attending an event in Mumbai.
        </p>
      </div>

      <form onSubmit={handleRecapSubmit} className="space-y-4">
        
        {/* Select Event */}
        <div>
          <label className="font-mono text-xs text-zinc-300 font-semibold block mb-1">SELECT EVENT TO RECAP</label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              const n = notes[e.target.value] || {};
              setPeopleMet(n.peopleMet || '');
              setProjects(n.projects || '');
              setTakeaways(n.takeaways || '');
              setContentIdea(n.contentIdea || '');
            }}
            className="w-full bg-[#121212] border border-[#222] rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-[#8B5CF6]"
          >
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.startDate} — {e.title} ({e.status})
              </option>
            ))}
          </select>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-[#627EEA]" /> PEOPLE I MET
            </label>
            <textarea
              value={peopleMet}
              onChange={(e) => setPeopleMet(e.target.value)}
              placeholder="Names, X handles, Telegram..."
              rows={3}
              className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-white"
            />
          </div>

          <div>
            <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5 mb-1">
              <FolderGit2 className="w-3.5 h-3.5 text-[#8B5CF6]" /> PROJECTS DISCOVERED
            </label>
            <textarea
              value={projects}
              onChange={(e) => setProjects(e.target.value)}
              placeholder="Cool protocols, repos, repos..."
              rows={3}
              className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-white"
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" /> KEY TAKEAWAYS & HIGHLIGHTS
          </label>
          <textarea
            value={takeaways}
            onChange={(e) => setTakeaways(e.target.value)}
            placeholder="Main insights gained during session/talk..."
            rows={2}
            className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-white"
          />
        </div>

        <div>
          <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5 mb-1">
            <Share2 className="w-3.5 h-3.5 text-[#3B82F6]" /> X / CONTENT POST IDEA
          </label>
          <textarea
            value={contentIdea}
            onChange={(e) => setContentIdea(e.target.value)}
            placeholder="Draft tweet or post takeaway..."
            rows={2}
            className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-glow-violet active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>MARK COMPLETED & SAVE RECAP</span>
        </button>

      </form>
    </div>
  );
};
