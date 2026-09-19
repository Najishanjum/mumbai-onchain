import React, { useState } from 'react';
import type { EventItem, UserEventNote } from '../types/event';
import { Users, Lightbulb, CheckSquare, Save, Sparkles, FolderGit2, MessageSquare, Share2 } from 'lucide-react';

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
  const [contentIdea, setContentIdea] = useState(note?.contentIdea || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSave({
      peopleMet,
      projects,
      ideas,
      followups,
      takeaways,
      contentIdea,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-5">
      
      <div className="flex items-center justify-between border-b border-[#202020] pb-3">
        <div>
          <h3 className="font-heading font-bold text-lg text-white">MY PRIVATE NOTES</h3>
          <p className="font-mono text-xs text-zinc-500">For {event.title} • Synced locally & to your Supabase instance.</p>
        </div>

        <button
          onClick={handleSave}
          className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow-violet active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{savedSuccess ? 'SAVED!' : 'SAVE NOTES'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#4ADE80] font-mono text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4" /> Notes saved successfully!
        </div>
      )}

      {/* People Met */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#627EEA]" /> PEOPLE I MET
        </label>
        <textarea
          value={peopleMet}
          onChange={(e) => setPeopleMet(e.target.value)}
          placeholder="Names, X handles, Telegram contacts, team roles..."
          rows={3}
          className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-[#627EEA] focus:outline-none transition-colors"
        />
      </div>

      {/* Projects Discovered */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
          <FolderGit2 className="w-3.5 h-3.5 text-[#8B5CF6]" /> PROJECTS DISCOVERED
        </label>
        <textarea
          value={projects}
          onChange={(e) => setProjects(e.target.value)}
          placeholder="New protocols, GitHub repos, dApps, hackathon submissions..."
          rows={3}
          className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-[#8B5CF6] focus:outline-none transition-colors"
        />
      </div>

      {/* Ideas & Key Takeaways Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="space-y-1.5">
          <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" /> IDEAS & INSIGHTS
          </label>
          <textarea
            value={ideas}
            onChange={(e) => setIdeas(e.target.value)}
            placeholder="Product ideas, architectural concepts..."
            rows={3}
            className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-[#F59E0B] focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-[#22C55E]" /> ACTIONABLE FOLLOW-UPS
          </label>
          <textarea
            value={followups}
            onChange={(e) => setFollowups(e.target.value)}
            placeholder="Send DM to @builder, check docs for protocol..."
            rows={3}
            className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-[#22C55E] focus:outline-none transition-colors"
          />
        </div>

      </div>

      {/* Key Takeaways */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#627EEA]" /> KEY TAKEAWAYS
        </label>
        <textarea
          value={takeaways}
          onChange={(e) => setTakeaways(e.target.value)}
          placeholder="Main lessons learned, speaker takeaways..."
          rows={2}
          className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-[#627EEA] focus:outline-none transition-colors"
        />
      </div>

      {/* X Post Idea */}
      <div className="space-y-1.5">
        <label className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-[#3B82F6]" /> X / SOCIAL POST DRAFT
        </label>
        <textarea
          value={contentIdea}
          onChange={(e) => setContentIdea(e.target.value)}
          placeholder="Draft thread or key takeaway to post on X..."
          rows={2}
          className="w-full bg-[#101010] border border-[#222] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-[#3B82F6] focus:outline-none transition-colors"
        />
      </div>

    </div>
  );
};
