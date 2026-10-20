import React, { useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  Sparkles,
  ArrowUpRight,
  Compass,
  Users,
  IdCard,
  Camera,
  Coffee,
  Hotel,
  MapPin,
  Map,
  Eye,
  Share2,
  Network,
  Megaphone,
  CheckCircle2,
  Mail,
  Globe,
} from 'lucide-react';

interface CommunityProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

export const CommunityProposalModal: React.FC<CommunityProposalModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const platformOffers = [
    {
      icon: Compass,
      title: '1. Event Discovery',
      description:
        'Discover side events, community meetups, workshops, networking sessions, and activities happening across Mumbai during Onchain Week.',
    },
    {
      icon: Users,
      title: '2. People & Networking',
      description:
        'Find developers, founders, researchers, students, and fellow builders. Create a profile, find shared interests, and connect throughout the week.',
    },
    {
      icon: IdCard,
      title: '3. Personal Profiles & Onchain IDs',
      description:
        'Create your digital identity in Mumbai Onchain, making it effortless for other ecosystem builders to find, verify, and connect with you.',
    },
    {
      icon: Camera,
      title: '4. Snaps & Community Moments',
      description:
        'Capture and share real-time moments from events across the week, helping the broader ecosystem see what is happening in the city.',
    },
    {
      icon: Coffee,
      title: '5. Food, Cafés & Hangout Spots',
      description:
        'Discover curated restaurants, cafés, and coworking spots near event venues to grab food, work between sessions, or host informal meetups.',
    },
    {
      icon: Hotel,
      title: '6. Hotels, Hostels & Stays',
      description:
        'Explore vetted accommodation options near major event venues like BKC, Sahar, and Nesco to make travel logistics straightforward.',
    },
    {
      icon: MapPin,
      title: '7. Nearby Essentials & Discovery',
      description:
        'Find transport hubs, convenience stores, pharmacies, and daily necessities around conference hubs to navigate unfamiliar neighborhoods easily.',
    },
    {
      icon: Map,
      title: '8. Maps & Location Navigation',
      description:
        'Interactive map layout helping attendees plan movements across BKC, Western Suburbs, and South Mumbai smoothly.',
    },
  ];

  const partnerGains = [
    {
      icon: Eye,
      title: 'Greater Community Visibility',
      desc: 'Introduce your community to thousands of global builders, founders, and students visiting Mumbai.',
    },
    {
      icon: Share2,
      title: 'Discoverability During Onchain Week',
      desc: 'Help attendees discover what you are building and join your official telegram, discord, and X channels.',
    },
    {
      icon: Network,
      title: 'Stronger Ecosystem Connections',
      desc: 'Connect with fellow community leaders, protocols, and collaborators across the Web3 ecosystem.',
    },
    {
      icon: Megaphone,
      title: 'Event Promotion Opportunities',
      desc: 'Highlight your community meetups, hackathons, and side events directly through the official Mumbai Onchain hub.',
    },
    {
      icon: Users,
      title: 'Participation in Shared Network',
      desc: 'Be recognized as an official pillar connecting builders beyond the main conference stage.',
    },
    {
      icon: Coffee,
      title: 'Beyond Conference Experiences',
      desc: 'Help your members discover curated hangout spots, cafés, and local spots to continue discussions informally.',
    },
  ];

  const partnerExpectations = [
    'Share the Mumbai Onchain platform with your community members.',
    'Encourage members to create profiles and explore official side events.',
    'Share relevant Onchain Week events, meetups, and updates across channels.',
    'Help attendees discover your community and connect with other builders.',
    'Collaborate on relevant promotional initiatives where mutually agreed.',
    'Share useful local recommendations or event information when appropriate.',
  ];

  const whoCanApply = [
    'Web3 and blockchain communities (Ethereum, Solana, Polygon, L2s, etc.)',
    'Developer, builder, and hacker collectives',
    'College clubs and university technical societies',
    'DAOs, research groups, and open-source communities',
    'AI, crypto, and emerging technology networks',
    'Hackathon communities and DevRel teams',
    'Communities helping visitors explore Mumbai and local culture',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto select-none">
      <div
        className="relative w-full max-w-3xl bg-[#FFFFFF] border-2 border-[#000000] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-6 overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-title"
      >
        {/* Top Header Bar */}
        <div className="bg-[#0A0C10] text-white px-5 sm:px-7 py-4 border-b-2 border-[#000000] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#F97316] text-black flex items-center justify-center font-black">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono text-[10px] text-[#F97316] uppercase tracking-wider font-bold">
                OFFICIAL DOCUMENTATION // 2026
              </div>
              <h2 id="proposal-title" className="font-heading font-black text-sm sm:text-base text-white tracking-tight uppercase">
                Community Partnership Proposal
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/docs/Mumbai_Onchain_Community_Partnership_Proposal.docx"
              download="Mumbai_Onchain_Community_Partnership_Proposal.docx"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded font-mono text-xs font-bold transition-colors cursor-pointer"
              title="Download Proposal Document (.docx)"
            >
              <Download className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="hidden sm:inline">DOWNLOAD .DOCX</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#BBBBBB] hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              aria-label="Close Proposal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 font-sans text-[#1A1A1A]">
          
          {/* Document Masthead */}
          <div className="border-b-2 border-[#000000] pb-6 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F97316]/10 text-[#C2410C] border border-[#F97316]/30 font-mono text-[11px] font-bold uppercase rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MUMBAI ONCHAIN WEEK 2026</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#000000] uppercase tracking-tight leading-tight">
              COMMUNITY PARTNERSHIP PROPOSAL
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#555555] font-semibold">
              Connecting Communities • Empowering Builders • Exploring Mumbai Together
            </p>
          </div>

          {/* Letter / Welcome */}
          <div className="bg-[#FAFAFA] border border-[#000000] p-4 sm:p-6 space-y-3 font-mono text-xs sm:text-[13px] leading-relaxed text-[#333333]">
            <p className="font-bold text-[#000000]">Hello Community Team,</p>
            <p>
              We’re excited to introduce <strong>Mumbai Onchain</strong>, a community-driven platform built to connect the people, communities, events, and experiences shaping Mumbai’s Web3 ecosystem during <strong>Mumbai Onchain Week 2026</strong>.
            </p>
            <p>
              With major gatherings such as Devcon, India Blockchain Week, ETHGlobal Mumbai, and numerous community meetups and side events, Mumbai will bring together developers, founders, researchers, students, creators, and Web3 enthusiasts from across the world.
            </p>
            <p>
              Attending a major event week is about more than conferences. People need to discover side events, meet fellow builders, find good places to eat, locate cafés to work from, book nearby accommodation, and navigate unfamiliar parts of the city.
            </p>
            <p className="font-bold text-[#000000]">
              Our vision is to make Mumbai Onchain Week easier to explore by bringing events, communities, people, and essential local information together in one place. We’d love to invite your community to become an official Mumbai Onchain Community Partner.
            </p>
          </div>

          {/* Section 1: Platform Capabilities */}
          <div className="space-y-4">
            <div className="border-b border-[#000000] pb-2">
              <h3 className="font-heading font-black text-lg sm:text-xl text-[#000000] uppercase tracking-tight">
                What the Mumbai Onchain Platform Offers
              </h3>
              <p className="font-mono text-xs text-[#666666]">
                A unified companion platform built for attendees and communities throughout Onchain Week.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {platformOffers.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="bg-[#FFFFFF] border border-[#000000] p-4 space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#F97316]/10 text-[#F97316] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-heading font-black text-xs uppercase text-[#000000]">
                        {item.title}
                      </h4>
                    </div>
                    <p className="font-mono text-[11px] text-[#555555] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: What Your Community Can Gain */}
          <div className="space-y-4">
            <div className="border-b border-[#000000] pb-2">
              <h3 className="font-heading font-black text-lg sm:text-xl text-[#000000] uppercase tracking-tight">
                Why Become a Community Partner?
              </h3>
              <p className="font-mono text-xs text-[#666666]">
                Mutual collaboration that amplifies your visibility and expands your community footprint.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {partnerGains.map((gain, idx) => {
                const Icon = gain.icon;
                return (
                  <div key={idx} className="bg-[#FAFAFA] border border-[#000000] p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#22C55E]" />
                      <h4 className="font-heading font-black text-xs uppercase text-[#000000]">
                        {gain.title}
                      </h4>
                    </div>
                    <p className="font-mono text-[11px] text-[#555555] leading-relaxed">
                      {gain.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Expectations */}
          <div className="space-y-3">
            <h3 className="font-heading font-black text-base sm:text-lg text-[#000000] uppercase tracking-tight border-b border-[#000000] pb-2">
              What We Expect from Community Partners
            </h3>
            <p className="font-mono text-xs text-[#555555]">
              We believe meaningful partnerships are built through mutual collaboration:
            </p>
            <div className="space-y-2">
              {partnerExpectations.map((text, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs font-mono text-[#333333]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Who Can Apply */}
          <div className="space-y-3 bg-[#0A0C10] text-[#ECEEF1] p-5 sm:p-6 border border-[#000000]">
            <h3 className="font-heading font-black text-base sm:text-lg text-white uppercase tracking-tight">
              Who Can Apply?
            </h3>
            <p className="font-mono text-xs text-[#98A0AB]">
              Whether your community is established or just getting started, we welcome applications from:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {whoCanApply.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 font-mono text-[11px] text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: 4-Step Process */}
          <div className="space-y-4">
            <h3 className="font-heading font-black text-base sm:text-lg text-[#000000] uppercase tracking-tight border-b border-[#000000] pb-2">
              How to Become a Community Partner
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { step: '01', title: 'APPLY', desc: 'Submit the application form with your community name, logo, lead contact, and links.' },
                { step: '02', title: 'REVIEW', desc: 'Our team reviews your submission and gets in touch regarding onboarding and next steps.' },
                { step: '03', title: 'COORDINATE', desc: 'Coordinate promotional visibility, events schedule, and co-marketing channels.' },
                { step: '04', title: 'BUILD', desc: 'Help members discover Mumbai Onchain, connect with builders, and celebrate Onchain Week.' },
              ].map((s) => (
                <div key={s.step} className="bg-[#FFFFFF] border-2 border-[#000000] p-4 space-y-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="font-heading font-black text-lg text-[#F97316]">
                    STEP {s.step}
                  </div>
                  <div className="font-heading font-black text-xs uppercase text-[#000000]">
                    {s.title}
                  </div>
                  <p className="font-mono text-[10.5px] text-[#666666] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
            <p className="font-mono text-[11px] text-[#777777] italic">
              * Submitting an application does not automatically confirm partnership. All applications are subject to review.
            </p>
          </div>

          {/* Contact & Links Bar */}
          <div className="bg-[#FAFAFA] border-2 border-[#000000] p-5 space-y-3 font-mono text-xs">
            <div className="font-bold text-[#000000] uppercase tracking-wider">
              OFFICIAL CONTACT & PLATFORM DETAILS
            </div>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[#555555]">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#000000]" />
                <a href="https://www.mumbaionchain.site" target="_blank" rel="noopener noreferrer" className="text-[#000000] font-bold underline">
                  mumbaionchain.site
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#F97316]" />
                <a href="mailto:najishanjum058@gmail.com" className="text-[#000000] font-bold underline">
                  najishanjum058@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[#F5F5F5] border-t-2 border-[#000000] px-5 sm:px-7 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <a
            href="/docs/Mumbai_Onchain_Community_Partnership_Proposal.docx"
            download="Mumbai_Onchain_Community_Partnership_Proposal.docx"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#444444] hover:text-[#000000] underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Original Word Document (.docx)</span>
          </a>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-transparent hover:bg-[#E5E5E5] border border-[#000000] font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-6 py-2.5 font-heading font-black text-xs uppercase tracking-wider transition-colors shadow-[3px_3px_0px_0px_rgba(249,115,22,1)] cursor-pointer"
            >
              <span>APPLY AS PARTNER</span>
              <ArrowUpRight className="w-4 h-4 text-[#F97316]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
