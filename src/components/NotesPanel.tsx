import React, { useState } from 'react';
import type { EventItem, UserEventNote } from '../types/event';
import { Save, Check } from 'lucide-react';

interface NotesPanelProps {
  event: EventItem;
  note?: UserEventNote;
  onSave: (noteData: Partial<UserEventNote>) => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ event, note, onSave }) => {
  const [peopleMet, setPeopleMet] = useState(note?.peopleMet || '');
  const [projects, setProjects] = useState(note?.projects || '');
  const [ideas, setIdeas] = useState(note?.ideas || '');
  const [followups, setFollowups] = useState(note?.followups || '');
  const [takeaways, setTakeaways] = useState(note?.takeaways || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSave({
      peopleMet,
      projects,
      ideas,
      followups,
      takeaways,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      
      <div className="flex items-center justify-between border-b border-[#D8D8D8] pb-3">
        <div>
          <h3 className="font-heading font-black text-xl text-[#050505]">MY PRIVATE NOTES</h3>
          <p className="text-[#666666] text-[11px]">For {event.title} • Synced to browser & Supabase</p>
        </div>

        <button
          onClick={handleSave}
          className="bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-4 py-2 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>SAVED!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>SAVE NOTES</span>
            </>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-[#FAFAFA] border border-[#000000] text-[#000000] p-3 font-bold flex items-center gap-2">
          <span>✓ Notes saved successfully.</span>
        </div>
      )}

      {/* People Met */}
      <div className="space-y-1.5">
        <label className="text-[#050505] font-bold block uppercase tracking-wider">
          01 // PEOPLE I MET / TELEGRAM / X HANDLES:
        </label>
        <textarea
          rows={3}
          value={peopleMet}
          onChange={(e) => setPeopleMet(e.target.value)}
          placeholder="@vitalikbuterin, builders from Optimism, researchers..."
          className="w-full bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] p-3 font-sans text-xs focus:outline-none placeholder:text-[#999999]"
        />
      </div>

      {/* Key Takeaways */}
      <div className="space-y-1.5">
        <label className="text-[#050505] font-bold block uppercase tracking-wider">
          02 // KEY TAKEAWAYS & PROTOCOL LEARNINGS:
        </label>
        <textarea
          rows={3}
          value={takeaways}
          onChange={(e) => setTakeaways(e.target.value)}
          placeholder="New zero-knowledge rollup architectures, L2 state validation insights..."
          className="w-full bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] p-3 font-sans text-xs focus:outline-none placeholder:text-[#999999]"
        />
      </div>

      {/* Projects Discussed */}
      <div className="space-y-1.5">
        <label className="text-[#050505] font-bold block uppercase tracking-wider">
          03 // PROJECTS & PROTOTYPES DISCUSSED:
        </label>
        <textarea
          rows={2}
          value={projects}
          onChange={(e) => setProjects(e.target.value)}
          placeholder="Hackathon ideas, cross-chain bridge experiments..."
          className="w-full bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] p-3 font-sans text-xs focus:outline-none placeholder:text-[#999999]"
        />
      </div>

      {/* Follow-ups */}
      <div className="space-y-1.5">
        <label className="text-[#050505] font-bold block uppercase tracking-wider">
          04 // ACTION ITEMS & FOLLOW-UPS:
        </label>
        <textarea
          rows={2}
          value={followups}
          onChange={(e) => setFollowups(e.target.value)}
          placeholder="Send follow-up DM on X, test smart contract demo..."
          className="w-full bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] p-3 font-sans text-xs focus:outline-none placeholder:text-[#999999]"
        />
      </div>

      {/* Ideas */}
      <div className="space-y-1.5">
        <label className="text-[#050505] font-bold block uppercase tracking-wider">
          05 // PROTOCOL IDEAS & BRAINSTORMS:
        </label>
        <textarea
          rows={2}
          value={ideas}
          onChange={(e) => setIdeas(e.target.value)}
          placeholder="Sudden architecture concepts, product pivots..."
          className="w-full bg-[#FAFAFA] border border-[#D8D8D8] focus:border-[#000000] p-3 font-sans text-xs focus:outline-none placeholder:text-[#999999]"
        />
      </div>

    </div>
  );
};
