import React from 'react';
import { MapPin, Calendar, Clock, Map, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'timeline' | 'events' | 'map' | 'mymumbai';
  setActiveTab: (tab: 'home' | 'timeline' | 'events' | 'map' | 'mymumbai') => void;
  conflictCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, conflictCount = 0 }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#202020] bg-[#050505]/85 backdrop-blur-xl transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Location Metadata */}
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#0A0A0A] border border-[#252525] group hover:border-[#627EEA]/50 transition-colors">
            <div className="w-2.5 h-2.5 rounded-full bg-[#627EEA] group-hover:scale-125 transition-transform" />
            <div className="absolute inset-0 rounded-lg bg-[#627EEA]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm sm:text-base tracking-wider text-white">
                MUMBAI <span className="text-zinc-600">//</span> ONCHAIN WEEK
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#627EEA]/15 text-[#8299F0] border border-[#627EEA]/30">
                2026
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#627EEA]" /> MUMBAI, IN
              </span>
              <span className="hidden md:inline text-zinc-700">•</span>
              <span className="hidden md:inline text-zinc-400">01—08 NOV</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0A0A0A] p-1 rounded-xl border border-[#202020]">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-150 ${
              activeTab === 'home'
                ? 'bg-[#181818] text-white border border-[#333]'
                : 'text-zinc-400 hover:text-white hover:bg-[#121212]'
            }`}
          >
            HOME
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-[#181818] text-white border border-[#333]'
                : 'text-zinc-400 hover:text-white hover:bg-[#121212]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            TIMELINE
            {conflictCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500/20 text-red-400 border border-red-500/40">
                {conflictCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'bg-[#181818] text-white border border-[#333]'
                : 'text-zinc-400 hover:text-white hover:bg-[#121212]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            EVENTS
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-[#181818] text-white border border-[#333]'
                : 'text-zinc-400 hover:text-white hover:bg-[#121212]'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            MAP
          </button>

          <button
            onClick={() => setActiveTab('mymumbai')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'mymumbai'
                ? 'bg-[#181818] text-white border border-[#333]'
                : 'text-zinc-400 hover:text-white hover:bg-[#121212]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
            MY MUMBAI
          </button>
        </nav>

        {/* Right Info Header Badge */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-xs text-zinc-400 border-l border-[#202020] pl-4">
          <div className="flex items-center gap-2 bg-[#0A0A0A] px-3 py-1.5 rounded-lg border border-[#202020]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[11px] text-zinc-300">DEVCON 8 VOLUNTEER</span>
          </div>
        </div>

      </div>
    </header>
  );
};
