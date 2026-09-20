import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'timeline' | 'events' | 'map' | 'mymumbai';
  setActiveTab: (tab: 'home' | 'timeline' | 'events' | 'map' | 'mymumbai') => void;
  conflictCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, conflictCount = 0 }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF] border-b border-[#D8D8D8] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand / Identity */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveTab('home')}
          title="Return to home"
        >
          {/* Black Geometric Icon */}
          <div className="w-6 h-6 bg-[#000000] flex items-center justify-center rounded-sm shrink-0">
            <span className="text-[#FFFFFF] font-pixel text-[10px] font-bold">M</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-heading font-black text-base sm:text-lg tracking-tight text-[#050505]">
              MUMBAI <span className="font-light text-[#888888]">//</span> ONCHAIN
            </span>
            <span className="font-pixel text-[10px] text-[#F97316] font-bold tracking-widest hidden sm:inline">
              2026
            </span>
          </div>
        </div>

        {/* Center: Editorial Tab Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 transition-colors border-b-2 font-semibold ${
              activeTab === 'home'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            HOME
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 transition-colors border-b-2 font-semibold flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            <span>TIMELINE</span>
            {conflictCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#EF4444] text-white font-bold">
                {conflictCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 transition-colors border-b-2 font-semibold ${
              activeTab === 'events'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            ALL EVENTS
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 transition-colors border-b-2 font-semibold ${
              activeTab === 'map'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            MAP
          </button>

          <button
            onClick={() => setActiveTab('mymumbai')}
            className={`px-3 py-1.5 transition-colors border-b-2 font-semibold ${
              activeTab === 'mymumbai'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            MY MUMBAI
          </button>
        </nav>

        {/* Right: Black Pill Button (as in the reference screenshots) */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex flex-col text-right font-mono text-[10px] leading-tight text-[#666666] border-r border-[#D8D8D8] pr-3">
            <span className="font-bold text-[#050505]">01—08 NOV 2026</span>
            <span>MUMBAI, INDIA</span>
          </div>

          <button
            onClick={() => setActiveTab('timeline')}
            className="inline-flex items-center gap-1.5 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-4 sm:px-5 py-2 rounded-full font-heading font-bold text-xs sm:text-sm tracking-wide transition-all duration-150 active:scale-95 shadow-sm group"
          >
            <span>DEVCON 8</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </header>
  );
};
