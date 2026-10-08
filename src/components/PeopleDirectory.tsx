import React, { useState } from 'react';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useSnapStore } from '../lib/useSnapStore';
import { calculateMatchScore } from '../lib/matchingEngine';
import type { EventItem } from '../types/event';
import type { PersonCategory, PersonProfile } from '../types/person';
import { PersonCard } from './PersonCard';
import { PersonAvatar } from './PersonAvatar';
import { ProfileQrModal } from './ProfileQrModal';
import { ProfileScannerModal } from './ProfileScannerModal';
import { BuilderSpeedMatch } from './BuilderSpeedMatch';
import { SurpriseMeModal } from './SurpriseMeModal';
import {
  Search,
  Users,
  Camera,
  QrCode,
  Sparkles,
  RefreshCw,
  Compass,
  Flame,
  UserPlus,
  UserCheck,
  Clock,
  X,
} from 'lucide-react';

interface PeopleDirectoryProps {
  events: EventItem[];
  onSelectEvent?: (eventId: string) => void;
}

const CATEGORY_TABS: Array<'ALL' | PersonCategory> = [
  'ALL',
  'Builder',
  'Founder',
  'Volunteer',
  'Student',
  'Attendee',
  'Other',
];

const FLAGSHIP_EVENT_CHIPS = [
  { id: 'ALL', label: 'ALL EVENTS' },
  { id: 'devcon-8-india', label: '🎟️ DEVCON 8' },
  { id: 'india-blockchain-week-2026', label: '🎟️ IBW MUMBAI' },
  { id: 'ethglobal-mumbai-2026', label: '🎟️ ETHGLOBAL' },
  { id: 'ethereum-cypherpunk-congress-3', label: '🎟️ CYPHERPUNK' },
];

function formatSnapTime(createdAt?: string, fallbackDate?: string): string {
  if (!createdAt) return fallbackDate || 'Nov 2026';
  try {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    if (diffMs < 0) return fallbackDate || 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return fallbackDate || new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return fallbackDate || 'Nov 2026';
  }
}

export const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({ events }) => {
  const {
    people,
    myProfile,
    filters,
    filteredPeople,
    stats,
    isSyncing,
    setSelectedPersonId,
    setIsEditModalOpen,
    setFilters,
    cycleConnection,
    getConnectionStatus,
  } = usePeopleStore();

  const {
    recentSnaps,
    setActiveSnapForViewer,
    setIsAddSnapModalOpen,
  } = useSnapStore();

  const [qrTargetPerson, setQrTargetPerson] = useState<PersonProfile | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isSurpriseModalOpen, setIsSurpriseModalOpen] = useState<boolean>(false);

  // Helper to resolve event name
  const getEventTitleById = (id: string): string => {
    const found = events.find(e => e.id === id);
    return found ? found.title : id;
  };

  // Top 5 Highest Quality Matches for "WHO SHOULD I MEET?"
  const topMatches = React.useMemo(() => {
    return people
      .filter(p => !p.isCurrentUser && (!myProfile || p.id !== myProfile.id))
      .map(p => ({
        person: p,
        match: calculateMatchScore(myProfile, p),
      }))
      .sort((a, b) => b.match.overall - a.match.overall)
      .slice(0, 5);
  }, [people, myProfile]);

  return (
    <div className="space-y-10 select-none pb-12">
      
      {/* ──────────────────────────────────────────────────────────────────
          PAGE HEADER
          ────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] border-2 border-[#000000] p-6 sm:p-8 space-y-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAEAEA] pb-6">
          <div className="space-y-1.5">
            <div className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 flex-wrap">
              <span className="text-[#666666]">COMMUNITY NETWORKING // 01—08 NOV 2026</span>
              <span className="text-[#CCCCCC]">•</span>
              <span className="inline-flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-0.5 text-[#15803D] font-bold">
                <span className="w-2 h-2 bg-[#22C55E] rounded-full inline-block animate-pulse" />
                <span>COMMUNITY LIVE</span>
                {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-[#15803D]" />}
              </span>
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-6xl text-[#050505] uppercase tracking-tight">
              PEOPLE & CONNECT
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#555555] max-w-2xl">
              Find builders. Find your people. Connect via algorithmic builder compatibility, exchange digital QR passes, and share live event Snaps.
            </p>
          </div>

          {/* Action Buttons: Add Snap + Camera Scanner + My QR Pass */}
          <div className="shrink-0 flex items-center flex-wrap gap-2.5">
            {/* + Add Snap Quick Button */}
            <button
              type="button"
              onClick={() => setIsAddSnapModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] border-2 border-[#000000] px-4 py-3 font-heading font-black text-xs sm:text-sm tracking-wide transition-all shadow-[3px_3px_0px_0px_rgba(249,115,22,1)] active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#22C55E]" />
              <span>+ ADD SNAP</span>
            </button>

            {/* Open Camera Scanner Button */}
            <button
              type="button"
              onClick={() => setIsScannerModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#22C55E] hover:bg-[#16a34a] text-[#000000] hover:text-[#FFFFFF] border-2 border-[#000000] px-4 py-3 font-heading font-black text-xs sm:text-sm tracking-wide transition-all active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer group"
              title="Open camera scanner to scan any attendee's QR Pass"
            >
              <QrCode className="w-4 h-4" />
              <span>SCAN QR PROFILE</span>
            </button>

            {myProfile ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQrTargetPerson(myProfile)}
                  className="inline-flex items-center gap-1.5 bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] border-2 border-[#000000] px-3.5 py-3 font-mono text-xs font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
                  title="Show your QR Connect Pass"
                >
                  <span>MY QR PASS</span>
                </button>

                <div
                  onClick={() => setIsEditModalOpen(true)}
                  className="cursor-pointer border-2 border-[#000000] p-1.5 bg-[#FAFAFA] hover:bg-[#F0F0F0] flex items-center gap-2 transition-colors shadow-xs"
                  title="Edit your profile"
                >
                  <PersonAvatar
                    name={myProfile.name}
                    avatarUrl={myProfile.avatar}
                    size="sm"
                  />
                  <div className="hidden lg:block text-left font-mono pr-2">
                    <div className="text-xs font-black truncate max-w-[120px]">{myProfile.name}</div>
                    <div className="text-[10px] text-[#16a34a] font-bold">EDIT PROFILE</div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#FFFFFF] hover:bg-[#F5F5F5] text-[#000000] border-2 border-[#000000] px-4 py-3 font-mono text-xs font-black tracking-wide transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
              >
                <span>+ CREATE PROFILE</span>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-3 bg-[#FAFAFA] border border-[#000000]">
            <div className="text-[10px] text-[#666666] uppercase">TOTAL PROFILES</div>
            <div className="text-xl font-black text-[#000000] font-heading">{stats.total}</div>
          </div>
          <div className="p-3 bg-[#F0FDF4] border border-[#22C55E]">
            <div className="text-[10px] text-[#15803D] uppercase">CONNECTED</div>
            <div className="text-xl font-black text-[#15803D] font-heading">{stats.connectedCount}</div>
          </div>
          <div className="p-3 bg-[#FFFBEB] border border-[#F59E0B]">
            <div className="text-[10px] text-[#B45309] uppercase">PENDING</div>
            <div className="text-xl font-black text-[#B45309] font-heading">{stats.requestedCount}</div>
          </div>
          <div className="p-3 bg-[#FAFAFA] border border-[#000000]">
            <div className="text-[10px] text-[#666666] uppercase">BUILDERS</div>
            <div className="text-xl font-black text-[#000000] font-heading">{stats.buildersCount}</div>
          </div>
          <div className="p-3 bg-[#FAFAFA] border border-[#000000]">
            <div className="text-[10px] text-[#666666] uppercase">VOLUNTEERS</div>
            <div className="text-xl font-black text-[#000000] font-heading">{stats.volunteersCount}</div>
          </div>
          <div className="p-3 bg-[#FAFAFA] border border-[#000000]">
            <div className="text-[10px] text-[#666666] uppercase">COMMUNITY SNAPS</div>
            <div className="text-xl font-black text-[#F97316] font-heading">{recentSnaps.length}</div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 1: ✦ WHO SHOULD I MEET? (Top 5 Personalized Matches)
          ────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-end justify-between border-b-2 border-[#000000] pb-2">
          <div>
            <div className="font-mono text-[10px] text-[#F97316] uppercase font-bold tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-[#F97316]" />
              <span>ALGORITHMIC BUILDER COMPATIBILITY</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] uppercase tracking-tight">
              ✦ WHO SHOULD I MEET?
            </h2>
            <p className="font-mono text-xs text-[#555555]">
              Find people you'll actually want to talk to. Ranked by shared technical interests, dev tools, and active event attendance.
            </p>
          </div>
        </div>

        {/* Top 5 Cards Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {topMatches.map(({ person, match }) => {
            const status = getConnectionStatus(person.id);
            return (
              <div
                key={person.id}
                className="bg-[#FFFFFF] border-2 border-[#000000] p-4 flex flex-col justify-between space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] transition-all hover:-translate-y-0.5"
              >
                {/* Score Pill & Category */}
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2">
                  <span className="font-mono text-xs font-black px-2 py-0.5 bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74]">
                    {match.categoryEmoji} {match.overall}% MATCH
                  </span>
                  <span className="font-mono text-[10px] text-[#666666] uppercase">
                    {person.category}
                  </span>
                </div>

                {/* Identity */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    {person.avatar ? (
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#000000] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-black text-white font-bold flex items-center justify-center shrink-0">
                        {person.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4
                        onClick={() => setSelectedPersonId(person.id)}
                        className="font-heading font-black text-sm text-[#000000] truncate cursor-pointer hover:underline"
                      >
                        {person.name}
                      </h4>
                      <div className="font-mono text-[10px] text-[#666666] truncate">
                        {person.city} • {person.headline ? person.headline.split('·')[0].trim() : person.category}
                      </div>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {person.skills && person.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {person.skills.slice(0, 3).map((sk, idx) => (
                        <span key={idx} className="font-mono text-[9px] bg-[#FAFAFA] border border-[#D4D4D4] px-1.5 py-0.5 text-[#333333]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Events attending */}
                  <div className="font-mono text-[10px] text-[#444444] truncate flex items-center gap-1">
                    <span>🎟️</span>
                    <span className="truncate">
                      {person.attendingEvents.map(e => getEventTitleById(e).split(' ')[0]).slice(0, 2).join(' · ')}
                    </span>
                  </div>

                  {/* Why you match */}
                  <div className="bg-[#FAF5FF] border border-[#E9D5FF] p-2 rounded text-[10.5px] font-sans text-[#581C87] space-y-0.5">
                    <div className="font-mono text-[9px] font-bold uppercase text-[#7E22CE]">WHY YOU MATCH:</div>
                    <div className="line-clamp-2">
                      {match.reasons.length > 0 ? match.reasons[0] : 'High Builder Compatibility'}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-[#F0F0F0] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPersonId(person.id)}
                    className="flex-1 py-1.5 px-2 bg-[#FFFFFF] hover:bg-[#F5F5F5] text-black border border-[#000000] font-mono text-[10.5px] font-bold text-center transition-colors cursor-pointer"
                  >
                    VIEW
                  </button>

                  <button
                    type="button"
                    onClick={() => cycleConnection(person.id)}
                    className={`py-1.5 px-2.5 font-mono text-[10.5px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                      status === 'CONNECTED'
                        ? 'bg-[#22C55E] text-black border-[#000000]'
                        : status === 'REQUESTED'
                        ? 'bg-[#FEF08A] text-black border-[#000000]'
                        : 'bg-[#000000] text-white border-[#000000] hover:bg-[#222222]'
                    }`}
                  >
                    {status === 'CONNECTED' ? (
                      <UserCheck className="w-3 h-3" />
                    ) : status === 'REQUESTED' ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <UserPlus className="w-3 h-3" />
                    )}
                    <span>{status === 'CONNECTED' ? 'YES' : status === 'REQUESTED' ? 'WAIT' : 'CONNECT'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 2: ⚡ LIVE NETWORKING & SURPRISE ME
          ────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-[#000000] pb-2">
          <div>
            <div className="font-mono text-[10px] text-[#22C55E] uppercase font-bold tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
              <span>ACTIVE DISCOVERY CHANNELS</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] uppercase tracking-tight">
              ⚡ LIVE NETWORKING
            </h2>
            <p className="font-mono text-xs text-[#555555]">
              People currently looking to connect in Mumbai. Join the 15-minute round-robin or discover unexpected builder connections.
            </p>
          </div>

          {/* ✦ SURPRISE ME button */}
          <button
            type="button"
            onClick={() => setIsSurpriseModalOpen(true)}
            className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] border-2 border-[#000000] font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-[3px_3px_0px_0px_rgba(249,115,22,1)] active:scale-95 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#F97316]" />
            <span>✦ SURPRISE ME</span>
          </button>
        </div>

        {/* Builder Speed Match Countdown Widget */}
        <BuilderSpeedMatch onOpenProfile={(id) => setSelectedPersonId(id)} />
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 3: 📸 RECENT SNAPS (Visual Event Memory Stream)
          ────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#000000] pb-2">
          <div>
            <div className="font-mono text-[10px] text-[#A855F7] uppercase font-bold tracking-widest flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>VISUAL EVENT MEMORY FEED</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] uppercase tracking-tight">
              📸 RECENT SNAPS
            </h2>
            <p className="font-mono text-xs text-[#555555]">
              See Mumbai Onchain Week through the eyes of the people attending it. Click any snap to view memory & builder profile.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddSnapModalOpen(true)}
            className="px-3.5 py-2 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>+ ADD SNAP</span>
          </button>
        </div>

        {/* Snaps Grid with Empty State */}
        {recentSnaps.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-[#000000] bg-[#FAFAFA] space-y-2">
            <Camera className="w-8 h-8 text-[#888888] mx-auto mb-1" />
            <p className="font-heading font-black text-sm uppercase text-[#000000]">
              📸 No community Snaps yet.
            </p>
            <p className="font-mono text-xs text-[#666666]">
              Be the first to capture a moment.
            </p>
            <button
              type="button"
              onClick={() => setIsAddSnapModalOpen(true)}
              className="mt-2 px-4 py-2 bg-[#000000] hover:bg-[#222222] text-white font-heading font-black text-xs uppercase cursor-pointer"
            >
              + ADD SNAP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {recentSnaps.slice(0, 8).map(snap => (
              <div
                key={snap.id}
                onClick={() => setActiveSnapForViewer(snap)}
                className="group bg-[#FFFFFF] border-2 border-[#000000] overflow-hidden cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div className="relative aspect-4/3 bg-[#000000] overflow-hidden">
                  <img
                    src={snap.thumbnailUrl || snap.imageUrl}
                    alt={snap.caption || 'Event Snap'}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[9.5px] font-mono text-white flex items-center gap-1">
                    <Flame className="w-3 h-3 text-[#F97316] fill-[#F97316]" />
                    <span>{snap.reactions.fire + snap.reactions.heart}</span>
                  </div>
                </div>

                {/* Creator & Event metadata below image */}
                <div className="p-2.5 bg-[#FFFFFF] border-t border-[#000000] space-y-1.5">
                  {/* Creator Photo & Name (Clicking opens their existing profile) */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPersonId(snap.authorId);
                    }}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group/author"
                    title={`View ${snap.authorName}'s Profile`}
                  >
                    {snap.authorAvatar ? (
                      <img
                        src={snap.authorAvatar}
                        alt={snap.authorName}
                        loading="lazy"
                        className="w-5 h-5 rounded-full object-cover border border-[#000000] shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#000000] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                        {snap.authorName.charAt(0)}
                      </div>
                    )}
                    <span className="font-heading font-black text-xs text-[#000000] truncate group-hover/author:underline">
                      {snap.authorName}
                    </span>
                  </div>

                  {/* Event Name & Upload Time */}
                  <div className="flex items-center justify-between text-[10.5px] font-mono">
                    <span className="text-[#22C55E] truncate font-bold">
                      {snap.eventName || 'Devcon 8'}
                    </span>
                    <span className="text-[#666666] shrink-0 text-[10px]">
                      {formatSnapTime(snap.createdAt, snap.date)}
                    </span>
                  </div>

                  {snap.caption && (
                    <p className="font-sans text-[11px] text-[#555555] line-clamp-1 italic">
                      "{snap.caption}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 4: 🎟️ AT YOUR EVENTS (Event Filter Quick Bar)
          ────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="border-b-2 border-[#000000] pb-2">
          <div className="font-mono text-[10px] text-[#666666] uppercase font-bold tracking-widest">
            SESSION FILTER
          </div>
          <h2 className="font-heading font-black text-2xl text-[#000000] uppercase tracking-tight">
            🎟️ AT YOUR EVENTS
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {FLAGSHIP_EVENT_CHIPS.map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilters({ ...filters, eventId: chip.id })}
              className={`px-3 py-2 font-mono text-xs font-bold border-2 transition-all cursor-pointer ${
                filters.eventId === chip.id
                  ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] shadow-[2px_2px_0px_0px_rgba(249,115,22,1)]'
                  : 'bg-[#FFFFFF] text-[#000000] border-[#000000] hover:bg-[#F5F5F5]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          SECTION 5: 🌐 ALL PEOPLE (Full Directory)
          ────────────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="border-b-2 border-[#000000] pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] text-[#666666] uppercase font-bold tracking-widest">
              GLOBAL COMMUNITY INDEX
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] uppercase tracking-tight">
              🌐 ALL PEOPLE ({filteredPeople.length})
            </h2>
          </div>

          {/* Connection Filter Toggle */}
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, connectionStatus: 'ALL' })}
              className={`px-2.5 py-1 border transition-colors ${
                filters.connectionStatus === 'ALL'
                  ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                  : 'bg-[#FFFFFF] text-[#555555] border-[#CCCCCC]'
              }`}
            >
              ALL
            </button>
            <button
              type="button"
              onClick={() => setFilters({ ...filters, connectionStatus: 'CONNECTED' })}
              className={`px-2.5 py-1 border transition-colors ${
                filters.connectionStatus === 'CONNECTED'
                  ? 'bg-[#22C55E] text-black border-[#000000] font-bold'
                  : 'bg-[#FFFFFF] text-[#555555] border-[#CCCCCC]'
              }`}
            >
              CONNECTED ({stats.connectedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilters({ ...filters, connectionStatus: 'REQUESTED' })}
              className={`px-2.5 py-1 border transition-colors ${
                filters.connectionStatus === 'REQUESTED'
                  ? 'bg-[#FEF08A] text-black border-[#000000] font-bold'
                  : 'bg-[#FFFFFF] text-[#555555] border-[#CCCCCC]'
              }`}
            >
              PENDING ({stats.requestedCount})
            </button>
          </div>
        </div>

        {/* Search Bar + Category Pills */}
        <div className="bg-[#FFFFFF] border-2 border-[#000000] p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by name, role, city, bio, skills, or projects..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAFA] border border-[#CCCCCC] focus:border-[#000000] font-mono text-xs focus:outline-none"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#000000]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {CATEGORY_TABS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilters({ ...filters, category: cat })}
                className={`px-3 py-1.5 border transition-all cursor-pointer ${
                  filters.category === cat
                    ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                    : 'bg-[#FAFAFA] text-[#555555] border-[#D4D4D4] hover:border-[#000000]'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Grid */}
        {filteredPeople.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-[#CCCCCC] bg-[#FAFAFA] space-y-2">
            <Users className="w-8 h-8 text-[#888888] mx-auto" />
            <h4 className="font-heading font-black text-sm uppercase">NO PROFILES MATCHED</h4>
            <p className="font-mono text-xs text-[#666666]">
              Try relaxing your search terms or resetting category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.map((person, idx) => (
              <PersonCard
                key={person.id}
                person={person}
                index={idx}
                connectionStatus={getConnectionStatus(person.id)}
                isCurrentUser={Boolean(person.isCurrentUser || (myProfile && myProfile.id === person.id))}
                onViewProfile={(id) => setSelectedPersonId(id)}
                onCycleConnection={cycleConnection}
                onEditProfile={() => setIsEditModalOpen(true)}
                onOpenQr={(p) => setQrTargetPerson(p)}
                getEventTitleById={getEventTitleById}
              />
            ))}
          </div>
        )}
      </section>

      {/* QR Connect Pass Modal */}
      {qrTargetPerson && (
        <ProfileQrModal
          person={qrTargetPerson}
          isOpen={Boolean(qrTargetPerson)}
          onClose={() => setQrTargetPerson(null)}
          connectionStatus={getConnectionStatus(qrTargetPerson.id)}
          onCycleConnection={cycleConnection}
          isCurrentUser={Boolean(qrTargetPerson.isCurrentUser || (myProfile && myProfile.id === qrTargetPerson.id))}
        />
      )}

      {/* Live QR Camera Scanner Modal */}
      {isScannerModalOpen && (
        <ProfileScannerModal
          isOpen={isScannerModalOpen}
          people={people}
          onClose={() => setIsScannerModalOpen(false)}
          onSelectPerson={(id) => setSelectedPersonId(id)}
          onCycleConnection={cycleConnection}
          getConnectionStatus={getConnectionStatus}
        />
      )}

      {/* Surprise Discovery Modal */}
      <SurpriseMeModal
        isOpen={isSurpriseModalOpen}
        onClose={() => setIsSurpriseModalOpen(false)}
        onOpenProfile={(id) => setSelectedPersonId(id)}
      />

    </div>
  );
};
