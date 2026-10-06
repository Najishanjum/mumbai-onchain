import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid } from 'lucide-react';
import { COACH_METADATA } from '../../data/mumbai8Data';
import type { Coach, Passenger, Seat } from '../../types/mumbai8';

interface TrainInteriorSceneProps {
  currentCoach: Coach;
  currentUser: Passenger | null;
  onSelectCoach: (coachId: string) => void;
  onViewSeatMap: () => void;
  onViewExterior: () => void;
  onInspectPassenger: (passenger: Passenger) => void;
  onInspectSeat: (seat: Seat) => void;
}

export const TrainInteriorScene: React.FC<TrainInteriorSceneProps> = ({
  currentCoach,
  currentUser,
  onSelectCoach,
  onViewSeatMap,
  onViewExterior,
  onInspectPassenger,
}) => {
  // Let's grab occupied seats from this coach to show on the HUD
  const occupiedSeats = currentCoach.seats.filter((s) => s.status === 'reserved' || s.status === 'you');

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#060810] shadow-2xl shadow-cyan-950/60">
      {/* Cinematic Train Interior Frame */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src="/assets/mumbai8/train-interior.jpg"
          alt="MUMBAI8 Interior View"
          className="h-full w-full object-cover"
        />

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060810] via-transparent to-black/70 pointer-events-none" />

        {/* Top Interior Nav & Coach Switcher */}
        <div className="absolute top-6 left-6 right-6 flex flex-wrap items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onViewExterior}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-mono text-slate-300 backdrop-blur-md transition hover:border-cyan-400 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>EXTERIOR</span>
            </button>

            <div className="rounded-full border border-cyan-500/40 bg-black/80 px-4 py-2 backdrop-blur-md">
              <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
                {currentCoach.coachNumber} &bull; {currentCoach.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onViewSeatMap}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-105"
            >
              <Grid className="h-3.5 w-3.5" />
              <span>INTERACTIVE SEAT MAP</span>
            </button>
          </div>
        </div>

        {/* Highlighted 'YOU' seat indicator banner if user is in this coach */}
        {currentUser && currentUser.coachId === currentCoach.id && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="flex items-center gap-3 rounded-full border border-cyan-400 bg-black/90 px-6 py-2.5 backdrop-blur-md shadow-2xl shadow-cyan-500/50">
              <div className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                YOUR SEAT: {currentUser.seatNumber} &bull; CONFIRMED PASSENGER
              </span>
              <button
                onClick={() => onInspectPassenger(currentUser)}
                className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/40 transition"
              >
                View Pass
              </button>
            </div>
          </motion.div>
        )}

        {/* Bottom Ambient HUD */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-300 bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
            <span>COACH OCCUPANCY:</span>
            <strong className="text-cyan-400">{occupiedSeats.length} / 20 SEATS</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 bg-black/60 px-3 py-2 rounded-xl backdrop-blur-md border border-white/10">
              CLIMATE: 21&deg;C &bull; CABIN PRESSURE: NORMAL
            </span>
          </div>
        </div>
      </div>

      {/* Coach Navigation Bar */}
      <div className="border-t border-white/10 bg-[#0A0E18] p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
            Switch Coach Aisle:
          </span>
          <span className="text-xs font-mono text-cyan-400">
            Select coach to view passenger cabins
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {COACH_METADATA.map((coach) => {
            const isSelected = coach.id === currentCoach.id;
            return (
              <button
                key={coach.id}
                onClick={() => onSelectCoach(coach.id)}
                className={`relative rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-500/20'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className={`font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {coach.id}
                  </span>
                  {currentUser?.coachId === coach.id && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" title="Your Seat Is In This Coach" />
                  )}
                </div>
                <div className="font-sans text-xs font-bold text-white truncate">
                  {coach.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
