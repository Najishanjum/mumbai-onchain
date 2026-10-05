import React from 'react';
import { Sparkles, Shield, Share2 } from 'lucide-react';

export const IDHero: React.FC = () => {
  return (
    <div className="relative overflow-hidden pt-8 pb-10 sm:pb-12 text-center select-none">
      {/* Background Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#00F0FF]/15 via-[#7000FF]/15 to-[#FF007A]/15 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Floating Sparkles effect */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18153A] border border-[#5FE3D6]/30 text-xs font-mono tracking-widest text-[#5FE3D6] uppercase shadow-lg shadow-[#5FE3D6]/10 mb-4 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#5FE3D6] animate-pulse" />
          <span>ONCHAIN IDENTITY PASS // MUMBAI 2026</span>
          <Sparkles className="w-3.5 h-3.5 text-[#F6A067]" />
        </div>

        {/* Main Headline */}
        <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl text-[#050505] dark:text-[#FFFFFF] uppercase tracking-tight leading-none mb-3">
          MumbaiOnChain <span className="bg-gradient-to-r from-[#5FE3D6] via-[#B59CF2] to-[#F6A067] bg-clip-text text-transparent">ID</span>
        </h1>

        {/* Subhead */}
        <p className="font-mono text-sm sm:text-base text-[#555555] dark:text-[#A3A3A3] max-w-2xl mx-auto leading-relaxed">
          Create your personalized MumbaiOnChain identity pass from your X profile. Download in high-definition or share directly with the Ethereum and Web3 community.
        </p>

        {/* Value Prop Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 font-mono text-xs text-[#666666] dark:text-[#888888]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#5FE3D6]" />
            <span>Permanent Unique MOC ID</span>
          </div>
          <span className="text-[#333333] hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#B59CF2]" />
            <span>3 Iconic Templates</span>
          </div>
          <span className="text-[#333333] hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-[#F6A067]" />
            <span>Instant X & Web Share</span>
          </div>
        </div>
      </div>
    </div>
  );
};
