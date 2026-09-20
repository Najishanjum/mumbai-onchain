import React from 'react';
import { ExternalLink, ArrowUpRight, GitFork } from 'lucide-react';

const SIDE_EVENTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1NZ09OVlqElsM64oUm-8i1yh_A-U0p39BJECthwHCsLA/edit?ph_did=01a00423-fb1c-7096-b83c-709f523675ba&gid=0#gid=0';

export const SideEvents: React.FC = () => {
  return (
    <div className="w-full space-y-12 select-none">
      
      {/* 1. INDIA BLOCKCHAIN WEEK (Section 19: Typography + Grid + Border Layout) */}
      <section className="bg-[#FFFFFF] border-2 border-[#000000] p-6 sm:p-10 lg:p-12 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D8D8] pb-4 mb-6 font-mono text-xs text-[#555555]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#000000]" />
            <span className="font-bold text-[#000000]">MAJOR ECOSYSTEM HUB // 02</span>
          </div>
          <span>FAIRMONT MUMBAI • NEAR INTERNATIONAL AIRPORT</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="font-pixel text-2xl sm:text-3xl text-[#050505]">
              01—02/NOV
            </div>

            <h3 className="font-heading font-black text-4xl sm:text-6xl text-[#050505] uppercase tracking-tighter leading-none">
              IBW 2026<br />
              <span className="text-xl sm:text-3xl font-light text-[#555555]">INDIA BLOCKCHAIN WEEK</span>
            </h3>

            <p className="font-sans text-sm sm:text-base text-[#333333] leading-relaxed max-w-xl">
              India's premier web3 conference kicking off Onchain Week. 90+ independent events, developer lounges, investor tables, and after-parties hosted across Mumbai.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={SIDE_EVENTS_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-5 py-3 font-mono text-xs font-bold tracking-wider transition-all"
              >
                <span>VIEW 90+ SIDE EVENTS SHEET →</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href="https://indiablockchainweek.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-transparent hover:bg-[#F5F5F5] text-[#000000] border border-[#000000] px-5 py-3 font-mono text-xs font-semibold tracking-wider transition-all"
              >
                <span>OFFICIAL IBW PORTAL</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 border border-[#D8D8D8] bg-[#FAFAFA] p-6 space-y-4">
            <div className="font-mono text-xs text-[#666666] uppercase tracking-wider">
              VENUE COORDINATES
            </div>
            <div className="font-mono text-sm font-bold text-[#000000]">
              FAIRMONT MUMBAI
            </div>
            <div className="font-mono text-xs text-[#555555]">
              Sahar, Andheri East, Mumbai<br />
              19.0968° N, 72.8584° E
            </div>
            <div className="pt-2 border-t border-[#EAEAEA] font-mono text-xs text-[#777777]">
              Status: <span className="font-bold text-[#000000]">ATTENDING KEYNOTE TRACK</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ETHGLOBAL MUMBAI (Section 18: Oversized Typography + Parallel Track Intersection) */}
      <section className="bg-[#FFFFFF] border-2 border-[#000000] p-6 sm:p-10 lg:p-12 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D8D8] pb-4 mb-6 font-mono text-xs text-[#555555]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#000000]" />
            <span className="font-bold text-[#000000]">BUILDER ARENA // 03</span>
          </div>
          <span>NESCO CENTER • GOREGAON EAST, MUMBAI</span>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <div>
              <div className="font-pixel text-2xl sm:text-3xl text-[#050505]">
                05—07/NOV
              </div>
              <h3 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl text-[#050505] uppercase tracking-tighter leading-none">
                ETHGLOBAL<br />
                MUMBAI
              </h3>
              <div className="font-mono text-sm sm:text-base font-bold text-[#627EEA] uppercase tracking-wider mt-1">
                ETHEREUM HACKATHON
              </div>
            </div>

            <div className="max-w-md space-y-3 font-sans text-sm text-[#333333]">
              <p>
                Hundreds of developers, hackers, and founders collaborating 36 hours non-stop during Devcon 8 week.
              </p>
              <a
                href="https://ethglobal.com/events/mumbai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#000000] hover:underline"
              >
                <span>VISIT ETHGLOBAL MUMBAI PORTAL</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Parallel Tracks Crossing Diagram */}
          <div className="border border-[#000000] bg-[#FAFAFA] p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#000000] uppercase tracking-wider">
              <GitFork className="w-4 h-4" />
              <span>PARALLEL TRACK CROSSING MATRIX // DEVCON 8 × ETHGLOBAL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 font-mono text-xs pt-2">
              <div className="border border-[#D8D8D8] p-3 bg-[#FFFFFF]">
                <span className="text-[#888888] block text-[10px]">NOV 04</span>
                <span className="font-bold text-[#000000]">DEVCON DAY 2</span>
                <span className="text-[11px] text-[#555555] block">Sessions & Keynotes</span>
              </div>

              <div className="border-2 border-[#000000] p-3 bg-[#FFFFFF] shadow-2xs">
                <span className="text-[#000000] font-bold block text-[10px]">NOV 05 [INTERSECTION]</span>
                <span className="font-bold text-[#000000]">DEVCON 8 + ETHGLOBAL HACK STARTS</span>
                <span className="text-[11px] text-[#000000] block">Parallel Execution</span>
              </div>

              <div className="border-2 border-[#000000] p-3 bg-[#FFFFFF] shadow-2xs">
                <span className="text-[#000000] font-bold block text-[10px]">NOV 06 [INTERSECTION]</span>
                <span className="font-bold text-[#000000]">DEVCON CLOSING + HACKATHON SPRINT</span>
                <span className="text-[11px] text-[#000000] block">Jio World + Nesco</span>
              </div>

              <div className="border border-[#D8D8D8] p-3 bg-[#FFFFFF]">
                <span className="text-[#888888] block text-[10px]">NOV 07</span>
                <span className="font-bold text-[#000000]">ETHGLOBAL FINALS</span>
                <span className="text-[11px] text-[#555555] block">Demo Day & Awards</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIDE EVENTS CATALOGUE (Section 20: The Side Quests / Off The Main Track) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#000000] pb-4">
          <div>
            <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
              OFF THE MAIN TRACK
            </div>
            <h3 className="font-heading font-black text-3xl sm:text-5xl text-[#050505] uppercase tracking-tight">
              THE SIDE QUESTS
            </h3>
          </div>
          <p className="font-mono text-xs text-[#555555] max-w-sm">
            Curated ecosystem satellite summits, hack lounges, security workshops, and dinners.
          </p>
        </div>

        {/* Side Quests Catalogue Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Multichain Day */}
          <div
            onClick={() => window.open('https://luma.com/multichaindaydevconmumbai?tk=GBcOUA', '_blank')}
            className="group bg-[#FFFFFF] border border-[#D8D8D8] hover:border-[#000000] p-5 flex flex-col justify-between transition-all cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-mono text-[11px]">
                <span className="font-pixel text-xs text-[#000000]">[02]</span>
                <span className="font-bold text-[#000000]">02 NOV • 10:00—18:00</span>
              </div>
              <h4 className="font-heading font-black text-xl text-[#050505] group-hover:underline">
                MULTICHAIN DAY | DEVCON MUMBAI
              </h4>
              <p className="font-mono text-xs text-[#666666]">
                Taj Lands End, Bandra West • Ecosystem
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between font-mono text-xs font-bold text-[#000000]">
              <span>LUMA REGISTRATION</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Solana Summit India */}
          <div
            onClick={() => window.open('https://luma.com/solana-summit-india?tk=IbwrxR', '_blank')}
            className="group bg-[#FFFFFF] border border-[#D8D8D8] hover:border-[#000000] p-5 flex flex-col justify-between transition-all cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-mono text-[11px]">
                <span className="font-pixel text-xs text-[#000000]">[03]</span>
                <span className="font-bold text-[#000000]">02 NOV • 09:00—19:00</span>
              </div>
              <h4 className="font-heading font-black text-xl text-[#050505] group-hover:underline">
                SOLANA SUMMIT INDIA
              </h4>
              <p className="font-mono text-xs text-[#666666]">
                JW Marriott Mumbai Juhu • Solana
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between font-mono text-xs font-bold text-[#000000]">
              <span>LUMA REGISTRATION</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* The Yield Layer */}
          <div
            onClick={() => window.open('https://luma.com/7729jnr3?tk=JO4tox', '_blank')}
            className="group bg-[#FFFFFF] border border-[#D8D8D8] hover:border-[#000000] p-5 flex flex-col justify-between transition-all cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-mono text-[11px]">
                <span className="font-pixel text-xs text-[#000000]">[04]</span>
                <span className="font-bold text-[#000000]">04 NOV • 10:00—16:00</span>
              </div>
              <h4 className="font-heading font-black text-xl text-[#050505] group-hover:underline">
                THE YIELD LAYER OF SOCIAL IMPACT
              </h4>
              <p className="font-mono text-xs text-[#666666]">
                IFBE, Ballard Estate • Public Goods
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between font-mono text-xs font-bold text-[#000000]">
              <span>LUMA REGISTRATION</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Money Layer */}
          <div
            onClick={() => window.open('https://luma.com/islzi7v3?tk=0EGFBs', '_blank')}
            className="group bg-[#FFFFFF] border border-[#D8D8D8] hover:border-[#000000] p-5 flex flex-col justify-between transition-all cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-mono text-[11px]">
                <span className="font-pixel text-xs text-[#000000]">[05]</span>
                <span className="font-bold text-[#000000]">04 NOV • 18:30—22:00</span>
              </div>
              <h4 className="font-heading font-black text-xl text-[#050505] group-hover:underline">
                MONEY LAYER @ DEVCON WEEK
              </h4>
              <p className="font-mono text-xs text-[#666666]">
                Taj Mahal Palace, Colaba • DeFi
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between font-mono text-xs font-bold text-[#000000]">
              <span>LUMA REGISTRATION</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Ravecon */}
          <div
            onClick={() => window.open('https://luma.com/1cnairat?tk=qxpCkJ', '_blank')}
            className="group bg-[#FFFFFF] border border-[#D8D8D8] hover:border-[#000000] p-5 flex flex-col justify-between transition-all cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-mono text-[11px]">
                <span className="font-pixel text-xs text-[#000000]">[06]</span>
                <span className="font-bold text-[#000000]">04 NOV • 21:00—03:00</span>
              </div>
              <h4 className="font-heading font-black text-xl text-[#050505] group-hover:underline">
                RAVECON [B]ENDER
              </h4>
              <p className="font-mono text-xs text-[#666666]">
                antiSOCIAL, Lower Parel • Community Night
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between font-mono text-xs font-bold text-[#000000]">
              <span>LUMA REGISTRATION</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Full Side Events Directory Link */}
          <div
            onClick={() => window.open(SIDE_EVENTS_SHEET_URL, '_blank')}
            className="group bg-[#000000] text-[#FFFFFF] border-2 border-[#000000] p-5 flex flex-col justify-between transition-all cursor-pointer"
          >
            <div className="space-y-2">
              <span className="font-pixel text-xs text-[#F97316]">90+ SESSIONS</span>
              <h4 className="font-heading font-black text-2xl text-[#FFFFFF] uppercase">
                COMPLETE MUMBAI SIDE SPREADSHEET
              </h4>
              <p className="font-mono text-xs text-[#CCCCCC]">
                Access the verified community spreadsheet tracking parties, investor dinners, and hacker houses.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#333333] flex items-center justify-between font-mono text-xs font-bold text-[#FFFFFF]">
              <span>OPEN FULL SHEET →</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
