import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Train, ShieldCheck, QrCode, ArrowRight, Share2, MapPin } from 'lucide-react';
import type { Passenger } from '../../types/mumbai8';

interface BoardingPassModalProps {
  passenger: Passenger | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToSeat: (seatNumber: string) => void;
}

export const BoardingPassModal: React.FC<BoardingPassModalProps> = ({
  passenger,
  isOpen,
  onClose,
  onGoToSeat,
}) => {
  if (!isOpen || !passenger) return null;

  const seatNumber = passenger.seatNumber || 'MUM-0042';
  const coachId = passenger.coachId || 'C03';
  const coachName = passenger.coachName || 'FOUNDERS';

  const handleEnterTrain = () => {
    onGoToSeat(seatNumber);
    onClose();
  };

  const handleCopyPass = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(
        `I just boarded MUMBAI8 — The Onchain Express! My seat is ${seatNumber} in ${coachId} (${coachName}). See you in Mumbai!`
      );
      alert('Boarding pass link copied to clipboard!');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-400/50 bg-gradient-to-b from-[#0F1626] via-[#090D18] to-[#04060B] p-6 sm:p-8 shadow-2xl shadow-cyan-500/30 z-10"
        >
          {/* Holographic light reflection */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500" />
          <div className="absolute top-0 right-0 -z-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Boarding Pass Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Train className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
                MUMBAI8 DIGITAL BOARDING PASS
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="h-3 w-3" />
              CONFIRMED
            </span>
          </div>

          {/* Center Pass Ticket Card */}
          <div className="relative rounded-2xl border border-dashed border-cyan-500/40 bg-black/60 p-5 space-y-4 shadow-inner">
            {/* Passenger Identity */}
            <div className="flex items-center gap-4">
              <img
                src={passenger.avatarUrl}
                alt={passenger.name}
                className="h-14 w-14 rounded-xl object-cover border border-cyan-400 shadow-md"
              />
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">PASSENGER NAME</span>
                <h3 className="text-lg font-bold text-white tracking-tight">{passenger.name}</h3>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <span>@{passenger.xHandle}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-0.5 text-slate-300">
                    <MapPin className="h-3 w-3 text-red-400" />
                    {passenger.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Train Specs 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">TRAIN NUMBER</span>
                <p className="font-bold text-white">MUMBAI8</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">ROUTE</span>
                <p className="font-bold text-cyan-300">MUMBAI &rarr; ONCHAIN</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">COACH</span>
                <p className="font-bold text-cyan-400">{coachId} ({coachName})</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">ASSIGNED SEAT</span>
                <p className="text-base font-black text-cyan-300">{seatNumber}</p>
              </div>
            </div>

            {/* Futuristic QR / Barcode element */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-10 w-10 text-cyan-300" />
                <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                  <span className="block font-bold text-white tracking-wider">DEVCON 8 &bull; VIP ACCESS</span>
                  <span className="block text-slate-500">{seatNumber}-HASH-0x9A4F</span>
                </div>
              </div>

              <button
                onClick={handleCopyPass}
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400 text-slate-300 hover:text-white transition"
                title="Share Boarding Pass"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={handleEnterTrain}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/30 hover:scale-[1.02] transition active:scale-[0.98]"
            >
              <span>ENTER TRAIN &bull; GO TO MY SEAT</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-mono text-slate-400 hover:text-white transition"
            >
              Close Pass
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
