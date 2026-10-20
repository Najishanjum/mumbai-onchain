import React from 'react';
import { ArrowUpRight, Smartphone } from 'lucide-react';
import { useInstallState } from '../lib/pwa';

interface NavbarProps {
  activeTab: 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai' | 'id-generator' | 'communitypartner';
  setActiveTab: (tab: 'home' | 'timeline' | 'events' | 'people' | 'map' | 'mymumbai' | 'id-generator' | 'communitypartner') => void;
  onInstall: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onInstall }) => {
  const { installed } = useInstallState();

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
            className={`px-3 py-1.5 transition-colors border-b-2 font-semibold ${
              activeTab === 'timeline'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            TIMELINE
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
            onClick={() => setActiveTab('people')}
            className={`px-3 py-1.5 transition-colors border-b-2 font-semibold flex items-center gap-1.5 ${
              activeTab === 'people'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            <span>PEOPLE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
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
            onClick={() => setActiveTab('communitypartner')}
            className={`px-3 py-1.5 transition-colors border-b-2 font-semibold flex items-center gap-1.5 ${
              activeTab === 'communitypartner'
                ? 'border-[#000000] text-[#000000]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            <span>PARTNERS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] inline-block" />
          </button>

          <a
            href="https://devcon8-id.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 transition-all border-b-2 border-transparent font-bold flex items-center gap-1.5 text-[#000000] hover:text-[#0052FF] hover:border-[#0052FF] group"
            title="Open Devcon 8 ID Generator web app"
          >
            <span>ID GEN</span>
            <span className="w-2 h-2 rounded-full bg-[#5FE3D6] animate-pulse" />
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </nav>

        {/* Right: Socials + Black Pill Button */}
        <div className="flex items-center gap-3">
          {/* Mumbai Onchain Community Socials */}
          <div className="flex items-center gap-1.5 sm:gap-2 sm:pr-2 sm:border-r border-[#D8D8D8]">
            <a
              href="https://x.com/Mumbai_onchain"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#F3F4F6] rounded transition-colors"
              title="Mumbai Onchain on X (@Mumbai_onchain)"
              aria-label="Mumbai Onchain on X"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://t.me/+Yi25K6W8KMo0MDZl"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#0088cc] hover:text-[#006699] hover:bg-[#F3F4F6] rounded transition-colors"
              title="Mumbai Onchain Telegram Community"
              aria-label="Mumbai Onchain Telegram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </a>
          </div>


          {!installed && (
            <button
              type="button"
              onClick={onInstall}
              className="hidden md:inline-flex items-center gap-1.5 border border-[#000000] hover:bg-[#F2F2F2] px-3.5 py-2 rounded-full font-mono font-bold text-xs tracking-wide transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>GET THE APP</span>
            </button>
          )}

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
