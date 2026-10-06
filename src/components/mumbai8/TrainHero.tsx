import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, ArrowRight, ShieldCheck, Compass, Ticket } from 'lucide-react';
import type { Passenger } from '../../types/mumbai8';

interface TrainHeroProps {
  totalCapacity: number;
  reservedCount: number;
  availableCount: number;
  currentUser: Passenger | null;
  onBoardClick: () => void;
  onViewPassengersClick: () => void;
  onOpenMySeat: () => void;
  onOpenAdmin: () => void;
  activeView: 'exterior' | 'interior' | 'seat-map' | 'stats';
  onViewChange: (view: 'exterior' | 'interior' | 'seat-map' | 'stats') => void;
}

export const TrainHero: React.FC<TrainHeroProps> = ({
  totalCapacity,
  reservedCount,
  availableCount,
  currentUser,
  onBoardClick,
  onViewPassengersClick,
  onOpenMySeat,
  onOpenAdmin,
  activeView,
  onViewChange,
}) => {
  const percentage = Math.round((reservedCount / totalCapacity) * 100);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#0B0F19]/90 via-[#07090E]/95 to-[#04060A]/95 p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-cyan-950/40">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -z-10 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Top Station Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">
            STATUS: BOARDING PLATFORM 8
          </span>
          <span className="text-xs text-slate-500 font-mono">|</span>
          <span className="font-mono text-xs text-slate-300">ROUTE: MUMBAI &rarr; ONCHAIN</span>
        </div>

        {/* Action pills */}
        <div className="flex items-center gap-2">
          {currentUser?.seatNumber && (
            <button
              onClick={onOpenMySeat}
              className="group flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <Ticket className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>MY SEAT: <strong className="text-white font-mono">{currentUser.seatNumber}</strong></span>
            </button>
          )}

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-slate-400 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300"
            title="Admin Approval Dashboard"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ADMIN</span>
          </button>
        </div>
      </div>

      {/* Main Title & Train Info */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-3.5 py-1 text-xs font-mono font-medium text-cyan-300">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>TRAIN NO. MUMBAI8 &bull; 6 COACHES &bull; 120 ONCHAIN SEATS</span>
            </div>
            
            <h1 className="mt-3 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase font-sans">
              MUMBAI<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400">8</span>
            </h1>
            
            <p className="text-xl sm:text-2xl font-light text-cyan-200/90 tracking-wide font-mono mt-1">
              THE ONCHAIN EXPRESS
            </p>

            <p className="mt-4 text-base sm:text-lg text-slate-300 font-light max-w-xl leading-relaxed">
              Your seat. Your city. Your network. Step aboard Mumbai's premier virtual Web3 express train and claim your unique onchain passenger identity.
            </p>
          </motion.div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onBoardClick}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-7 py-3.5 text-base font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-400/40 active:scale-[0.98]"
            >
              <span>BOARD THE TRAIN</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={onViewPassengersClick}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-cyan-400/60 hover:bg-white/10 active:scale-[0.98]"
            >
              <Users className="h-5 w-5 text-cyan-400" />
              <span>VIEW PASSENGERS</span>
            </button>
          </div>
        </div>

        {/* Live Train Gauge & Stats Card */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 backdrop-blur-md shadow-inner space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Onboard Manifest</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
                    {String(reservedCount).padStart(3, '0')}
                  </span>
                  <span className="text-slate-400 font-mono text-lg">/ {totalCapacity}</span>
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {percentage}% FULL
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 uppercase">Available</span>
                <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                  {String(availableCount).padStart(3, '0')}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-white/10 p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>MUM-0001 (DEPARTURE)</span>
                <span>MUM-0120 (TERMINUS)</span>
              </div>
            </div>

            {/* Quick Experience View Switcher */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-2.5">
                Experience Perspectives:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'exterior', label: 'Exterior 3D', icon: Compass },
                  { id: 'interior', label: 'Interior', icon: Sparkles },
                  { id: 'seat-map', label: 'Seat Map', icon: Ticket },
                  { id: 'stats', label: 'Network', icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/10'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
