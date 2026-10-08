import React, { useState } from 'react';
import { X, ExternalLink, MapPin, Users, Camera, Sparkles, UserPlus, Flame } from 'lucide-react';
import type { EventItem, UserEventNote, EventStatus } from '../types/event';
import { StatusBadge } from './StatusBadge';
import { CalendarButton } from './CalendarButton';
import { NotesPanel } from './NotesPanel';
import { usePeopleStore } from '../lib/usePeopleStore';
import { useSnapStore } from '../lib/useSnapStore';
import { calculateMatchScore } from '../lib/matchingEngine';

interface EventDrawerProps {
  event: EventItem | null;
  note?: UserEventNote;
  onClose: () => void;
  onUpdateStatus: (eventId: string, newStatus: EventStatus) => void;
  onSaveNote: (eventId: string, noteData: Partial<UserEventNote>) => void;
  onOpenPersonProfile?: (personId: string) => void;
}

const getDrawerEventLocation = (event: EventItem) => {
  const isDevcon8 =
    event.id === 'devcon-8-india' ||
    event.id === 'eip-hub-devcon-8' ||
    event.title.toLowerCase().includes('devcon 8') ||
    event.location.toLowerCase().includes('jio');

  if (isDevcon8) {
    return {
      location: 'Jio World Centre',
      address: event.address || 'Bandra Kurla Complex (BKC), Mumbai',
      mapUrl: event.mapUrl || 'https://maps.google.com/?q=Jio+World+Centre+BKC+Mumbai',
    };
  }

  const isIBW =
    event.id === 'india-blockchain-week-2026' ||
    event.title.toLowerCase().includes('blockchain week') ||
    event.title.toLowerCase().includes('ibw') ||
    event.location.toLowerCase().includes('fairmont');

  if (isIBW) {
    return {
      location: 'Fairmont Mumbai',
      address: event.address || 'Near International Airport, Sahar, Mumbai',
      mapUrl: event.mapUrl || 'https://maps.google.com/?q=Fairmont+Mumbai',
    };
  }

  const isETHGlobal =
    event.id === 'ethglobal-mumbai-2026' ||
    event.title.toLowerCase().includes('ethglobal') ||
    event.location.toLowerCase().includes('nesco');

  if (isETHGlobal) {
    return {
      location: 'NESCO Center',
      address: event.address || 'Western Express Hwy, Goregaon East, Mumbai',
      mapUrl: event.mapUrl || 'https://maps.google.com/?q=NESCO+Center+Goregaon+Mumbai',
    };
  }

  return {
    location: 'Mumbai, India',
    address: 'Mumbai, India',
    mapUrl: 'https://maps.google.com/?q=Mumbai+India',
  };
};

export const EventDrawer: React.FC<EventDrawerProps> = ({
  event,
  note,
  onClose,
  onUpdateStatus,
  onSaveNote,
  onOpenPersonProfile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'notes' | 'people' | 'snaps'>('info');
  const [matchFilter, setMatchFilter] = useState<string>('ALL');

  const { people, myProfile, connections, cycleConnection } = usePeopleStore();
  const { getSnapsByEvent, setActiveSnapForViewer, setIsAddSnapModalOpen } = useSnapStore();

  if (!event) return null;

  const drawerLoc = getDrawerEventLocation(event);

  // Attendees attending this event with deterministic match score
  const eventAttendees = people
    .filter(p => p.attendingEvents.includes(event.id) && !p.isCurrentUser && (!myProfile || p.id !== myProfile.id))
    .map(p => ({
      person: p,
      match: calculateMatchScore(myProfile, p, connections),
    }))
    .sort((a, b) => b.match.overall - a.match.overall);

  // Filtered attendees
  const filteredAttendees = eventAttendees.filter(({ person, match }) => {
    if (matchFilter === '90+') return match.overall >= 90;
    if (matchFilter === '80+') return match.overall >= 80;
    if (matchFilter === 'Builders') return person.category === 'Builder';
    if (matchFilter === 'Founders') return person.category === 'Founder';
    if (matchFilter === 'Students') return person.category === 'Student';
    if (matchFilter === 'Volunteers') return person.category === 'Volunteer';
    if (matchFilter === 'AI') {
      const text = `${person.bio} ${(person.skills || []).join(' ')} ${(person.interests || []).join(' ')}`.toLowerCase();
      return text.includes('ai') || text.includes('agent');
    }
    if (matchFilter === 'Ethereum') {
      const text = `${person.bio} ${(person.skills || []).join(' ')} ${(person.interests || []).join(' ')}`.toLowerCase();
      return text.includes('ethereum') || text.includes('solidity') || text.includes('zk');
    }
    return true;
  });

  const eventSnaps = getSnapsByEvent(event.id);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150 select-none">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] border-l-2 border-[#000000] h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        
        {/* Header bar */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#000000] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-pixel text-base font-bold text-[#000000]">
              CATALOGUE ENTRY
            </span>
            <span className="text-[#999999]">•</span>
            <StatusBadge status={event.status} size="sm" />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs Navigation */}
        <div className="flex border-b border-[#000000] bg-[#FAFAFA] px-4 font-mono text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`py-3 px-3 border-b-2 -mb-[1px] transition-all whitespace-nowrap ${
              activeSubTab === 'info'
                ? 'border-[#000000] text-[#000000] bg-white'
                : 'border-transparent text-[#777777] hover:text-[#000000]'
            }`}
          >
            01 // DETAILS
          </button>

          <button
            onClick={() => setActiveSubTab('people')}
            className={`py-3 px-3 border-b-2 -mb-[1px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'people'
                ? 'border-[#000000] text-[#000000] bg-white'
                : 'border-transparent text-[#777777] hover:text-[#000000]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#F97316]" />
            <span>02 // PEOPLE MATCH ({eventAttendees.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('snaps')}
            className={`py-3 px-3 border-b-2 -mb-[1px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'snaps'
                ? 'border-[#000000] text-[#000000] bg-white'
                : 'border-transparent text-[#777777] hover:text-[#000000]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>03 // SNAPS ({eventSnaps.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('notes')}
            className={`py-3 px-3 border-b-2 -mb-[1px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'notes'
                ? 'border-[#000000] text-[#000000] bg-white'
                : 'border-transparent text-[#777777] hover:text-[#000000]'
            }`}
          >
            <span>04 // MY NOTES</span>
            {(note?.peopleMet || note?.takeaways) && (
              <span className="w-2 h-2 rounded-full bg-[#000000]" />
            )}
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="p-5 sm:p-7 flex-1 space-y-6">
          
          {/* TAB 1: DETAILS */}
          {activeSubTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Event Title & Category */}
              <div>
                <div className="font-mono text-xs text-[#666666] uppercase tracking-widest mb-1">
                  CATEGORY: <span className="font-bold text-[#000000]">{event.category}</span>
                </div>
                <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#050505] uppercase tracking-tight leading-tight">
                  {event.title}
                </h2>
              </div>

              {/* Status Updater Button Group */}
              <div className="border border-[#D8D8D8] bg-[#FAFAFA] p-4 space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#666666] font-bold block">
                  UPDATE MY STATUS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['VOLUNTEER', 'ATTENDING', 'INTERESTED', 'PENDING', 'COMPLETED'] as EventStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateStatus(event.id, st)}
                      className={`px-2.5 py-1 font-mono text-xs transition-all border ${
                        event.status === st
                          ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                          : 'bg-[#FFFFFF] text-[#555555] border-[#D8D8D8] hover:border-[#000000] hover:text-[#000000]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Metadata Table */}
              <div className="border border-[#000000] divide-y divide-[#D8D8D8] font-mono text-xs">
                <div className="p-3.5 flex justify-between bg-[#FAFAFA]">
                  <span className="text-[#666666]">DATE:</span>
                  <span className="font-bold text-[#000000]">{event.startDate}</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-[#666666]">TIME:</span>
                  <span className="font-bold text-[#000000]">{event.startTime} — {event.endTime} IST</span>
                </div>
                <div className="p-3.5 flex justify-between bg-[#FAFAFA]">
                  <span className="text-[#666666]">ORGANIZER:</span>
                  <span className="font-bold text-[#000000]">{event.organizer}</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-[#666666]">LOCATION:</span>
                  <span className="font-bold text-[#000000] text-right">{drawerLoc.location}</span>
                </div>
                {drawerLoc.address && (
                  <div className="p-3.5 flex justify-between bg-[#FAFAFA]">
                    <span className="text-[#666666]">ADDRESS:</span>
                    <span className="text-[#333333] text-right max-w-xs">{drawerLoc.address}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="space-y-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#666666] font-bold block">
                    OVERVIEW:
                  </span>
                  <p className="font-sans text-sm text-[#333333] leading-relaxed border-l-2 border-[#000000] pl-4">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4">
                <a
                  href={event.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-between bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] px-5 py-3.5 font-mono text-xs font-bold tracking-wider transition-all"
                >
                  <span>OPEN OFFICIAL EVENT PORTAL →</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {(drawerLoc.mapUrl || event.mapUrl) && (
                  <a
                    href={drawerLoc.mapUrl || event.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-between bg-transparent hover:bg-[#F5F5F5] text-[#000000] border border-[#000000] px-5 py-3.5 font-mono text-xs font-semibold tracking-wider transition-all"
                  >
                    <span>OPEN MAP DESTINATION →</span>
                    <MapPin className="w-4 h-4" />
                  </a>
                )}

                <div className="pt-2">
                  <CalendarButton event={event} size="md" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEOPLE MATCHING AT THIS EVENT */}
          {activeSubTab === 'people' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-[#F97316] uppercase font-bold tracking-wider">
                  EVENT NETWORKING // COMPATIBILITY ALIGNMENT
                </div>
                <h3 className="font-heading font-black text-xl text-[#000000] uppercase">
                  PEOPLE YOU MAY WANT TO MEET
                </h3>
                <p className="font-mono text-xs text-[#666666]">
                  {eventAttendees.length} community members attending {event.title}. Filtered and ranked by your compatibility score.
                </p>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {['ALL', '90+', '80+', 'Builders', 'Founders', 'AI', 'Ethereum', 'Students', 'Volunteers'].map(flt => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setMatchFilter(flt)}
                    className={`px-2.5 py-1 border transition-colors ${
                      matchFilter === flt
                        ? 'bg-[#000000] text-[#FFFFFF] border-[#000000] font-bold'
                        : 'bg-[#FAFAFA] text-[#555555] border-[#CCCCCC] hover:border-[#000000]'
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>

              {/* Attendee Match Cards */}
              {filteredAttendees.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#D4D4D4] bg-[#FAFAFA] font-mono text-xs text-[#777777]">
                  No attendees matching this filter criteria for this event.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAttendees.map(({ person, match }) => (
                    <div
                      key={person.id}
                      className="p-3.5 bg-[#FFFFFF] border-2 border-[#000000] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
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

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-[#000000] truncate">
                              {person.name}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#F0FDF4] text-[#15803D] font-bold border border-[#86EFAC]">
                              {match.overall}% MATCH
                            </span>
                          </div>

                          <div className="font-mono text-[11px] text-[#666666] truncate">
                            {person.category} • {person.city}
                          </div>

                          {match.reasons.length > 0 && (
                            <div className="font-sans text-[11px] text-[#333333] flex items-center gap-1 truncate">
                              <Sparkles className="w-3 h-3 text-[#F97316] shrink-0" />
                              <span className="truncate">{match.reasons[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenPersonProfile) {
                              onClose();
                              onOpenPersonProfile(person.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F5F5F5] text-[#000000] border border-[#000000] font-mono text-xs font-bold transition-colors cursor-pointer"
                        >
                          PROFILE
                        </button>

                        <button
                          type="button"
                          onClick={() => cycleConnection(person.id)}
                          className="px-3 py-1.5 bg-[#000000] hover:bg-[#222222] text-[#FFFFFF] font-mono text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3 text-[#22C55E]" />
                          <span>CONNECT</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVENT SNAPS WALL */}
          {activeSubTab === 'snaps' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-lg text-[#000000] uppercase">
                    📸 EVENT SNAPS ({eventSnaps.length})
                  </h3>
                  <p className="font-mono text-xs text-[#666666]">
                    Attendee photo memories from {event.title}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddSnapModalOpen(true, event.id)}
                  className="px-3 py-1.5 bg-[#000000] text-white hover:bg-[#222222] font-mono text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>+ ADD SNAP</span>
                </button>
              </div>

              {eventSnaps.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[#D4D4D4] bg-[#FAFAFA] space-y-2">
                  <Camera className="w-8 h-8 text-[#888888] mx-auto" />
                  <p className="font-mono text-xs text-[#555555]">
                    No photos uploaded for this session yet. Be the first!
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddSnapModalOpen(true, event.id)}
                    className="mt-2 px-4 py-2 bg-[#000000] text-white font-mono text-xs font-bold cursor-pointer"
                  >
                    UPLOAD EVENT SNAP
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {eventSnaps.map(snap => (
                    <div
                      key={snap.id}
                      onClick={() => setActiveSnapForViewer(snap)}
                      className="group relative bg-[#000000] border-2 border-[#000000] aspect-square overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <img
                        src={snap.thumbnailUrl || snap.imageUrl}
                        alt={snap.caption || 'Event Snap'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 flex flex-col justify-end p-2 transition-opacity">
                        <div className="font-mono text-[9.5px] text-[#22C55E] uppercase truncate font-bold">
                          by {snap.authorName.split(' ')[0]}
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

          {/* TAB 4: MY NOTES */}
          {activeSubTab === 'notes' && (
            <NotesPanel event={event} note={note} onSave={(data) => onSaveNote(event.id, data)} />
          )}

        </div>

        {/* Footer info strip */}
        <div className="p-4 bg-[#FAFAFA] border-t border-[#D8D8D8] text-[11px] font-mono text-[#777777] flex items-center justify-between">
          <span>MUMBAI // ONCHAIN WEEK 2026</span>
          <span>SAVED TO LOCAL STORAGE & SUPABASE</span>
        </div>

      </div>

    </div>
  );
};
