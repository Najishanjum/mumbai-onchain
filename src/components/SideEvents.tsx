import React from 'react';
import { ExternalLink, Sparkles, Calendar } from 'lucide-react';

const SIDE_EVENTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1NZ09OVlqElsM64oUm-8i1yh_A-U0p39BJECthwHCsLA/edit?ph_did=01a00423-fb1c-7096-b83c-709f523675ba&gid=0#gid=0';

export const SideEvents: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      
      {/* Main Header */}
      <div className="text-center space-y-3">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight uppercase">
          SIDE EVENTS
        </h2>
        <p className="font-sans text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          India's largest Web3 week — hackathons, workshops, networking, investor dinners, and after-parties hosted by leading web3 projects.
        </p>
      </div>

      {/* IBW Side Events Banner with Background Image */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-[#252525] shadow-2xl group">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/ibw-2026.png"
            alt="India Blockchain Week 2026 Side Events"
            className="w-full h-full object-cover object-center opacity-40 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/60" />
        </div>

        <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col justify-center min-h-[280px]">
          <h3 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white uppercase tracking-tight leading-tight max-w-lg mb-4">
            INDIA BLOCKCHAIN WEEK IS MORE THAN A CONFERENCE.
          </h3>
          <p className="font-sans text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed mb-8">
            90+ independent events hosted by leading web3 projects — hackathons, lounges, investor dinners, and after-parties running throughout IBW Week every November.
          </p>
          
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={SIDE_EVENTS_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-white border-2 border-white/60 hover:border-white px-6 py-3 rounded-full font-mono text-xs font-bold tracking-wider transition-all duration-200 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              View All Side Events
            </a>

            <a
              href="https://indiablockchainweek.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-white border-2 border-white/60 hover:border-white px-6 py-3 rounded-full font-mono text-xs font-bold tracking-wider transition-all duration-200 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              Submit Side Event
            </a>
          </div>
        </div>
      </div>

      {/* Featured Side Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Multichain Day */}
        <div className="group relative rounded-2xl overflow-hidden border border-[#202020] hover:border-[#627EEA]/50 transition-all bg-[#101010] cursor-pointer"
          onClick={() => window.open('https://luma.com/multichaindaydevconmumbai?tk=GBcOUA', '_blank')}
        >
          <div className="w-full h-44 overflow-hidden">
            <img src="/images/multichain-day.png" alt="Multichain Day" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#627EEA] uppercase tracking-wider">NOV 02 • ECOSYSTEM</span>
            <h4 className="font-heading font-bold text-sm text-white">MULTICHAIN DAY | DEVCON MUMBAI</h4>
            <p className="font-mono text-[11px] text-zinc-400">Taj Lands End, Bandra West</p>
          </div>
        </div>

        {/* Solana Summit */}
        <div className="group relative rounded-2xl overflow-hidden border border-[#202020] hover:border-[#8B5CF6]/50 transition-all bg-[#101010] cursor-pointer"
          onClick={() => window.open('https://luma.com/solana-summit-india?tk=IbwrxR', '_blank')}
        >
          <div className="w-full h-44 overflow-hidden">
            <img src="/images/solana-summit.png" alt="Solana Summit India" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#8B5CF6] uppercase tracking-wider">NOV 02 • SOLANA</span>
            <h4 className="font-heading font-bold text-sm text-white">SOLANA SUMMIT INDIA</h4>
            <p className="font-mono text-[11px] text-zinc-400">Mumbai • 2nd November</p>
          </div>
        </div>

        {/* ETHGlobal Mumbai */}
        <div className="group relative rounded-2xl overflow-hidden border border-[#202020] hover:border-[#F59E0B]/50 transition-all bg-[#101010] cursor-pointer"
          onClick={() => window.open('https://ethglobal.com/events/mumbai', '_blank')}
        >
          <div className="w-full h-44 overflow-hidden">
            <img src="/images/ethglobal-mumbai.png" alt="ETHGlobal Mumbai" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-wider">NOV 05–07 • HACKATHON</span>
            <h4 className="font-heading font-bold text-sm text-white">ETHGLOBAL MUMBAI</h4>
            <p className="font-mono text-[11px] text-zinc-400">NESCO Center, Goregaon</p>
          </div>
        </div>

        {/* Yield Layer */}
        <div className="group relative rounded-2xl overflow-hidden border border-[#202020] hover:border-[#22C55E]/50 transition-all bg-[#101010] cursor-pointer"
          onClick={() => window.open('https://luma.com/7729jnr3?tk=JO4tox', '_blank')}
        >
          <div className="w-full h-44 overflow-hidden">
            <img src="/images/yield-layer.png" alt="Yield Layer Social Impact" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#22C55E] uppercase tracking-wider">NOV 04 • GOVERNANCE</span>
            <h4 className="font-heading font-bold text-sm text-white">THE YIELD LAYER OF SOCIAL IMPACT</h4>
            <p className="font-mono text-[11px] text-zinc-400">IFBE, Ballard Estate</p>
          </div>
        </div>

        {/* Money Layer */}
        <div className="group relative rounded-2xl overflow-hidden border border-[#202020] hover:border-zinc-400/50 transition-all bg-[#101010] cursor-pointer"
          onClick={() => window.open('https://luma.com/islzi7v3?tk=0EGFBs', '_blank')}
        >
          <div className="w-full h-44 overflow-hidden">
            <img src="/images/money-layer.png" alt="Money Layer Devcon Week" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="p-4 space-y-1">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">NOV 04 • DEFI</span>
            <h4 className="font-heading font-bold text-sm text-white">MONEY LAYER @ DEVCON WEEK</h4>
            <p className="font-mono text-[11px] text-zinc-400">Taj Mahal Palace, Colaba</p>
          </div>
        </div>

        {/* Ravecon Bender */}
        <div className="group relative rounded-2xl overflow-hidden border border-[#202020] hover:border-[#A855F7]/50 transition-all bg-[#101010] cursor-pointer"
          onClick={() => window.open('https://luma.com/1cnairat?tk=qxpCkJ', '_blank')}
        >
          <div className="w-full h-44 overflow-hidden">
            <img src="/images/ravecon-bender.png" alt="Ravecon Bender" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#A855F7] uppercase tracking-wider">NOV 04 • PARTY</span>
            <h4 className="font-heading font-bold text-sm text-white">RAVECON [B]ENDER</h4>
            <p className="font-mono text-[11px] text-zinc-400">AntiSocial, Lower Parel</p>
          </div>
        </div>

      </div>

      {/* CTA to view full list */}
      <div className="text-center pt-2">
        <a
          href={SIDE_EVENTS_SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#627EEA] hover:bg-[#526DDA] text-white px-8 py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider transition-all shadow-glow-eth active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>VIEW ALL 90+ SIDE EVENTS →</span>
        </a>
      </div>

    </div>
  );
};
