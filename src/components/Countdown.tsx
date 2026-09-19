import React, { useState, useEffect } from 'react';
import { getCountdownToNov1 } from '../lib/date';
import { Clock } from 'lucide-react';

export const Countdown: React.FC = () => {
  const [countdown, setCountdown] = useState(getCountdownToNov1());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownToNov1());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#202020] rounded-2xl p-6 sm:p-8 relative overflow-hidden tech-grid shadow-card">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#627EEA]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#627EEA] uppercase tracking-widest mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Live Countdown // Asia/Kolkata IST</span>
          </div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-white tracking-wide">
            COUNTDOWN TO MUMBAI ONCHAIN WEEK
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            TARGET: 01 NOV 2026 • 00:00:00 IST
          </p>
        </div>

        {/* Time Units Display */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 text-center">
          <div className="bg-[#121212] border border-[#252525] rounded-xl px-3 py-2.5 sm:px-5 sm:py-3.5 flex flex-col items-center">
            <span className="font-mono text-2xl sm:text-4xl font-bold text-white tracking-tight">
              {String(countdown.days).padStart(2, '0')}
            </span>
            <span className="font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest mt-1">
              DAYS
            </span>
          </div>

          <div className="bg-[#121212] border border-[#252525] rounded-xl px-3 py-2.5 sm:px-5 sm:py-3.5 flex flex-col items-center">
            <span className="font-mono text-2xl sm:text-4xl font-bold text-white tracking-tight">
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest mt-1">
              HOURS
            </span>
          </div>

          <div className="bg-[#121212] border border-[#252525] rounded-xl px-3 py-2.5 sm:px-5 sm:py-3.5 flex flex-col items-center">
            <span className="font-mono text-2xl sm:text-4xl font-bold text-[#627EEA] tracking-tight">
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest mt-1">
              MINS
            </span>
          </div>

          <div className="bg-[#121212] border border-[#252525] rounded-xl px-3 py-2.5 sm:px-5 sm:py-3.5 flex flex-col items-center">
            <span className="font-mono text-2xl sm:text-4xl font-bold text-[#8B5CF6] tracking-tight animate-pulse">
              {String(countdown.seconds).padStart(2, '0')}
            </span>
            <span className="font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest mt-1">
              SECS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
