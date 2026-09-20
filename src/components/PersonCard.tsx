import React from 'react';
import type { PersonProfile, ConnectionStatus } from '../types/person';
import { PersonAvatar } from './PersonAvatar';
import { MapPin, ArrowUpRight, UserCheck, Clock, Plus, Edit3 } from 'lucide-react';

interface PersonCardProps {
  person: PersonProfile;
  index: number;
  connectionStatus: ConnectionStatus;
  isCurrentUser: boolean;
  onViewProfile: (personId: string) => void;
  onCycleConnection: (personId: string) => void;
  onEditProfile: () => void;
  getEventTitleById: (id: string) => string;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  index,
  connectionStatus,
  isCurrentUser,
  onViewProfile,
  onCycleConnection,
  onEditProfile,
  getEventTitleById,
}) => {
  const displayNumber = String(index + 1).padStart(2, '0');

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

  // Format X handle
  const cleanXHandle = person.xHandle
    ? person.xHandle.replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '')
    : null;

  return (
    <div
      className={`group relative bg-[#FFFFFF] border p-6 flex flex-col justify-between transition-all duration-200 select-none overflow-hidden ${
        isCurrentUser
          ? 'border-2 border-[#000000] shadow-sm'
          : 'border-[#D8D8D8] hover:border-[#000000]'
      }`}
    >
      {/* Subtle Background Numbering */}
      <div className="absolute right-2 -bottom-4 font-mono font-black text-7xl sm:text-8xl text-[#F2F2F2] group-hover:text-[#EAEAEA] transition-colors pointer-events-none select-none z-0">
        {displayNumber}
      </div>

      <div className="relative z-10 space-y-4">
        {/* Top bar: Index + Category + Current User Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs sm:text-sm text-[#000000] font-bold">
              [{displayNumber}]
            </span>
            {isCurrentUser && (
              <span className="font-mono text-[10px] font-black uppercase bg-[#000000] text-[#FFFFFF] px-1.5 py-0.5 tracking-wider">
                YOU
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 border ${badgeStyle}`}
            >
              {person.category}
            </span>
          </div>
        </div>

        {/* Person Identity Header */}
        <div className="flex items-start gap-3.5">
          <div
            onClick={() => onViewProfile(person.id)}
            className="cursor-pointer transition-transform group-hover:scale-[1.02]"
            title={`View ${person.name}'s profile`}
          >
            <PersonAvatar
              name={person.name}
              avatarUrl={person.avatar}
              size="md"
              className="border-2 border-[#000000]"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              onClick={() => onViewProfile(person.id)}
              className="font-heading font-black text-lg sm:text-xl text-[#050505] group-hover:text-[#000000] transition-colors cursor-pointer truncate"
              title={person.name}
            >
              {person.name}
            </h3>

            <div className="flex items-center gap-1 text-xs text-[#555555] font-mono mt-0.5">
              <MapPin className="w-3 h-3 text-[#000000] shrink-0" />
              <span className="truncate font-semibold">{person.city}</span>
            </div>

            {/* Social handles snippet */}
            <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px] text-[#666666]">
              {cleanXHandle && (
                <a
                  href={`https://x.com/${cleanXHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-[#000000] hover:underline flex items-center gap-0.5"
                  title="X Profile"
                >
                  <span className="font-bold">𝕏</span> @{cleanXHandle}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="font-sans text-xs text-[#444444] leading-relaxed line-clamp-2 min-h-[32px]">
          {person.bio || 'Attending Mumbai Onchain Week 2026. Excited to connect with fellow builders and researchers.'}
        </p>

        {/* Attending Events Tags */}
        <div className="space-y-1.5 pt-1">
          <div className="font-mono text-[10px] text-[#888888] uppercase tracking-wider flex items-center justify-between">
            <span>Attending Events ({person.attendingEvents.length})</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {person.attendingEvents.slice(0, 2).map(eventId => (
              <span
                key={eventId}
                className="font-mono text-[10px] bg-[#F5F5F5] border border-[#E0E0E0] text-[#111111] px-1.5 py-0.5 truncate max-w-[190px]"
                title={getEventTitleById(eventId)}
              >
                {getEventTitleById(eventId)}
              </span>
            ))}
            {person.attendingEvents.length > 2 && (
              <span className="font-mono text-[10px] bg-[#EEEEEE] border border-[#D8D8D8] text-[#555555] px-1.5 py-0.5 font-bold">
                +{person.attendingEvents.length - 2} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Action Buttons */}
      <div className="relative z-10 pt-5 mt-4 border-t border-[#EAEAEA] flex items-center justify-between gap-2">
        <button
          onClick={() => onViewProfile(person.id)}
          className="font-mono text-xs font-bold text-[#000000] hover:underline flex items-center gap-1 transition-all py-1"
        >
          <span>VIEW PROFILE</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>

        {/* Connect Action Button */}
        {isCurrentUser ? (
          <button
            onClick={onEditProfile}
            className="inline-flex items-center gap-1 bg-[#F5F5F5] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] border border-[#000000] px-3 py-1 font-mono text-xs font-bold transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            <span>EDIT</span>
          </button>
        ) : (
          <button
            onClick={() => onCycleConnection(person.id)}
            title="Click to toggle status: CONNECT → REQUESTED → CONNECTED"
            className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold transition-all duration-150 border active:scale-95 ${
              connectionStatus === 'CONNECTED'
                ? 'bg-[#15803D] border-[#15803D] text-[#FFFFFF] hover:bg-[#166534]'
                : connectionStatus === 'REQUESTED'
                ? 'bg-[#D97706] border-[#D97706] text-[#FFFFFF] hover:bg-[#B45309]'
                : 'bg-[#000000] border-[#000000] text-[#FFFFFF] hover:bg-[#222222]'
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
                <span>REQUESTED</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>CONNECT</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
