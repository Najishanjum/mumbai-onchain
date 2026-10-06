import React from 'react';
import type { Coach, Passenger } from '../../types/mumbai8';

interface CoachSelectorProps {
  coaches: Coach[];
  selectedCoachId: string;
  currentUser: Passenger | null;
  onSelectCoach: (coachId: string) => void;
}

export const CoachSelector: React.FC<CoachSelectorProps> = ({
  coaches,
  selectedCoachId,
  currentUser,
  onSelectCoach,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
          SELECT COACH:
        </span>
        <span className="font-mono text-xs text-cyan-400">
          6 Connected Coaches &bull; 120 Total Seats
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {coaches.map((coach) => {
          const isSelected = coach.id === selectedCoachId;
          const reservedCount = coach.seats.filter(
            (s) => s.status === 'reserved' || s.status === 'you'
          ).length;
          const isUserInCoach = currentUser && currentUser.coachId === coach.id;

          return (
            <button
              key={coach.id}
              onClick={() => onSelectCoach(coach.id)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/50 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              {/* Active Coach Top Glow Line */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500" />
              )}

              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`font-mono text-xs font-bold tracking-wider ${
                    isSelected ? 'text-cyan-300' : 'text-slate-300'
                  }`}
                >
                  {coach.id}
                </span>

                {isUserInCoach && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 animate-pulse">
                    YOU
                  </span>
                )}
              </div>

              <div className="font-sans text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                {coach.name}
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{reservedCount}/20 BOOKED</span>
                <span className={reservedCount === 20 ? 'text-red-400' : 'text-emerald-400'}>
                  {20 - reservedCount} FREE
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
