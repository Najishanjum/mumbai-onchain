import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowUpRight,
  Globe,
  ExternalLink,
  ShieldCheck,
  Send,
  Plus,
  Search,
  Users,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  fetchApprovedCommunityPartners,
  DEFAULT_COMMUNITY_PARTNERS,
} from '../lib/communityPartner';
import type { PublicCommunityPartner } from '../types/partner';

interface CommunityPartnerPageProps {
  onApply: () => void;
}

export const CommunityPartnerPage: React.FC<CommunityPartnerPageProps> = ({ onApply }) => {
  const [partners, setPartners] = useState<PublicCommunityPartner[]>(DEFAULT_COMMUNITY_PARTNERS);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchApprovedCommunityPartners()
      .then((data) => {
        if (isMounted && data) {
          setPartners(data);
        }
      })
      .catch(() => {
        if (isMounted) setPartners(DEFAULT_COMMUNITY_PARTNERS);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return partners;
    const q = searchQuery.toLowerCase().trim();
    return partners.filter(
      (p) =>
        p.community_name.toLowerCase().includes(q) ||
        p.community_description.toLowerCase().includes(q)
    );
  }, [partners, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-10 select-none">
      
      {/* 1. Page Editorial Header */}
      <div className="bg-[#0A0C10] text-[#ECEEF1] border-2 border-[#000000] p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="space-y-6 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono text-xs text-[#98A0AB]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#F97316]" />
              <span className="font-bold text-white tracking-wider">ECOSYSTEM ALLIANCE // 2026</span>
              <span className="text-white/30">•</span>
              <span className="text-[#22C55E] font-semibold">MUMBAIONCHAIN.SITE/COMMUNITYPARTNER</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#98A0AB]">
              <span>01—08 NOV 2026</span>
              <span>•</span>
              <span>MUMBAI, INDIA</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-xs text-[#F97316]">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="font-bold tracking-wide">OFFICIAL PARTNER NETWORK</span>
              </div>

              <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-white uppercase tracking-tighter leading-none">
                COMMUNITY<br />
                <span className="text-[#F97316]">PARTNERS</span>
              </h1>

              <p className="font-sans text-sm sm:text-base text-[#98A0AB] leading-relaxed max-w-2xl">
                Leading Web3 communities, developer hubs, hacker houses, and university collectives bringing their members to Mumbai Onchain Week. Connect with top protocols, builders, and ecosystem leaders.
              </p>
            </div>

            <div className="shrink-0 space-y-3">
              <button
                type="button"
                onClick={onApply}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] hover:bg-[#F2F2F2] px-8 py-4 border-2 border-[#000000] font-heading font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-[5px_5px_0px_0px_rgba(249,115,22,1)] hover:shadow-[7px_7px_0px_0px_rgba(34,197,94,1)] active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <span>APPLY AS COMMUNITY PARTNER</span>
                <ArrowUpRight className="w-5 h-5 text-[#F97316]" />
              </button>

              <div className="flex items-center justify-center lg:justify-end gap-2 text-[11px] font-mono text-[#98A0AB]">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <span>Free to join • Verified Cohorts</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 font-mono text-xs">
            <div className="p-3 bg-white/5 border border-white/10">
              <div className="text-[10px] text-[#98A0AB] uppercase">PARTNER COHORTS</div>
              <div className="text-xl font-heading font-black text-white mt-0.5">30+ HUBS</div>
            </div>
            <div className="p-3 bg-white/5 border border-white/10">
              <div className="text-[10px] text-[#98A0AB] uppercase">TOTAL BUILDERS</div>
              <div className="text-xl font-heading font-black text-[#22C55E] mt-0.5">15,000+</div>
            </div>
            <div className="p-3 bg-white/5 border border-white/10">
              <div className="text-[10px] text-[#98A0AB] uppercase">SIDE EVENTS</div>
              <div className="text-xl font-heading font-black text-[#0052FF] mt-0.5">90+ SESSIONS</div>
            </div>
            <div className="p-3 bg-white/5 border border-white/10">
              <div className="text-[10px] text-[#98A0AB] uppercase">COMMUNITY VENUES</div>
              <div className="text-xl font-heading font-black text-[#F97316] mt-0.5">BKC • SAHAR • NESCO</div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Partner Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#FFFFFF] border-2 border-[#000000] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners by name or focus (e.g. Ethereum, Solana, ZK, Student, DeFi)..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#FAFAFA] border border-[#000000] font-mono text-xs focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs">
          <span className="text-[#666666]">
            Showing <strong>{filteredPartners.length}</strong> Community Partners
          </span>
          <button
            type="button"
            onClick={onApply}
            className="px-3.5 py-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] font-mono text-xs font-bold transition-colors cursor-pointer"
          >
            + ADD YOUR COMMUNITY
          </button>
        </div>
      </div>

      {/* 3. Community Partners Grid */}
      {filteredPartners.length === 0 ? (
        <div className="border-2 border-dashed border-[#000000] bg-[#FFFFFF] p-10 sm:p-14 text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#000000] text-[#FFFFFF] flex items-center justify-center">
            <Plus className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-heading font-black text-xl text-[#000000] uppercase tracking-tight">
              {searchQuery ? 'NO MATCHING COMMUNITY PARTNERS' : 'BE THE FIRST COMMUNITY PARTNER'}
            </h3>
            <p className="font-mono text-xs text-[#666666] leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search terms or keywords.'
                : 'Applications are officially open! Verified Web3 communities, DAOs, and builder cohorts will be featured here once approved.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onApply}
              className="inline-flex items-center gap-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] px-7 py-3 font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              <span>SUBMIT APPLICATION →</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="group bg-[#FFFFFF] border-2 border-[#000000] p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="space-y-4">
                {/* Partner Logo & Verification Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-16 h-16 bg-[#F5F5F5] border-2 border-[#000000] p-1.5 rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                    {partner.community_logo_url ? (
                      <img
                        src={partner.community_logo_url}
                        alt={partner.community_name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                    ) : (
                      <div className="font-heading font-black text-xl text-[#F97316]">
                        {partner.community_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-[#22C55E]/10 text-[#15803D] border border-[#16A34A] rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>OFFICIAL PARTNER</span>
                  </div>
                </div>

                {/* Community Name & Description */}
                <div className="space-y-2">
                  <h3 className="font-heading font-black text-xl text-[#050505] uppercase tracking-tight group-hover:text-[#0052FF] transition-colors">
                    {partner.community_name}
                  </h3>
                  <p className="font-sans text-xs text-[#555555] leading-relaxed line-clamp-3">
                    {partner.community_description}
                  </p>
                </div>
              </div>

              {/* Social Profile Links */}
              <div className="pt-4 mt-5 border-t border-[#EAEAEA] flex items-center justify-between font-mono text-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#888888]">CHANNELS:</span>
                <div className="flex items-center gap-3 text-[#333333]">
                  {partner.website_url && (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:text-[#0052FF] hover:scale-110 transition-transform"
                      title="Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {partner.x_url && (
                    <a
                      href={partner.x_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:text-[#000000] hover:scale-110 transition-transform"
                      title="X Profile"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  )}
                  {partner.telegram_url && (
                    <a
                      href={partner.telegram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:text-[#0088cc] hover:scale-110 transition-transform"
                      title="Telegram"
                    >
                      <Send className="w-4 h-4" />
                    </a>
                  )}
                  {partner.discord_url && (
                    <a
                      href={partner.discord_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:text-[#5865F2] hover:scale-110 transition-transform"
                      title="Discord"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Join as Community Partner Slot Card */}
          <div
            onClick={onApply}
            className="border-2 border-dashed border-[#000000] bg-[#FAFAFA] hover:bg-[#FFFFFF] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] min-h-[260px]"
          >
            <div className="w-14 h-14 rounded-full bg-[#000000] text-[#FFFFFF] group-hover:bg-[#F97316] group-hover:text-black flex items-center justify-center transition-all mb-4">
              <Plus className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="font-heading font-black text-lg text-[#050505] uppercase tracking-tight">
                JOIN AS COMMUNITY PARTNER
              </div>
              <p className="font-mono text-xs text-[#666666] max-w-[240px] mx-auto leading-relaxed">
                Showcase your developer club, DAO, or hacker cohort on the official Mumbai Onchain portal.
              </p>
            </div>
            <span className="mt-5 font-mono text-xs text-[#000000] font-bold group-hover:text-[#F97316] flex items-center gap-1.5">
              <span>SUBMIT APPLICATION →</span>
            </span>
          </div>
        </div>
      )}

      {/* 4. Ecosystem Alliance Perks Section */}
      <div className="bg-[#FFFFFF] border-2 border-[#000000] p-6 sm:p-10 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D8D8] pb-4 font-mono text-xs text-[#555555]">
          <span className="font-bold text-[#000000] uppercase tracking-wider">
            PARTNER COHORT PERKS // 2026
          </span>
          <span>NO APPLICATION FEES REQUIRED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 border-l-2 border-[#000000] pl-4">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#000000]">
              <Globe className="w-4 h-4 text-[#22C55E]" />
              <span>GLOBAL ECOSYSTEM DIRECTORY</span>
            </div>
            <p className="font-sans text-xs text-[#555555] leading-relaxed">
              Get your community featured on the official Mumbai Onchain directory, social feeds, and Devcon 8 recommendation channels.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-[#000000] pl-4">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#000000]">
              <Calendar className="w-4 h-4 text-[#0052FF]" />
              <span>PRIORITY SIDE EVENT SLOTS</span>
            </div>
            <p className="font-sans text-xs text-[#555555] leading-relaxed">
              Co-host workshops, hacker house demos, and meetups at Fairmont, Jio World Centre, and NESCO.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-[#000000] pl-4">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#000000]">
              <Users className="w-4 h-4 text-[#F97316]" />
              <span>DIRECT FOUNDER ONBOARDING</span>
            </div>
            <p className="font-sans text-xs text-[#555555] leading-relaxed">
              Direct access for community members to connect with leading protocol researchers, investors, and project grants.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs text-[#666666]">
            Ready to bring your members to Mumbai? Application takes under 2 minutes.
          </span>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] px-6 py-3 font-mono text-xs font-bold tracking-wider transition-colors cursor-pointer"
          >
            <span>APPLY AS COMMUNITY PARTNER ↗</span>
          </button>
        </div>
      </div>

    </div>
  );
};
