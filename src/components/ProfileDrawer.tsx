import React, { useState } from 'react';
import type { PersonProfile, ConnectionStatus } from '../types/person';
import type { EventItem } from '../types/event';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useSnapStore } from '../lib/useSnapStore';
import { calculateMatchScore } from '../lib/matchingEngine';
import { MatchBreakdownCard } from './MatchBreakdownCard';
import {
  X,
  MapPin,
  UserCheck,
  Clock,
  UserPlus,
  Edit3,
  QrCode,
  Copy,
  Check,
  Sparkles,
  Camera,
  Flame,
  ExternalLink,
  Activity,
  Users,
} from 'lucide-react';
import { ProfileQrModal } from './ProfileQrModal';

interface ProfileDrawerProps {
  person: PersonProfile | null;
  connectionStatus: ConnectionStatus;
  isCurrentUser: boolean;
  events: EventItem[];
  onClose: () => void;
  onCycleConnection: (personId: string) => void;
  onEditProfile: () => void;
  onSelectEvent?: (eventId: string) => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  person,
  connectionStatus,
  isCurrentUser,
  events,
  onClose,
  onCycleConnection,
  onEditProfile,
  onSelectEvent,
}) => {
  const { myProfile, connections, people } = usePeopleStore();
  const { getSnapsByAuthor, setActiveSnapForViewer, setIsAddSnapModalOpen } = useSnapStore();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SNAPS' | 'EVENTS' | 'MATCH' | 'CONNECTIONS'>('OVERVIEW');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!person) return null;

  // Match score against current user
  const match = calculateMatchScore(myProfile, person, connections);
  const snaps = getSnapsByAuthor(person.id);
  const attendedEventsList = events.filter(e => person.attendingEvents.includes(e.id));

  // Category badge styling
  const categoryStyles: Record<string, string> = {
    Builder: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    Founder: 'bg-[#FAF5FF] text-[#6B21A8] border-[#E9D5FF]',
    Volunteer: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
    Student: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    Attendee: 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]',
    Other: 'bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]',
  };
  const badgeStyle = categoryStyles[person.category] || categoryStyles.Other;

  // Clean handles
  const cleanXHandle = person.xHandle
    ? person.xHandle.replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '')
    : null;
  const cleanGithub = person.githubUrl
    ? person.githubUrl.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')
    : null;
  const cleanTg = person.telegramHandle
    ? person.telegramHandle.replace(/^@/, '').replace(/https?:\/\/t\.me\//, '')
    : null;

  const handleCopyProfileUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mumbaionchain.xyz';
    const profileUrl = `${origin}/?tab=people&person=${encodeURIComponent(person.id)}`;
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150 select-none"
      role="dialog"
      aria-label="Profile Dossier"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#FFFFFF] border-l-2 border-[#000000] h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#000000] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-sm font-bold text-[#000000]">
              BUILDER IDENTITY
            </span>
            <span className="text-[#999999]">•</span>
            <span className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 border ${badgeStyle}`}>
              {person.category}
            </span>
            {!isCurrentUser && (
              <span className="font-mono text-[11px] font-black px-2 py-0.5 bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74]">
                {match.overall}% MATCH
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="p-1.5 px-2.5 border-2 border-[#000000] bg-[#FAFAFA] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="QR Pass"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">QR PASS</span>
            </button>

            {isCurrentUser && (
              <button
                type="button"
                onClick={onEditProfile}
                className="p-1.5 px-2.5 border-2 border-[#000000] bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">EDIT</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 border border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 sm:p-6 space-y-6">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row items-start gap-4 border-b border-[#000000] pb-6">
            <div className="relative shrink-0">
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt={person.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover border-2 border-[#000000] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#111111] text-white flex items-center justify-center font-heading font-black text-2xl border-2 border-[#000000]">
                  {person.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#050505] tracking-tight truncate">
                    {person.name}
                  </h2>
                  <div className="font-mono text-xs text-[#555555] flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[#000000] font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>{person.city}</span>
                    </span>
                    <span>•</span>
                    <span className="text-[#666666]">{person.category}</span>
                    {cleanXHandle && (
                      <>
                        <span>•</span>
                        <span className="text-[#0052FF]">@{cleanXHandle}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Connect button in header */}
                {!isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => onCycleConnection(person.id)}
                    className={`shrink-0 px-3 py-2 font-mono text-xs font-bold border-2 transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                      connectionStatus === 'CONNECTED'
                        ? 'bg-[#22C55E] text-[#000000] border-[#000000]'
                        : connectionStatus === 'REQUESTED'
                        ? 'bg-[#FEF08A] text-[#713F12] border-[#000000]'
                        : 'bg-[#000000] text-[#FFFFFF] border-[#000000] hover:bg-[#222222]'
                    }`}
                  >
                    {connectionStatus === 'CONNECTED' ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>CONNECTED</span>
                      </>
                    ) : connectionStatus === 'REQUESTED' ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>PENDING</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>CONNECT</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {person.headline && (
                <p className="font-sans text-xs font-medium text-[#222222]">
                  {person.headline}
                </p>
              )}

              {/* Social Link Strip */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {cleanXHandle && (
                  <a
                    href={`https://x.com/${cleanXHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-bold text-[#000000] hover:text-[#0052FF] flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>𝕏 @{cleanXHandle}</span>
                  </a>
                )}
                {cleanGithub && (
                  <a
                    href={`https://github.com/${cleanGithub}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-bold text-[#000000] hover:text-[#0052FF] flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>GitHub</span>
                  </a>
                )}
                {person.linkedinUrl && (
                  <a
                    href={person.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-bold text-[#000000] hover:text-[#0052FF] flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>LinkedIn</span>
                  </a>
                )}
                {cleanTg && (
                  <a
                    href={`https://t.me/${cleanTg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] font-bold text-[#000000] hover:text-[#0052FF] flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>TG</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleCopyProfileUrl}
                  className="font-mono text-[11px] text-[#666666] hover:text-[#000000] flex items-center gap-1 ml-auto"
                  title="Copy Profile Link"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'COPIED' : 'SHARE'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4-TAB NAVIGATION BAR */}
          <div className="flex border-b-2 border-[#000000] font-mono text-xs font-bold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`py-2 px-3 border-b-2 -mb-[2px] transition-colors whitespace-nowrap ${
                activeTab === 'OVERVIEW'
                  ? 'border-[#000000] text-[#000000] bg-[#F5F5F5]'
                  : 'border-transparent text-[#666666] hover:text-[#000000]'
              }`}
            >
              OVERVIEW
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SNAPS')}
              className={`py-2 px-3 border-b-2 -mb-[2px] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'SNAPS'
                  ? 'border-[#000000] text-[#000000] bg-[#F5F5F5]'
                  : 'border-transparent text-[#666666] hover:text-[#000000]'
              }`}
            >
              <span>📸 SNAPS</span>
              <span className="font-mono text-[10px] px-1 bg-[#E5E5E5] text-[#000000]">
                {snaps.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EVENTS')}
              className={`py-2 px-3 border-b-2 -mb-[2px] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'EVENTS'
                  ? 'border-[#000000] text-[#000000] bg-[#F5F5F5]'
                  : 'border-transparent text-[#666666] hover:text-[#000000]'
              }`}
            >
              <span>🎟️ EVENTS</span>
              <span className="font-mono text-[10px] px-1 bg-[#E5E5E5] text-[#000000]">
                {person.attendingEvents.length}
              </span>
            </button>

            {!isCurrentUser && (
              <button
                type="button"
                onClick={() => setActiveTab('MATCH')}
                className={`py-2 px-3 border-b-2 -mb-[2px] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'MATCH'
                    ? 'border-[#F97316] text-[#C2410C] bg-[#FFF7ED]'
                    : 'border-transparent text-[#C2410C] hover:bg-[#FFF7ED]'
                }`}
              >
                <span>🔥 {match.overall}% MATCH</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('CONNECTIONS')}
              className={`py-2 px-3 border-b-2 -mb-[2px] transition-colors whitespace-nowrap ${
                activeTab === 'CONNECTIONS'
                  ? 'border-[#000000] text-[#000000] bg-[#F5F5F5]'
                  : 'border-transparent text-[#666666] hover:text-[#000000]'
              }`}
            >
              NETWORK
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* CURRENTLY BUILDING */}
              {person.currentlyBuilding && (
                <div className="p-4 bg-[#0A0A0A] text-white border-2 border-[#000000] space-y-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="font-mono text-[10px] text-[#22C55E] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>CURRENTLY BUILDING</span>
                  </div>
                  <p className="font-heading font-black text-sm sm:text-base text-white">
                    {person.currentlyBuilding}
                  </p>
                  {person.lookingFor && (
                    <div className="font-mono text-xs text-[#A3A3A3] pt-1 border-t border-[#222222]">
                      <span className="text-white font-bold">Looking For: </span>
                      {person.lookingFor}
                    </div>
                  )}
                </div>
              )}

              {/* BIO */}
              {person.bio && (
                <div className="space-y-1.5">
                  <div className="font-mono text-xs font-bold text-[#000000] uppercase tracking-wider">
                    ABOUT
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-[#444444] leading-relaxed bg-[#FAFAFA] p-3.5 border border-[#E5E5E5]">
                    {person.bio}
                  </p>
                </div>
              )}

              {/* SKILLS */}
              {person.skills && person.skills.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-xs font-bold text-[#000000] uppercase tracking-wider">
                    TECHNICAL SKILLS & STACK
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {person.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="font-mono text-xs font-bold px-2.5 py-1 bg-[#FFFFFF] border-2 border-[#000000] text-[#000000] shadow-2xs"
                      >
                        🛠️ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* INTERESTS */}
              {person.interests && person.interests.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-xs font-bold text-[#000000] uppercase tracking-wider">
                    INTERESTS & FOCUS AREAS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {person.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="font-mono text-xs font-bold px-2.5 py-1 bg-[#FAF5FF] border border-[#E9D5FF] text-[#6B21A8]"
                      >
                        ✦ {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT ACTIVITY */}
              {person.recentActivity && person.recentActivity.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-xs font-bold text-[#000000] uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>RECENT ACTIVITY</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs bg-[#FAFAFA] p-3 border border-[#E5E5E5]">
                    {person.recentActivity.map(act => (
                      <div key={act.id} className="flex items-center justify-between text-[#444444] py-1 border-b border-[#F0F0F0] last:border-0">
                        <span className="truncate">{act.text}</span>
                        <span className="text-[10px] text-[#888888] shrink-0">{act.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SNAPS (3-Column Desktop / 2-Column Mobile Grid) */}
          {activeTab === 'SNAPS' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-lg text-[#000000] uppercase tracking-tight">
                    📸 EVENT SNAPS ({snaps.length})
                  </h3>
                  <p className="font-mono text-[11px] text-[#666666]">
                    Visual moments captured by {person.name.split(' ')[0]} during Mumbai Onchain Week.
                  </p>
                </div>

                {isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => setIsAddSnapModalOpen(true)}
                    className="px-3 py-1.5 bg-[#000000] text-white hover:bg-[#222222] font-mono text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>+ ADD SNAP</span>
                  </button>
                )}
              </div>

              {snaps.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[#D4D4D4] bg-[#FAFAFA] space-y-2">
                  <Camera className="w-8 h-8 text-[#888888] mx-auto" />
                  <p className="font-mono text-xs text-[#555555]">
                    No Snaps published yet by this attendee.
                  </p>
                  {isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => setIsAddSnapModalOpen(true)}
                      className="mt-2 px-4 py-2 bg-[#000000] text-white font-mono text-xs font-bold"
                    >
                      PUBLISH FIRST SNAP
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {snaps.map(snap => (
                    <div
                      key={snap.id}
                      onClick={() => setActiveSnapForViewer(snap)}
                      className="group relative bg-[#000000] border-2 border-[#000000] aspect-square overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <img
                        src={snap.thumbnailUrl || snap.imageUrl}
                        alt={snap.caption || 'Event Snap'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Dark overlay & metadata */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 flex flex-col justify-end p-2 transition-opacity">
                        <div className="font-mono text-[9px] text-[#22C55E] uppercase truncate font-bold">
                          {snap.eventName || 'Devcon 8'}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white font-mono">
                          <span>{snap.date}</span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-[#F97316] fill-[#F97316]" />
                            <span>{snap.reactions.fire + snap.reactions.heart}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVENTS */}
          {activeTab === 'EVENTS' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="font-mono text-xs font-bold text-[#000000] uppercase tracking-wider">
                ATTENDING ({attendedEventsList.length} SESSIONS)
              </div>

              {attendedEventsList.length === 0 ? (
                <p className="font-mono text-xs text-[#777777] italic">No public events listed.</p>
              ) : (
                <div className="space-y-2">
                  {attendedEventsList.map(evt => (
                    <div
                      key={evt.id}
                      onClick={() => {
                        onClose();
                        if (onSelectEvent) onSelectEvent(evt.id);
                      }}
                      className="p-3 bg-[#FFFFFF] hover:bg-[#FAFAFA] border-2 border-[#000000] flex items-center justify-between gap-3 cursor-pointer transition-all hover:-translate-x-0.5 shadow-2xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="font-mono text-[10px] text-[#F97316] font-bold uppercase">
                          {evt.category} • {evt.startDate}
                        </div>
                        <div className="font-heading font-black text-sm text-[#000000] truncate">
                          {evt.title}
                        </div>
                        <div className="font-mono text-[10.5px] text-[#666666] truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#DC2626]" />
                          <span>{evt.location}</span>
                        </div>
                      </div>

                      <ExternalLink className="w-4 h-4 text-[#888888] shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MATCH (Deep compatibility breakdown) */}
          {activeTab === 'MATCH' && !isCurrentUser && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <MatchBreakdownCard
                match={match}
                targetName={person.name}
                targetRole={person.headline || `${person.category} • ${person.city}`}
              />
            </div>
          )}

          {/* TAB 5: CONNECTIONS */}
          {activeTab === 'CONNECTIONS' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="font-mono text-xs font-bold text-[#000000] uppercase tracking-wider">
                SHARED ONCHAIN NETWORK
              </div>

              <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs text-[#333333]">
                  <Users className="w-4 h-4 text-[#9333EA]" />
                  <span>
                    Estimated <strong>{match.mutualConnectionsCount} mutual connections</strong> in Mumbai Onchain directory.
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E5E5E5] space-y-2">
                  <div className="font-mono text-[11px] text-[#666666] uppercase">
                    SUGGESTED PEER CONTACTS:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {people
                      .filter(p => p.id !== person.id && !p.isCurrentUser)
                      .slice(0, 4)
                      .map(peer => (
                        <div key={peer.id} className="p-2 bg-white border border-[#D4D4D4] flex items-center gap-2">
                          {peer.avatar ? (
                            <img src={peer.avatar} alt={peer.name} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                              {peer.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 font-mono text-xs truncate">
                            <div className="font-bold truncate">{peer.name}</div>
                            <div className="text-[10px] text-[#777777] truncate">{peer.category}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sticky Drawer Footer */}
        <div className="sticky bottom-0 bg-[#FFFFFF] border-t-2 border-[#000000] p-4 flex items-center justify-between gap-3">
          <div className="font-mono text-xs text-[#666666] truncate">
            {isCurrentUser ? 'Your Public Profile' : `Viewing ${person.name}`}
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentUser && (
              <button
                type="button"
                onClick={() => onCycleConnection(person.id)}
                className={`px-4 py-2 font-mono text-xs font-bold border-2 transition-all cursor-pointer shadow-xs ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-[#22C55E] text-[#000000] border-[#000000]'
                    : connectionStatus === 'REQUESTED'
                    ? 'bg-[#FEF08A] text-[#713F12] border-[#000000]'
                    : 'bg-[#000000] text-[#FFFFFF] border-[#000000] hover:bg-[#222222]'
                }`}
              >
                {connectionStatus === 'CONNECTED' ? 'CONNECTED' : connectionStatus === 'REQUESTED' ? 'PENDING' : 'CONNECT'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-[#000000] bg-[#FAFAFA] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] font-mono text-xs font-bold transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>

      </div>

      {/* QR Pass Modal */}
      {isQrModalOpen && (
        <ProfileQrModal
          person={person}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          connectionStatus={connectionStatus}
          onCycleConnection={onCycleConnection}
          isCurrentUser={isCurrentUser}
        />
      )}
    </div>
  );
};
