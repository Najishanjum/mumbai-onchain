import React, { useState, useEffect } from 'react';
import type { PersonProfile } from '../types/person';
import { usePeopleStore } from '../lib/usePeopleStore';
import { calculateMatchScore } from '../lib/matchingEngine';
import { Zap, Clock, Users, MessageSquare, MapPin, X, CheckCircle } from 'lucide-react';

interface BuilderSpeedMatchProps {
  onOpenProfile: (personId: string) => void;
}

const SPEED_MATCH_STORAGE_KEY = 'mumbai_onchain_speed_match_session_v2';

export const BuilderSpeedMatch: React.FC<BuilderSpeedMatchProps> = ({ onOpenProfile }) => {
  const { people, myProfile, connections } = usePeopleStore();

  // Countdown timer in seconds (starts at 3 mins 42 secs = 222s)
  const [timeLeft, setTimeLeft] = useState<number>(222);
  const [matchedCandidate, setMatchedCandidate] = useState<PersonProfile | null>(() => {
    try {
      const saved = localStorage.getItem(SPEED_MATCH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
  const [irlStatus, setIrlStatus] = useState<string | null>(null);

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 240));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTriggerMatch = () => {
    // Pick best compatible match
    const candidates = people.filter(p => !p.isCurrentUser && (!myProfile || p.id !== myProfile.id));
    if (candidates.length === 0) return;

    const sorted = [...candidates].sort((a, b) => {
      const scoreA = calculateMatchScore(myProfile, a, connections).overall;
      const scoreB = calculateMatchScore(myProfile, b, connections).overall;
      return scoreB - scoreA;
    });

    const chosen = sorted[0];
    setMatchedCandidate(chosen);
    try {
      localStorage.setItem(SPEED_MATCH_STORAGE_KEY, JSON.stringify(chosen));
    } catch {}
    setIsMatchModalOpen(true);
  };

  const handleMeetIRL = () => {
    setIrlStatus('IRL Rendezvous invite broadcasted at Jio World Centre!');
    setTimeout(() => setIrlStatus(null), 3500);
  };

  const handleStartChat = () => {
    if (!matchedCandidate) return;
    if (matchedCandidate.telegramHandle) {
      window.open(`https://t.me/${matchedCandidate.telegramHandle.replace('@', '')}`, '_blank');
    } else if (matchedCandidate.xHandle) {
      window.open(`https://x.com/${matchedCandidate.xHandle.replace('@', '')}`, '_blank');
    } else {
      setIrlStatus('Social link not provided by candidate.');
      setTimeout(() => setIrlStatus(null), 2500);
    }
  };

  const matchScore = matchedCandidate
    ? calculateMatchScore(myProfile, matchedCandidate, connections)
    : null;

  return (
    <>
      {/* Visual Live Networking Strip Widget */}
      <div className="bg-[#0A0A0A] border-2 border-[#000000] text-white p-5 sm:p-6 space-y-4 select-none shadow-[5px_5px_0px_0px_rgba(34,197,94,1)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#22C55E]">
              <Zap className="w-3.5 h-3.5 fill-[#22C55E]" />
              <span>LIVE NETWORKING // ROUND-ROBIN SESSION</span>
            </div>
            <h3 className="font-heading font-black text-xl sm:text-2xl tracking-tight text-white uppercase">
              ⚡ 15 MIN BUILDER MATCH
            </h3>
            <p className="font-mono text-xs text-[#A3A3A3] max-w-xl">
              Meet someone new during Mumbai Onchain Week. Algorithmic pairing based on skills, dev tools, and active event locations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Countdown Box */}
            <div className="bg-[#141414] border border-[#2E2E2E] px-4 py-2.5 rounded-lg text-center font-mono">
              <div className="text-[10px] text-[#777777] uppercase tracking-wider flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-[#F97316]" />
                <span>NEXT SESSION</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-pixel mt-0.5">
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Match Button */}
            <button
              type="button"
              onClick={handleTriggerMatch}
              className="px-5 py-3.5 bg-[#22C55E] hover:bg-[#16A34A] text-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>FIND MATCH NOW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Match Result Modal */}
      {isMatchModalOpen && matchedCandidate && matchScore && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-label="Speed Match Result"
        >
          <div className="absolute inset-0" onClick={() => setIsMatchModalOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-[#0F0F0F] text-[#FFFFFF] border-2 border-[#22C55E] rounded-xl p-6 space-y-5 shadow-[0_0_35px_rgba(34,197,94,0.4)]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-1.5 font-mono text-xs font-black text-[#22C55E]">
                <Zap className="w-4 h-4 fill-[#22C55E]" />
                <span>YOU'VE BEEN MATCHED!</span>
              </div>

              <button
                type="button"
                onClick={() => setIsMatchModalOpen(false)}
                className="p-1 border border-[#333333] hover:border-[#666666] text-[#888888] hover:text-[#FFFFFF] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {irlStatus && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{irlStatus}</span>
              </div>
            )}

            {/* Profile Display */}
            <div className="text-center space-y-3 py-2">
              <div className="relative inline-block">
                {matchedCandidate.avatar ? (
                  <img
                    src={matchedCandidate.avatar}
                    alt={matchedCandidate.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-[#22C55E]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#262626] border-4 border-[#22C55E] mx-auto flex items-center justify-center text-2xl font-bold text-white">
                    {matchedCandidate.name.charAt(0)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 bg-[#22C55E] text-black font-mono font-black text-xs px-2 py-0.5 rounded-full border border-black">
                  {matchScore.overall}%
                </span>
              </div>

              <div>
                <h4 className="font-heading font-black text-xl text-white">
                  👤 {matchedCandidate.name}
                </h4>
                <div className="font-mono text-xs text-[#22C55E]">
                  {matchedCandidate.category} • {matchedCandidate.city}
                </div>
              </div>

              {/* Reasons */}
              <div className="bg-[#181818] border border-[#2E2E2E] p-3 rounded-lg text-left space-y-1 font-mono text-xs text-[#D4D4D4]">
                {matchScore.reasons.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 truncate">
                    <span className="text-[#22C55E]">✓</span>
                    <span className="truncate">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={handleStartChat}
                className="py-2.5 px-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#3A3A3A] font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>START CHAT</span>
              </button>

              <button
                type="button"
                onClick={handleMeetIRL}
                className="py-2.5 px-2 bg-[#22C55E] hover:bg-[#16A34A] text-black font-heading font-black text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>MEET IRL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMatchModalOpen(false);
                  onOpenProfile(matchedCandidate.id);
                }}
                className="py-2.5 px-2 bg-[#FFFFFF] hover:bg-[#E5E5E5] text-black font-mono text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>VIEW PROFILE</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
