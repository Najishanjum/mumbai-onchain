import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ExternalLink, Check, UserPlus, Train, ShieldCheck, Globe } from 'lucide-react';
import type { Passenger, Seat } from '../../types/mumbai8';

interface PassengerCardModalProps {
  passenger: Passenger | null;
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  onViewPeopleProfile?: (passenger: Passenger) => void;
}

export const PassengerCardModal: React.FC<PassengerCardModalProps> = ({
  passenger,
  seat,
  isOpen,
  onClose,
  onViewPeopleProfile,
}) => {
  const [isConnected, setIsConnected] = useState(false);

  if (!isOpen || !passenger) return null;

  const seatNumber = passenger.seatNumber || seat?.seatNumber || 'MUM-????';
  const coachId = passenger.coachId || seat?.coachId || 'C01';
  const coachName = passenger.coachName || seat?.coachName || 'BUILDERS';

  const handleConnect = () => {
    setIsConnected(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#0B0F1D] via-[#070A14] to-[#04060C] p-6 sm:p-8 shadow-2xl shadow-cyan-950/70 z-10"
        >
          {/* Top ambient lighting header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500" />
          <div className="absolute top-0 right-10 -z-10 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:border-white/30 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Top Boarding Badge */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Train className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-300">
                MUMBAI8 &bull; ONCHAIN PASSENGER
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-mono font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              CONFIRMED
            </span>
          </div>

          {/* Avatar & Key Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative">
              <img
                src={passenger.avatarUrl}
                alt={passenger.name}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-xl shadow-cyan-500/20"
              />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-cyan-400 text-[10px] font-black font-mono text-slate-950 px-1.5 py-0.5 border border-black shadow">
                {coachId}
              </span>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {passenger.name}
                </h3>
                <span className="rounded-md bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300">
                  {passenger.role}
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold">@{passenger.xHandle}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="h-3 w-3 text-red-400" />
                  {passenger.city}, {passenger.country}
                </span>
              </div>

              {passenger.bio && (
                <p className="text-xs text-slate-300 pt-1 leading-relaxed line-clamp-3">
                  {passenger.bio}
                </p>
              )}
            </div>
          </div>

          {/* Train Seat Details Grid */}
          <div className="my-6 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Train</span>
              <p className="text-sm font-mono font-bold text-white mt-0.5">MUMBAI8</p>
            </div>
            <div className="border-x border-white/10">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Coach</span>
              <p className="text-sm font-mono font-bold text-cyan-400 mt-0.5">{coachId} &bull; {coachName}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Assigned Seat</span>
              <p className="text-sm font-mono font-bold text-cyan-300 mt-0.5">{seatNumber}</p>
            </div>
          </div>

          {/* Social Links Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {passenger.xHandle && (
              <a
                href={`https://x.com/${passenger.xHandle}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-slate-300 hover:border-cyan-400 hover:text-white transition"
              >
                <span className="font-bold text-cyan-400">𝕏</span>
                <span>@{passenger.xHandle}</span>
              </a>
            )}
            {passenger.githubUrl && (
              <a
                href={passenger.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-slate-300 hover:border-cyan-400 hover:text-white transition"
              >
                <span className="font-bold text-slate-200">GH</span>
                <span>GitHub</span>
              </a>
            )}
            {passenger.linkedinUrl && (
              <a
                href={passenger.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-slate-300 hover:border-cyan-400 hover:text-white transition"
              >
                <span className="font-bold text-blue-400">in</span>
                <span>LinkedIn</span>
              </a>
            )}
            {passenger.websiteUrl && (
              <a
                href={passenger.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-slate-300 hover:border-cyan-400 hover:text-white transition"
              >
                <Globe className="h-3.5 w-3.5 text-teal-400" />
                <span>Site</span>
              </a>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleConnect}
              disabled={isConnected}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]'
              }`}
            >
              {isConnected ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>CONNECTED ON MUMBAI8</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>CONNECT PASSENGER</span>
                </>
              )}
            </button>

            {onViewPeopleProfile && (
              <button
                onClick={() => {
                  onViewPeopleProfile(passenger);
                  onClose();
                }}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-cyan-400 hover:bg-white/10 transition"
              >
                <span>VIEW PROFILE</span>
                <ExternalLink className="h-4 w-4 text-cyan-400" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
