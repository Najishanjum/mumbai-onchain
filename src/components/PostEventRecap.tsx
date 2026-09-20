import React, { useState } from 'react';
import type { EventItem, UserEventNote, EventStatus } from '../types/event';

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

  const handleRecapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    onSaveNote(selectedEventId, {
      peopleMet,
      projects,
      takeaways,
    });

    onUpdateStatus(selectedEventId, 'COMPLETED');
    alert('Post-event journal entry saved! Event marked as COMPLETED.');
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#000000] p-6 sm:p-8 space-y-6 select-none">
      <div className="border-b border-[#D8D8D8] pb-4">
        <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
          POST-EVENT JOURNAL LOG
        </div>
        <h3 className="font-heading font-black text-2xl sm:text-3xl text-[#050505] tracking-tight uppercase">
          WHAT HAPPENED?
        </h3>
        <p className="font-mono text-xs text-[#555555] mt-1">
          Record your learnings, networking connections, and prototype discussions to archive your personal journey.
        </p>
      </div>

      <form onSubmit={handleRecapSubmit} className="space-y-4 font-mono text-xs">
        
        {/* Select Event */}
        <div className="space-y-1">
          <label className="text-[#000000] font-bold block uppercase tracking-wider">
            SELECT COMPLETED EVENT:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              const n = notes[e.target.value] || {};
              setPeopleMet(n.peopleMet || '');
              setProjects(n.projects || '');
              setTakeaways(n.takeaways || '');
            }}
            className="w-full bg-[#FAFAFA] border border-[#000000] text-[#000000] p-3 font-mono text-xs focus:outline-none"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                [{evt.startDate.slice(5)}] {evt.title} ({evt.status})
              </option>
            ))}
          </select>
        </div>

        {/* People Met */}
        <div className="space-y-1">
          <label className="text-[#000000] font-bold block uppercase tracking-wider">
            PEOPLE I MET & NETWORKING CONTACTS:
          </label>
          <textarea
            rows={3}
            value={peopleMet}
            onChange={(e) => setPeopleMet(e.target.value)}
            placeholder="Names, X handles, Telegram IDs, roles..."
            className="w-full bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] p-3 font-sans text-xs focus:outline-none"
          />
        </div>

        {/* Takeaways */}
        <div className="space-y-1">
          <label className="text-[#000000] font-bold block uppercase tracking-wider">
            KEY TAKEAWAYS & PROTOCOL REFLECTIONS:
          </label>
          <textarea
            rows={3}
            value={takeaways}
            onChange={(e) => setTakeaways(e.target.value)}
            placeholder="Key technical presentations, insights, ecosystem trends..."
            className="w-full bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] p-3 font-sans text-xs focus:outline-none"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-6 py-3 font-mono text-xs font-bold tracking-wider transition-all"
        >
          ARCHIVE ENTRY & MARK COMPLETED [✓]
        </button>

      </form>
    </div>
  );
};
