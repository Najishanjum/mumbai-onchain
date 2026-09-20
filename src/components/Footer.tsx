import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#FFFFFF] border-t-2 border-[#000000] pt-16 pb-12 mt-20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Large Editorial Footer Typography (Section 35) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-7 space-y-2">
            <h3 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-[#050505] leading-none uppercase tracking-tighter">
              MUMBAI<br />
              <span className="font-light text-[#777777]">//</span> ONCHAIN<br />
              WEEK <span className="font-pixel text-3xl sm:text-5xl text-[#F97316]">2026</span>
            </h3>
            <p className="font-mono text-xs text-[#555555] max-w-md pt-2">
              ONE WEEK. ONE CITY. MULTIPLE ECOSYSTEMS.<br />
              A personal Web3 event command center tracking Devcon 8, India Blockchain Week, and ETHGlobal Mumbai.
            </p>
          </div>

          {/* Ecosystem Links List */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 font-mono text-xs">
            <div className="space-y-2">
              <span className="font-bold text-[#000000] uppercase tracking-wider block border-b border-[#000000] pb-1">
                KEY HUBS
              </span>
              <ul className="space-y-1.5 text-[#444444]">
                <li><a href="https://devcon.org/en/" target="_blank" rel="noopener noreferrer" className="hover:underline">DEVCON 8 INDIA ↗</a></li>
                <li><a href="https://ethglobal.com/events/mumbai" target="_blank" rel="noopener noreferrer" className="hover:underline">ETHGLOBAL MUMBAI ↗</a></li>
                <li><a href="https://indiablockchainweek.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">INDIA BLOCKCHAIN WEEK ↗</a></li>
                <li><a href="https://ethereum.org" target="_blank" rel="noopener noreferrer" className="hover:underline">ETHEREUM FOUNDATION ↗</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#000000] uppercase tracking-wider block border-b border-[#000000] pb-1">
                COMMUNITY
              </span>
              <ul className="space-y-1.5 text-[#444444]">
                <li><span>MUMBAI, MAHARASHTRA</span></li>
                <li><span>JIO WORLD CENTRE • BKC</span></li>
                <li><span>FAIRMONT • SAHAR</span></li>
                <li><span>NESCO • GOREGAON</span></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Small Bottom Strip: Author + Socials */}
        <div className="pt-8 border-t border-[#D8D8D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-[#555555]">
          <div>
            Built by <strong className="text-[#000000]">Najish Anjum</strong> • AI/ML • Web3 Builder • Volunteer
          </div>

          <div className="flex items-center gap-6 font-bold text-[#000000]">
            <a
              href="https://github.com/najish-anjum"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GITHUB ↗
            </a>
            <a
              href="https://linkedin.com/in/najish-anjum"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              LINKEDIN ↗
            </a>
            <a
              href="https://x.com/najish_anjum"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              X (TWITTER) ↗
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
