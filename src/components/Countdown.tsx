import React, { useState, useEffect } from 'react';
import { getCountdownToNov1 } from '../lib/date';

export const Countdown: React.FC = () => {
  const [countdown, setCountdown] = useState(getCountdownToNov1());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownToNov1());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto border-t border-b border-[#D8D8D8] py-5 px-2 select-none">
      
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between font-mono text-[11px] text-[#555555] uppercase tracking-wider mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#000000] animate-ping" />
          <span className="font-bold text-[#050505]">MUMBAI ARRIVAL IN</span>
        </div>
        <div className="hidden sm:block text-[#777777]">
          TARGET: 01 NOV 2026 // 00:00 IST
        </div>
      </div>

      {/* Editorial Large Monospace Numbers */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
        
        {/* Days */}
        <div className="border border-[#D8D8D8] bg-[#FAFAFA] p-3 sm:p-5 flex flex-col items-center justify-center transition-all hover:border-[#000000]">
          <span className="font-mono text-3xl sm:text-5xl lg:text-6xl font-black text-[#050505] tracking-tighter">
            {String(countdown.days).padStart(2, '0')}
          </span>
          <span className="font-mono text-[9px] sm:text-xs text-[#666666] tracking-widest mt-1 uppercase font-semibold">
            DAYS
          </span>
        </div>

        {/* Hours */}
        <div className="border border-[#D8D8D8] bg-[#FAFAFA] p-3 sm:p-5 flex flex-col items-center justify-center transition-all hover:border-[#000000]">
          <span className="font-mono text-3xl sm:text-5xl lg:text-6xl font-black text-[#050505] tracking-tighter">
            {String(countdown.hours).padStart(2, '0')}
          </span>
          <span className="font-mono text-[9px] sm:text-xs text-[#666666] tracking-widest mt-1 uppercase font-semibold">
            HOURS
          </span>
        </div>

        {/* Minutes */}
        <div className="border border-[#D8D8D8] bg-[#FAFAFA] p-3 sm:p-5 flex flex-col items-center justify-center transition-all hover:border-[#000000]">
          <span className="font-mono text-3xl sm:text-5xl lg:text-6xl font-black text-[#050505] tracking-tighter">
            {String(countdown.minutes).padStart(2, '0')}
          </span>
          <span className="font-mono text-[9px] sm:text-xs text-[#666666] tracking-widest mt-1 uppercase font-semibold">
            MINS
          </span>
        </div>

        {/* Seconds */}
        <div className="border border-[#D8D8D8] bg-[#FAFAFA] p-3 sm:p-5 flex flex-col items-center justify-center transition-all hover:border-[#000000]">
          <span className="font-mono text-3xl sm:text-5xl lg:text-6xl font-black text-[#050505] tracking-tighter">
            {String(countdown.seconds).padStart(2, '0')}
          </span>
          <span className="font-mono text-[9px] sm:text-xs text-[#666666] tracking-widest mt-1 uppercase font-semibold">
            SECS
          </span>
        </div>

      </div>

    </div>
  );
};
