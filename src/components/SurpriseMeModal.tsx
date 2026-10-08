import React from 'react';
import { usePeopleStore } from '../lib/usePeopleStore';
import { calculateMatchScore } from '../lib/matchingEngine';
import { X, UserPlus, ArrowRight, Compass, CheckCircle2 } from 'lucide-react';

interface SurpriseMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: (personId: string) => void;
}

export const SurpriseMeModal: React.FC<SurpriseMeModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
}) => {
  const { people, myProfile, connections, cycleConnection } = usePeopleStore();

  if (!isOpen) return null;

  // Filter out current user and existing connected contacts
  const candidates = people.filter(p => {
    if (p.isCurrentUser || (myProfile && p.id === myProfile.id)) return false;
    const status = connections[p.id];
    return status !== 'CONNECTED';
  });

  // Calculate scores and pick a serendipitous high match (e.g. between 80% and 94%)
  const scored = candidates.map(person => ({
    person,
    match: calculateMatchScore(myProfile, person, connections),
  })).sort((a, b) => b.match.overall - a.match.overall);

  // Pick candidate at index 1 or 2 if available to feel serendipitous rather than obvious #1
  const selected = scored.length > 1 ? scored[1] : (scored[0] || null);

  if (!selected) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className="bg-white p-6 max-w-sm w-full text-center space-y-3">
          <p className="font-mono text-sm">No new discovery candidates available right now.</p>
          <button onClick={onClose} className="px-4 py-2 bg-black text-white text-xs font-mono">CLOSE</button>
        </div>
      </div>
    );
  }

  const { person, match } = selected;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      role="dialog"
      aria-label="Surprise Discovery Modal"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-[#0F0F0F] text-[#FFFFFF] border-2 border-[#F97316] rounded-xl p-6 space-y-6 shadow-[0_0_35px_rgba(249,115,22,0.4)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
              <Compass className="w-4 h-4 animate-spin duration-3000" />
            </div>
            <div>
              <div className="font-mono text-[10px] text-[#F97316] uppercase font-bold tracking-widest">
                SERENDIPITOUS DISCOVERY
              </div>
              <div className="font-heading font-black text-base text-[#FFFFFF]">
                ✦ SURPRISE MATCH
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-[#333333] hover:border-[#666666] text-[#888888] hover:text-[#FFFFFF] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative Callout */}
        <div className="bg-[#181818] border border-[#2E2E2E] p-4 rounded-lg space-y-1">
          <div className="font-mono text-xs text-[#888888]">
            You weren't looking for them.
          </div>
          <div className="font-heading font-extrabold text-lg text-[#FFFFFF] flex items-center gap-2">
            <span>But you're an</span>
            <span className="text-[#F97316] font-black">{match.overall}% Match.</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#F97316] shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#262626] border-2 border-[#F97316] flex items-center justify-center font-bold text-lg text-white shrink-0">
                {person.name.charAt(0)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="font-heading font-black text-lg text-[#FFFFFF] truncate">
                {person.name}
              </div>
              <div className="font-mono text-xs text-[#22C55E] truncate">
                {person.category} • {person.city}
              </div>
              {person.headline && (
                <div className="font-sans text-xs text-[#A3A3A3] truncate mt-0.5">
                  {person.headline}
                </div>
              )}
            </div>
          </div>

          {/* Alignment points */}
          <div className="space-y-1.5 pt-2 border-t border-[#222222]">
            {match.reasons.slice(0, 3).map((reason, idx) => (
              <div key={idx} className="flex items-center gap-2 font-mono text-xs text-[#D4D4D4]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                <span className="truncate">{reason}</span>
              </div>
            ))}
          </div>

          {person.currentlyBuilding && (
            <div className="p-2.5 bg-[#1F1F1F] rounded border border-[#2B2B2B] font-mono text-[11px] text-[#A3A3A3]">
              <span className="text-white font-bold">Building: </span>
              {person.currentlyBuilding}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProfile(person.id);
            }}
            className="flex-1 py-3 px-4 bg-[#FFFFFF] hover:bg-[#E5E5E5] text-[#000000] font-heading font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
          >
            <span>MEET THEM</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              cycleConnection(person.id);
              onClose();
            }}
            className="py-3 px-4 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#3A3A3A] font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#22C55E]" />
            <span>CONNECT</span>
          </button>
        </div>

      </div>
    </div>
  );
};
