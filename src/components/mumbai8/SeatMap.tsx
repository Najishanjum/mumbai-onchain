import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Coach, Passenger, Seat } from '../../types/mumbai8';

interface SeatMapProps {
  coach: Coach;
  currentUser: Passenger | null;
  focusedSeatNumber: string | null;
  onSeatClick: (seat: Seat) => void;
  onRegisterClick: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  coach,
  currentUser,
  focusedSeatNumber,
  onSeatClick,
  onRegisterClick,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);

  // Split seats into 5 rows (4 seats per row)
  const rows = [1, 2, 3, 4, 5].map((rowNum) => {
    return coach.seats.filter((s) => s.row === rowNum);
  });

  const reservedCount = coach.seats.filter(
    (s) => s.status === 'reserved' || s.status === 'you'
  ).length;

  return (
    <div className="w-full rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#090D18]/95 via-[#060912]/95 to-[#03050A]/95 p-5 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Coach Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <span>MUMBAI8 EXPRESS</span>
            <span>&bull;</span>
            <span className="font-bold text-white">{coach.coachNumber}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mt-0.5">
            {coach.name} <span className="text-cyan-400 font-mono text-lg sm:text-xl font-normal">/ {coach.subtitle}</span>
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-slate-300">
            OCCUPANCY: <strong className="text-cyan-300">{reservedCount} / 20</strong>
          </div>
        </div>
      </div>

      {/* Train Body Carriage Representation */}
      <div className="relative my-8 mx-auto max-w-3xl rounded-2xl border border-cyan-500/30 bg-[#050811] p-4 sm:p-8 shadow-inner">
        {/* Exterior Train Windows Indicator Top & Bottom */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400/40" />
            <span>&larr; WINDOW SIDE (WEST)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>WINDOW SIDE (EAST) &rarr;</span>
            <span className="h-2 w-2 rounded-full bg-cyan-400/40" />
          </div>
        </div>

        {/* Seat Rows Grid */}
        <div className="space-y-4">
          {rows.map((rowSeats, rIdx) => {
            const leftSeats = rowSeats.filter((s) => s.col <= 2);
            const rightSeats = rowSeats.filter((s) => s.col > 2);

            return (
              <div key={rIdx} className="flex items-center justify-between gap-3 sm:gap-6">
                {/* Left Side (Window + Aisle) */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 flex-1">
                  {leftSeats.map((seat) => (
                    <SeatTile
                      key={seat.id}
                      seat={seat}
                      isCurrentUser={currentUser?.seatNumber === seat.seatNumber}
                      isFocused={focusedSeatNumber === seat.seatNumber}
                      onSeatClick={onSeatClick}
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                    />
                  ))}
                </div>

                {/* Central Aisle Indicator */}
                <div className="flex flex-col items-center justify-center px-1 sm:px-3 text-[10px] font-mono text-slate-600 select-none">
                  <span className="hidden sm:inline">AISLE</span>
                  <span className="text-cyan-500/40">R{rIdx + 1}</span>
                </div>

                {/* Right Side (Aisle + Window) */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 flex-1">
                  {rightSeats.map((seat) => (
                    <SeatTile
                      key={seat.id}
                      seat={seat}
                      isCurrentUser={currentUser?.seatNumber === seat.seatNumber}
                      isFocused={focusedSeatNumber === seat.seatNumber}
                      onSeatClick={onSeatClick}
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hovered Seat Telemetry Strip */}
      {hoveredSeat && (
        <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-4 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-cyan-300 font-bold">{hoveredSeat.seatNumber}</span>
            <span className="text-slate-400">({hoveredSeat.position.toUpperCase()} SEAT)</span>
            <span className="text-slate-500">&bull;</span>
            <span className={hoveredSeat.passenger ? 'text-white font-semibold' : 'text-emerald-400 font-semibold'}>
              {hoveredSeat.passenger ? `Occupied by ${hoveredSeat.passenger.name} (${hoveredSeat.passenger.city})` : 'AVAILABLE FOR BOARDING'}
            </span>
          </div>
          <span className="text-cyan-400 text-[10px]">CLICK TO {hoveredSeat.passenger ? 'VIEW PROFILE' : 'RESERVE'}</span>
        </div>
      )}

      {/* Seat State Legends & Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="h-3.5 w-3.5 rounded-md border border-white/20 bg-white/5" />
            <span>AVAILABLE</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3.5 w-3.5 rounded-md border border-cyan-500/40 bg-cyan-950/80 text-cyan-300" />
            <span>RESERVED</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-md h-3.5 w-3.5 bg-cyan-400 border border-white" />
            </span>
            <span>YOUR SEAT</span>
          </div>
          <div className="flex items-center gap-2 text-purple-300">
            <span className="h-3.5 w-3.5 rounded-md border border-purple-500/40 bg-purple-950/60" />
            <span>BOARDING</span>
          </div>
        </div>

        {/* Register prompt if user has no seat */}
        {!currentUser?.seatNumber && (
          <button
            onClick={onRegisterClick}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:scale-105 transition"
          >
            <span>CLAIM AN OPEN SEAT</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

interface SeatTileProps {
  seat: Seat;
  isCurrentUser: boolean;
  isFocused: boolean;
  onSeatClick: (seat: Seat) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const SeatTile: React.FC<SeatTileProps> = ({
  seat,
  isCurrentUser,
  isFocused,
  onSeatClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const isReserved = seat.status === 'reserved' || seat.status === 'you';
  const passenger = seat.passenger;

  return (
    <motion.button
      onClick={() => onSeatClick(seat)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-xl border text-center transition-all duration-200 h-20 sm:h-24 ${
        isCurrentUser
          ? 'border-cyan-400 bg-gradient-to-b from-cyan-950/90 to-black shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-400/60'
          : isFocused
          ? 'border-yellow-400 bg-yellow-950/40 ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/30'
          : isReserved
          ? 'border-cyan-500/30 bg-white/[0.04] hover:border-cyan-400 hover:bg-cyan-950/30'
          : 'border-white/10 bg-black/40 hover:border-cyan-400/50 hover:bg-cyan-500/10'
      }`}
    >
      {/* Top Seat Number Header */}
      <div className="flex items-center justify-between w-full text-[10px] font-mono leading-none">
        <span
          className={`font-semibold ${
            isCurrentUser ? 'text-cyan-300' : isReserved ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {seat.seatNumber}
        </span>

        {isCurrentUser && (
          <span className="rounded bg-cyan-400 text-[9px] font-bold text-black px-1 py-0.2">
            YOU
          </span>
        )}
      </div>

      {/* Center Passenger Avatar / Seat Icon */}
      <div className="my-auto flex flex-col items-center justify-center">
        {passenger ? (
          <div className="relative">
            <img
              src={passenger.avatarUrl}
              alt={passenger.name}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border border-cyan-400/60 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-black" />
          </div>
        ) : (
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg border border-dashed border-white/20 flex items-center justify-center group-hover:border-cyan-400/60 transition-colors">
            <span className="text-[10px] text-slate-500 group-hover:text-cyan-300 font-mono">
              +
            </span>
          </div>
        )}
      </div>

      {/* Bottom Name / State Label */}
      <div className="w-full truncate text-[10px] font-sans font-medium">
        {passenger ? (
          <span className="text-white group-hover:text-cyan-300 truncate block">
            {passenger.name.split(' ')[0]}
          </span>
        ) : (
          <span className="text-slate-500 group-hover:text-cyan-400 font-mono uppercase text-[9px]">
            OPEN
          </span>
        )}
      </div>
    </motion.button>
  );
};
