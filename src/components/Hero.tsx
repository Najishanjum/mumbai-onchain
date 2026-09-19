import React from 'react';
import { Countdown } from './Countdown';
import { Sparkles, Compass } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full pt-8 pb-12 overflow-hidden border-b border-[#202020] bg-[#050505]">
      
      {/* Dynamic Background Technical Grid & Glow Effects */}
      <div className="absolute inset-0 tech-grid opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#627EEA]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-[#8B5CF6]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Top Telemetry Line */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C1C1C] pb-3 font-mono text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-zinc-300 font-bold">MUMBAI // 2026</span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-400">01—08 NOV</span>
            <span className="text-zinc-700">•</span>
            <span className="text-[#627EEA] uppercase tracking-wider">ONCHAIN WEEK</span>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#627EEA]" /> 19.0760° N, 72.8777° E
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">ASIA/KOLKATA (IST)</span>
          </div>
        </div>

        {/* Hero Main Headline & Value Proposition */}
        <div className="max-w-4xl space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212] border border-[#252525] text-xs font-mono text-[#8299F0]">
            <Sparkles className="w-3.5 h-3.5 text-[#627EEA]" />
            <span>PERSONAL WEB3 MISSION CONTROL</span>
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.08] uppercase">
            ONE WEEK.<br />
            ONE CITY.<br />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-[#627EEA] bg-clip-text text-transparent">
              MULTIPLE ECOSYSTEMS.
            </span>
          </h1>

          <p className="font-mono text-base sm:text-lg text-zinc-400 max-w-2xl font-light">
            Tracking my Web3 journey through Mumbai — Devcon 8, India Blockchain Week, ETHGlobal Mumbai & side events.
          </p>

        </div>

        {/* Live Countdown Component */}
        <Countdown />

      </div>

    </section>
  );
};
