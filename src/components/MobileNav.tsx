import React from 'react';
import { Home, Clock, Calendar, Users, MapPin, Sparkles } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai' | 'id-generator' | 'mumbai8';
  setActiveTab: (tab: 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai' | 'id-generator' | 'mumbai8') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF] border-t-2 border-[#000000] px-1 py-1 select-none">
      <div className="grid grid-cols-7 gap-0.5 max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-2 px-0.5 transition-all ${
            activeTab === 'home'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[8px] font-mono tracking-wider">HOME</span>
        </button>

        <button
          onClick={() => setActiveTab('mumbai8')}
          className={`relative flex flex-col items-center justify-center py-2 px-0.5 transition-all ${
            activeTab === 'mumbai8'
              ? 'text-[#008080] font-bold bg-cyan-50'
              : 'text-[#007788] hover:text-[#000000]'
          }`}
        >
          <span className="text-xs mb-0.5">🚄</span>
          <span className="text-[8px] font-mono font-bold tracking-wider">MUMBAI8</span>
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
          <span className="text-[8px] font-mono tracking-wider">TIMELINE</span>
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
          <span className="text-[8px] font-mono tracking-wider">EVENTS</span>
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
          <span className="text-[8px] font-mono tracking-wider">PEOPLE</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-2 px-0.5 transition-all ${
            activeTab === 'map'
              ? 'text-[#000000] font-bold'
              : 'text-[#777777] hover:text-[#000000]'
          }`}
        >
          <MapPin className="w-4 h-4 mb-0.5" />
          <span className="text-[8px] font-mono tracking-wider">MAP</span>
        </button>

        <a
          href="https://devcon8-id.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-2 px-0.5 transition-all relative text-[#0052FF] hover:text-[#000000]"
          title="Open Devcon 8 ID Generator web app"
        >
          <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#5FE3D6] animate-ping" />
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[8px] font-mono tracking-wider font-bold">ID GEN ↗</span>
        </a>
      </div>
    </div>
  );
};
