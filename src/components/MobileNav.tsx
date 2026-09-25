import React from 'react';
import { Home, Clock, Calendar, Users, MapPin } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai';
  setActiveTab: (tab: 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF] border-t-2 border-[#000000] px-1 py-1 select-none">
      <div className="grid grid-cols-5 gap-0.5 max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-2 px-0.5 transition-all ${
            activeTab === 'home'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-mono tracking-wider">HOME</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`relative flex flex-col items-center justify-center py-2 px-0.5 transition-all ${
            activeTab === 'timeline'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <Clock className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-mono tracking-wider">TIMELINE</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex flex-col items-center justify-center py-2 px-0.5 transition-all ${
            activeTab === 'events'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-mono tracking-wider">EVENTS</span>
        </button>

        <button
          onClick={() => setActiveTab('people')}
          className={`flex flex-col items-center justify-center py-2 px-0.5 transition-all ${
            activeTab === 'people'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-mono tracking-wider">PEOPLE</span>
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
      </div>
    </div>
  );
};
