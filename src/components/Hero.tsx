import React from 'react';
import { Countdown } from './Countdown';
import { HeroArtwork } from './HeroArtwork';

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full pt-10 sm:pt-14 pb-16 sm:pb-20 overflow-hidden bg-[#FFFFFF] border-b border-[#D8D8D8] tech-grid">
      
      {/* Edge Illustrated Artwork Framing the Viewport */}
      <HeroArtwork />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Top Minimalist Event Identity Pill */}
        <div className="inline-flex items-center gap-2 border border-[#D8D8D8] bg-[#FFFFFF] px-3.5 py-1.5 rounded-full shadow-2xs font-mono text-[11px] text-[#333333]">
          <span className="w-2 h-2 rounded-full bg-[#000000]" />
          <span className="font-bold text-[#000000] tracking-wider">MUMBAI // 2026</span>
          <span className="text-[#999999]">•</span>
          <span className="tracking-wide">01—08 NOV</span>
          <span className="text-[#999999]">•</span>
          <span className="font-mono text-[#F97316] font-bold">ETH / SOL / ECOSYSTEM</span>
        </div>

        {/* Hero Oversized Typographic Composition (Directly inspired by reference screenshot) */}
        <div className="space-y-1 sm:space-y-2 max-w-4xl mx-auto">
          
          {/* Pixelated Date Accent — reminiscent of the reference screenshot's "04/Nov" */}
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
            A personal Web3 event command center tracking Devcon 8, India Blockchain Week, ETHGlobal Mumbai and events across Mumbai.
          </p>
        </div>

        {/* Editorial Countdown */}
        <div className="pt-2">
          <Countdown />
        </div>

      </div>

    </section>
  );
};
