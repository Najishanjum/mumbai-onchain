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
              A Web3 event command center tracking Devcon 8, India Blockchain Week, and ETHGlobal Mumbai.
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
                <li><a href="https://devcon8-id.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#0052FF] font-bold">DEVCON 8 ID GENERATOR ↗</a></li>
                <li><a href="https://ethglobal.com/events/mumbai" target="_blank" rel="noopener noreferrer" className="hover:underline">ETHGLOBAL MUMBAI ↗</a></li>
                <li><a href="https://indiablockchainweek.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">INDIA BLOCKCHAIN WEEK ↗</a></li>
                <li><a href="https://ethereum.org" target="_blank" rel="noopener noreferrer" className="hover:underline">ETHEREUM FOUNDATION ↗</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#000000] uppercase tracking-wider block border-b border-[#000000] pb-1">
                COMMUNITY & SOCIALS
              </span>
              <ul className="space-y-1.5 text-[#444444]">
                <li>
                  <a
                    href="https://x.com/Mumbai_onchain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-bold text-[#000000] flex items-center gap-1"
                  >
                    X (@Mumbai_onchain) ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://t.me/+Yi25K6W8KMo0MDZl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-bold text-[#0088cc] flex items-center gap-1"
                  >
                    TELEGRAM COMMUNITY ↗
                  </a>
                </li>
                <li><span>MUMBAI, MAHARASHTRA</span></li>
                <li><span>JIO WORLD CENTRE • BKC</span></li>
                <li><span>FAIRMONT • SAHAR</span></li>
                <li><span>NESCO • GOREGAON</span></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Small Bottom Strip: Community + Socials */}
        <div className="pt-8 border-t border-[#D8D8D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-[#555555]">
          <div>
            Built by <strong className="text-[#000000]">Najish Anjum</strong> • Mumbai Onchain Community
          </div>

          <div className="flex items-center gap-6 font-bold text-[#000000]">
            <a
              href="https://x.com/Mumbai_onchain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline inline-flex items-center gap-1.5 text-[#000000]"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X (@Mumbai_onchain)</span> ↗
            </a>
            <a
              href="https://t.me/+Yi25K6W8KMo0MDZl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline inline-flex items-center gap-1.5 text-[#0088cc]"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              <span>TELEGRAM</span> ↗
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
