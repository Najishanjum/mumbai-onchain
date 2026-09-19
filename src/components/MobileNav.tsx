import React from 'react';
import { Home, Clock, Calendar, MapPin, User } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'home' | 'timeline' | 'events' | 'map' | 'mymumbai';
  setActiveTab: (tab: 'home' | 'timeline' | 'events' | 'map' | 'mymumbai') => void;
  conflictCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, conflictCount = 0 }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-2xl border-t border-[#202020] px-2 py-1.5 pb-safe">
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-[#627EEA] bg-[#627EEA]/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">HOME</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'timeline'
              ? 'text-[#627EEA] bg-[#627EEA]/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">TIMELINE</span>
          {conflictCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'events'
              ? 'text-[#627EEA] bg-[#627EEA]/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">EVENTS</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'map'
              ? 'text-[#627EEA] bg-[#627EEA]/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <MapPin className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">MAP</span>
        </button>

        <button
          onClick={() => setActiveTab('mymumbai')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'mymumbai'
              ? 'text-[#8B5CF6] bg-[#8B5CF6]/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">ME</span>
        </button>
      </div>
    </div>
  );
};
