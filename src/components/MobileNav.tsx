import React from 'react';
import { Home, Clock, Calendar, MapPin, User } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'home' | 'timeline' | 'events' | 'map' | 'mymumbai';
  setActiveTab: (tab: 'home' | 'timeline' | 'events' | 'map' | 'mymumbai') => void;
  conflictCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, conflictCount = 0 }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF] border-t-2 border-[#000000] px-2 py-1 select-none">
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activeTab === 'home'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">HOME</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`relative flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activeTab === 'timeline'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <Clock className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">TIMELINE</span>
          {conflictCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#EF4444]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activeTab === 'events'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">EVENTS</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activeTab === 'map'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <MapPin className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">MAP</span>
        </button>

        <button
          onClick={() => setActiveTab('mymumbai')}
          className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
            activeTab === 'mymumbai'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-mono tracking-wider">ME</span>
        </button>
      </div>
    </div>
  );
};
