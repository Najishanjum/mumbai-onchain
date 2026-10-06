import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ArrowRight, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { COACH_METADATA } from '../../data/mumbai8Data';

interface TrainExteriorSceneProps {
  onEnterTrain: () => void;
  onSelectCoach: (coachId: string) => void;
  onViewSeatMap: () => void;
}

export const TrainExteriorScene: React.FC<TrainExteriorSceneProps> = ({
  onEnterTrain,
  onSelectCoach,
  onViewSeatMap,
}) => {
  const [isBoardingAnimation, setIsBoardingAnimation] = useState(false);
  const [hoveredCoach, setHoveredCoach] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const handleStartBoarding = () => {
    setIsBoardingAnimation(true);
    setTimeout(() => {
      onEnterTrain();
      setIsBoardingAnimation(false);
    }, 2400);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-cyan-500/30 bg-[#05070D] shadow-2xl shadow-cyan-950/50">
      {/* Cinematic Train Visual Frame */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src="/assets/mumbai8/train-exterior.jpg"
          alt="MUMBAI8 - The Onchain Express"
          className={`h-full w-full object-cover transition-transform duration-1000 ${
            isBoardingAnimation ? 'scale-110 filter brightness-125' : 'scale-100'
          }`}
        />

        {/* Ambient Vignette & Wet Ground Reflections */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070D] via-transparent to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-cyan-500/5 mix-blend-color-dodge pointer-events-none" />

        {/* Animated Destination LED Board Overlay */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 rounded-full border border-cyan-400/40 bg-black/80 px-4 py-2 backdrop-blur-md shadow-lg shadow-cyan-500/20">
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-cyan-300 uppercase">
              MUMBAI8 &bull; THE ONCHAIN EXPRESS
            </span>
            <span className="hidden md:inline text-xs font-mono text-slate-400">
              | NEXT STOP: DEVCON 8 MAIN STAGE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-full border border-white/10 bg-black/70 p-2.5 text-slate-300 backdrop-blur-md transition hover:border-cyan-400 hover:text-white"
              title={soundEnabled ? 'Mute ambient' : 'Enable ambient sound'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Boarding Cinematic Transition Overlay */}
        <AnimatePresence>
          {isBoardingAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4 px-6"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400 bg-cyan-500/20 shadow-xl shadow-cyan-500/30">
                  <Sparkles className="h-8 w-8 text-cyan-300 animate-spin" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-mono font-bold tracking-wider text-white uppercase">
                  DOORS OPENING...
                </h3>
                <p className="font-mono text-sm text-cyan-300 tracking-widest">
                  ENTERING MUMBAI8 COACH AISLE
                </p>
                <div className="h-1.5 w-64 mx-auto rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-teal-300"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.2, ease: 'easeInOut' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Big Bottom Action Overlay inside Exterior Frame */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
          <div className="text-left">
            <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">
              Station Arrival
            </span>
            <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              MUMBAI CENTRAL &bull; PLATFORM 8
            </h4>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartBoarding}
              disabled={isBoardingAnimation}
              className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95"
            >
              <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>ENTER TRAIN INTERIOR</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onViewSeatMap}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/60 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:border-cyan-400 hover:bg-black/80"
            >
              <span>SEAT MAP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Coach Quick-Boarding Strip below the render */}
      <div className="border-t border-white/10 bg-[#090D16] p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Coach to Inspect:
          </span>
          <span className="font-mono text-xs text-cyan-400">
            6 Connected High-Speed Coaches
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {COACH_METADATA.map((coach) => {
            const isHovered = hoveredCoach === coach.id;
            return (
              <button
                key={coach.id}
                onClick={() => onSelectCoach(coach.id)}
                onMouseEnter={() => setHoveredCoach(coach.id)}
                onMouseLeave={() => setHoveredCoach(null)}
                className={`relative overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 ${
                  isHovered
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-cyan-300">{coach.id}</span>
                  <span className="text-[10px] text-slate-500">20 SEATS</span>
                </div>
                <div className="font-sans text-xs font-bold text-white truncate">
                  {coach.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {coach.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
