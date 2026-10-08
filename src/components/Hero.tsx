import React from 'react';
import { Countdown } from './Countdown';
import { HeroArtwork } from './HeroArtwork';
import { Users, ArrowRight, UserPlus } from 'lucide-react';

interface HeroProps {
  onNavigatePeople?: () => void;
  onOpenCreateProfile?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onNavigatePeople,
  onOpenCreateProfile,
}) => {
  return (
    <section className="relative w-full pt-10 sm:pt-14 pb-16 sm:pb-20 overflow-hidden bg-[#FFFFFF] border-b border-[#D8D8D8] tech-grid">
      
      {/* Edge Illustrated Artwork Framing the Viewport */}
      <HeroArtwork />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Top Minimalist Event Identity Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 border border-[#D8D8D8] bg-[#FFFFFF] px-3.5 py-1.5 rounded-full shadow-2xs font-mono text-[11px] text-[#333333]">
            <span className="w-2 h-2 rounded-full bg-[#000000]" />
            <span className="font-bold text-[#000000] tracking-wider">MUMBAI // 2026</span>
            <span className="text-[#999999]">•</span>
            <span className="tracking-wide">01—08 NOV</span>
            <span className="text-[#999999]">•</span>
            <span className="font-mono text-[#F97316] font-bold">ETH / SOL / ECOSYSTEM</span>
          </div>
        </div>

        {/* Hero Oversized Typographic Composition */}
        <div className="space-y-1 sm:space-y-2 max-w-4xl mx-auto">
          
          {/* Pixelated Date Accent */}
          <div className="font-pixel text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-[#050505] leading-none select-none">
            01—08/NOV
          </div>

          {/* Giant Grotesk City & Week Heading */}
          <h1 className="font-heading font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-[#050505] leading-[0.92] uppercase select-none">
            MUMBAI
          </h1>

          <div className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-[#222222] uppercase">
            ONCHAIN WEEK
          </div>

        </div>

        {/* Tagline & Supporting Copy */}
        <div className="max-w-2xl mx-auto space-y-3 pt-2">
          <div className="font-mono text-xs sm:text-sm tracking-widest font-bold text-[#000000] uppercase">
            ONE WEEK. ONE CITY. MULTIPLE ECOSYSTEMS.
          </div>
          
          <p className="font-sans text-sm sm:text-base text-[#444444] leading-relaxed max-w-xl mx-auto">
            A personal Web3 event command center tracking Devcon 8, India Blockchain Week, ETHGlobal Mumbai and connecting builders worldwide.
          </p>
        </div>

        {/* PRIMARY HERO CALL-TO-ACTION: PEOPLE & CONNECT // BOLD & ANIMATED */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onNavigatePeople}
            className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 bg-[#000000] text-[#FFFFFF] hover:bg-[#1A1A1A] px-7 py-4 border-2 border-[#000000] font-heading font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-200 shadow-[5px_5px_0px_0px_rgba(249,115,22,1)] hover:shadow-[7px_7px_0px_0px_rgba(34,197,94,1)] active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-80" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22C55E]" />
            </span>
            <Users className="w-5 h-5 text-[#22C55E] group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">PEOPLE & CONNECT</span>
            <ArrowRight className="w-4 h-4 text-[#F97316] group-hover:translate-x-1 transition-transform" />
          </button>

          {onOpenCreateProfile && (
            <button
              type="button"
              onClick={onOpenCreateProfile}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFFFFF] text-[#000000] hover:bg-[#F5F5F5] px-6 py-4 border-2 border-[#000000] font-mono font-bold text-xs sm:text-sm uppercase tracking-wide transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#000000]" />
              <span>+ CREATE PROFILE</span>
            </button>
          )}
        </div>

        {/* Editorial Countdown */}
        <div className="pt-2">
          <Countdown />
        </div>

      </div>

    </section>
  );
};
