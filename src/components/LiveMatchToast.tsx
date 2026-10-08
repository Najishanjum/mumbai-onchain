import React, { useState, useEffect } from 'react';
import type { PersonProfile } from '../types/person';
import { usePeopleStore } from '../lib/usePeopleStore';
import { calculateMatchScore } from '../lib/matchingEngine';
import { X, Sparkles, UserPlus, ArrowRight } from 'lucide-react';

const SEEN_MATCHES_KEY = 'mumbai_onchain_seen_matches_v2';

interface LiveMatchToastProps {
  onOpenProfile: (personId: string) => void;
}

export const LiveMatchToast: React.FC<LiveMatchToastProps> = ({ onOpenProfile }) => {
  const { people, myProfile, connections, cycleConnection } = usePeopleStore();
  const [activeCandidate, setActiveCandidate] = useState<PersonProfile | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Only attempt live toast when there are people and after a small initial mount delay
    const timer = setTimeout(() => {
      try {
        const seenRaw = localStorage.getItem(SEEN_MATCHES_KEY);
        const seenIds = new Set<string>(seenRaw ? JSON.parse(seenRaw) : []);

        // Filter out current user and already connected or seen people
        const available = people.filter(p => {
          if (p.isCurrentUser || (myProfile && p.id === myProfile.id)) return false;
          if (seenIds.has(p.id)) return false;
          const status = connections[p.id];
          return status !== 'CONNECTED';
        });

        // Find candidate with high match score (>= 85%)
        let bestCandidate: PersonProfile | null = null;
        let highestScore = 0;

        for (const person of available) {
          const match = calculateMatchScore(myProfile, person, connections);
          if (match.overall >= 85 && match.overall > highestScore) {
            highestScore = match.overall;
            bestCandidate = person;
          }
        }

        if (bestCandidate) {
          setActiveCandidate(bestCandidate);
          setIsVisible(true);
        }
      } catch (e) {
        console.error('Error in LiveMatchToast:', e);
      }
    }, 4500); // Friendly non-intrusive delay

    return () => clearTimeout(timer);
  }, [people, myProfile, connections]);

  const handleDismiss = () => {
    if (activeCandidate) {
      try {
        const seenRaw = localStorage.getItem(SEEN_MATCHES_KEY);
        const seenIds = new Set<string>(seenRaw ? JSON.parse(seenRaw) : []);
        seenIds.add(activeCandidate.id);
        localStorage.setItem(SEEN_MATCHES_KEY, JSON.stringify(Array.from(seenIds)));
      } catch (e) {
        console.error(e);
      }
    }
    setIsVisible(false);
  };

  const handleConnect = () => {
    if (activeCandidate) {
      cycleConnection(activeCandidate.id);
      handleDismiss();
    }
  };

  const handleView = () => {
    if (activeCandidate) {
      onOpenProfile(activeCandidate.id);
      handleDismiss();
    }
  };

  if (!isVisible || !activeCandidate) return null;

  const match = calculateMatchScore(myProfile, activeCandidate, connections);

  return (
    <aside
      aria-label="Live Match Notification"
      className="fixed bottom-24 right-3.5 sm:bottom-6 sm:left-6 z-40 max-w-sm w-[calc(100vw-1.75rem)] sm:w-88 bg-[#0F0F0F] text-[#FFFFFF] border-2 border-[#22C55E] rounded-xl p-4 shadow-[0_0_25px_rgba(34,197,94,0.35)] select-none animate-in slide-in-from-bottom-5 duration-300"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#22C55E]">
          <Sparkles className="w-3.5 h-3.5 text-[#22C55E] animate-pulse" />
          <span className="tracking-wider">✦ NEW BUILDER MATCH</span>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-[#888888] hover:text-[#FFFFFF] p-1 transition-colors cursor-pointer"
          aria-label="Dismiss match popup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {activeCandidate.avatar ? (
              <img
                src={activeCandidate.avatar}
                alt={activeCandidate.name}
                className="w-10 h-10 rounded-full object-cover border border-[#444444] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center font-bold text-xs text-white shrink-0">
                {activeCandidate.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-heading font-black text-sm text-[#FFFFFF] truncate">
                You × {activeCandidate.name}
              </div>
              <div className="font-mono text-[10.5px] text-[#888888] truncate">
                {activeCandidate.category} • {activeCandidate.city}
              </div>
            </div>
          </div>

          <div className="shrink-0 font-mono text-sm font-black px-2 py-1 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/40">
            {match.overall}%
          </div>
        </div>

        {/* 2 Reasons */}
        <div className="space-y-1 font-mono text-[11px] text-[#D4D4D4] bg-[#171717] p-2.5 rounded border border-[#262626]">
          {match.reasons.slice(0, 2).map((reason, idx) => (
            <div key={idx} className="flex items-center gap-1.5 truncate">
              <span className="text-[#22C55E]">•</span>
              <span className="truncate">{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#262626]">
        <button
          type="button"
          onClick={handleView}
          className="flex-1 py-1.5 px-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#3A3A3A] rounded font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>VIEW PROFILE</span>
          <ArrowRight className="w-3 h-3 text-[#888888]" />
        </button>

        <button
          type="button"
          onClick={handleConnect}
          className="py-1.5 px-3 bg-[#22C55E] hover:bg-[#16A34A] text-black font-heading font-black text-xs uppercase tracking-wide rounded transition-all flex items-center gap-1 shadow-sm cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>CONNECT</span>
        </button>
      </div>
    </aside>
  );
};
