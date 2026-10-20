import React from 'react';
import { Users, ArrowUpRight, Sparkles, Building2, Globe2, ShieldCheck } from 'lucide-react';

interface CommunityPartnerSectionProps {
  onApply: () => void;
}

export const CommunityPartnerSection: React.FC<CommunityPartnerSectionProps> = ({ onApply }) => {
  return (
    <section className="bg-[#0A0C10] text-[#ECEEF1] border-2 border-[#000000] p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none">
      
      {/* Background Decorative Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Telemetry / Identification Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-8 font-mono text-xs text-[#98A0AB]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#F97316]" />
          <span className="font-bold text-white tracking-wider">ECOSYSTEM ALLIANCE // 2026</span>
          <span className="text-white/30">•</span>
          <span className="text-[#22C55E] font-semibold">APPLICATIONS OPEN</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#98A0AB]">
          <span>DEVCON 8</span>
          <span>•</span>
          <span>IBW</span>
          <span>•</span>
          <span>ETHGLOBAL MUMBAI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Column: Heading, Subtitle & Clear CTA Button */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[11px] text-[#F97316]">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span className="tracking-wide font-bold">COMMUNITY COHORT 2026</span>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tighter leading-none">
              BECOME A<br />
              <span className="text-[#F97316]">COMMUNITY PARTNER</span>
            </h2>

            <p className="font-sans text-sm sm:text-base text-[#98A0AB] leading-relaxed max-w-xl">
              Bring your community to Mumbai Onchain Week. Connect your members with builders, founders, and the wider Web3 ecosystem.
            </p>
          </div>

          {/* Value Props Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-bold">
                <Globe2 className="w-4 h-4 text-[#22C55E]" />
                <span>GLOBAL REACH</span>
              </div>
              <p className="font-mono text-[11px] text-[#98A0AB] leading-tight">
                Get your community listed across official directories & guides.
              </p>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-bold">
                <Building2 className="w-4 h-4 text-[#0052FF]" />
                <span>SIDE EVENTS</span>
              </div>
              <p className="font-mono text-[11px] text-[#98A0AB] leading-tight">
                Co-host community meetups & workshops at Mumbai hubs.
              </p>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-bold">
                <Users className="w-4 h-4 text-[#F97316]" />
                <span>BUILDER ACCESS</span>
              </div>
              <p className="font-mono text-[11px] text-[#98A0AB] leading-tight">
                Connect members directly with top protocol teams & founders.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onApply}
              className="group inline-flex items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] hover:bg-[#F2F2F2] px-7 py-4 border-2 border-[#000000] font-heading font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-200 shadow-[5px_5px_0px_0px_rgba(249,115,22,1)] hover:shadow-[7px_7px_0px_0px_rgba(34,197,94,1)] active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
            >
              <span>APPLY AS COMMUNITY PARTNER</span>
              <ArrowUpRight className="w-5 h-5 text-[#F97316] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Visual Info Card */}
        <div className="lg:col-span-5">
          <div className="bg-[#14171D] border-2 border-white/10 p-6 sm:p-7 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs text-[#98A0AB]">
              <span className="font-bold text-white uppercase tracking-wider">
                WHO SHOULD APPLY?
              </span>
              <span className="text-[#22C55E] font-bold">01—08 NOV 2026</span>
            </div>

            <ul className="space-y-3 font-mono text-xs text-[#ECEEF1]">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">Web3 & Tech Communities:</strong> Local developer hubs, regional crypto clubs, and student organizations.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">Ecosystem DAOs & Collectives:</strong> Protocol ambassador guilds, builder circles, and research collectives.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">Hacker Houses & Incubators:</strong> Teams organizing hacker cohorts traveling to Mumbai for Devcon 8.
                </span>
              </li>
            </ul>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#98A0AB]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <span>Reviewed by Core Team</span>
              </div>
              <span className="text-white/60">No Fee Required</span>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
};
