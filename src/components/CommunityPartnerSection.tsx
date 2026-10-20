import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Sparkles,
  Globe,
  ExternalLink,
  ShieldCheck,
  Send,
  Plus,
  FileText,
  Download,
} from 'lucide-react';
import {
  fetchApprovedCommunityPartners,
  DEFAULT_COMMUNITY_PARTNERS,
} from '../lib/communityPartner';
import type { PublicCommunityPartner } from '../types/partner';

interface CommunityPartnerSectionProps {
  onApply: () => void;
  onViewProposal?: () => void;
}

export const CommunityPartnerSection: React.FC<CommunityPartnerSectionProps> = ({
  onApply,
  onViewProposal,
}) => {
  const [partners, setPartners] = useState<PublicCommunityPartner[]>(DEFAULT_COMMUNITY_PARTNERS);

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

  return (
    <section className="bg-[#0A0C10] text-[#ECEEF1] border-2 border-[#000000] p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none space-y-10">
      
      {/* Background Decorative Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Telemetry / Identification Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono text-xs text-[#98A0AB]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#F97316]" />
          <span className="font-bold text-white tracking-wider">ECOSYSTEM ALLIANCE // 2026</span>
          <span className="text-white/30">•</span>
          <span className="text-[#22C55E] font-semibold">COMMUNITY PARTNERS</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#98A0AB]">
          <span>DEVCON 8</span>
          <span>•</span>
          <span>IBW</span>
          <span>•</span>
          <span>ETHGLOBAL MUMBAI</span>
        </div>
      </div>

      {/* Header with Title and Apply Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[11px] text-[#F97316]">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span className="tracking-wide font-bold">MUMBAI ONCHAIN // COHORTS</span>
          </div>

          <h2 className="font-heading font-black text-3xl sm:text-5xl text-white uppercase tracking-tighter leading-none">
            COMMUNITY <span className="text-[#F97316]">PARTNERS</span>
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#98A0AB] leading-relaxed">
            Leading Web3 communities, developer hubs, and builder collectives bringing their members to Mumbai Onchain Week.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-3">
          {onViewProposal && (
            <button
              type="button"
              onClick={onViewProposal}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#F97316]" />
              <span>VIEW PROPOSAL</span>
            </button>
          )}

          <button
            type="button"
            onClick={onApply}
            className="group inline-flex items-center justify-center gap-2.5 bg-[#FFFFFF] text-[#000000] hover:bg-[#F2F2F2] px-6 py-3.5 border-2 border-[#000000] font-heading font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] hover:shadow-[6px_6px_0px_0px_rgba(34,197,94,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <span>APPLY AS COMMUNITY PARTNER</span>
            <ArrowUpRight className="w-4 h-4 text-[#F97316] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Partners Cards Showcase Grid / Applications Open Callout */}
      {partners.length === 0 ? (
        <div className="border-2 border-dashed border-white/20 bg-white/[0.03] p-8 sm:p-12 text-center space-y-4 relative z-10">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#F97316]">
            <Plus className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="font-heading font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
              APPLICATIONS ARE OFFICIALLY OPEN
            </h3>
            <p className="font-mono text-xs text-[#98A0AB] leading-relaxed">
              Be the first community cohort to partner with Mumbai Onchain Week 2026. Approved communities, DAOs, and builder hubs will be featured directly on this portal.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onApply}
              className="inline-flex items-center gap-2.5 bg-[#FFFFFF] text-[#000000] hover:bg-[#F2F2F2] px-7 py-3 border-2 border-[#000000] font-heading font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] hover:shadow-[6px_6px_0px_0px_rgba(34,197,94,1)] cursor-pointer"
            >
              <span>SUBMIT PARTNER APPLICATION</span>
              <ArrowUpRight className="w-4 h-4 text-[#F97316]" />
            </button>

            {onViewProposal && (
              <button
                type="button"
                onClick={onViewProposal}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#F97316]" />
                <span>READ PROPOSAL</span>
              </button>
            )}

            <a
              href="/docs/Mumbai_Onchain_Community_Partnership_Proposal.docx"
              download="Mumbai_Onchain_Community_Partnership_Proposal.docx"
              className="inline-flex items-center gap-1.5 px-4 py-3 text-white/70 hover:text-white font-mono text-xs underline"
              title="Download Word Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .DOCX</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="group bg-[#14171E] border-2 border-white/10 hover:border-[#F97316] p-5 flex flex-col justify-between transition-all duration-200 relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Partner Logo & Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-14 h-14 bg-black/60 border border-white/15 p-1 rounded-sm overflow-hidden flex items-center justify-center shrink-0 group-hover:border-[#F97316] transition-colors">
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
                      <div className="font-heading font-black text-base text-[#F97316]">
                        {partner.community_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 rounded-full font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>PARTNER</span>
                  </span>
                </div>

                {/* Name & Description */}
                <div className="space-y-1.5">
                  <h3 className="font-heading font-black text-base text-white uppercase tracking-tight group-hover:text-[#F97316] transition-colors truncate">
                    {partner.community_name}
                  </h3>
                  <p className="font-sans text-xs text-[#98A0AB] leading-relaxed line-clamp-3">
                    {partner.community_description}
                  </p>
                </div>
              </div>

              {/* Social Links Bar */}
              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[#98A0AB] font-mono text-[11px]">
                <span className="text-[10px] uppercase tracking-wider text-[#5F6772]">CONNECT:</span>
                <div className="flex items-center gap-2.5">
                  {partner.website_url && (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                      title="Website"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {partner.x_url && (
                    <a
                      href={partner.x_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
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
                      className="hover:text-[#0088cc] transition-colors"
                      title="Telegram"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {partner.discord_url && (
                    <a
                      href={partner.discord_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#5865F2] transition-colors"
                      title="Discord"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Join as Community Partner Slot Card */}
          <div
            onClick={onApply}
            className="border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-[#F97316] p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-[#F97316] text-white group-hover:text-black flex items-center justify-center transition-all mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="font-heading font-black text-sm text-white uppercase tracking-wider group-hover:text-[#F97316] transition-colors">
                YOUR COMMUNITY HERE
              </div>
              <p className="font-mono text-[11px] text-[#98A0AB] max-w-[180px] mx-auto leading-relaxed">
                Bring your community to Mumbai Onchain Week 2026.
              </p>
            </div>
            <span className="mt-4 font-mono text-[11px] text-[#F97316] font-bold group-hover:underline flex items-center gap-1">
              <span>SUBMIT APPLICATION</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* Bottom Minimal Banner: Become a Community Partner invitation */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#98A0AB] relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <span>Applications are open for Web3 communities, DAOs, Hacker Houses & Student Clubs.</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {onViewProposal && (
            <button
              type="button"
              onClick={onViewProposal}
              className="font-mono text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PROPOSAL BRIEF</span>
            </button>
          )}

          <button
            type="button"
            onClick={onApply}
            className="font-mono text-xs font-bold text-white hover:text-[#F97316] underline underline-offset-4 flex items-center gap-1 cursor-pointer"
          >
            <span>BECOME A COMMUNITY PARTNER →</span>
          </button>
        </div>
      </div>

    </section>
  );
};
