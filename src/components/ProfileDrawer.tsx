import React from 'react';
import { X, ExternalLink, MapPin, UserCheck, Clock, Plus, Edit3 } from 'lucide-react';
import type { PersonProfile, ConnectionStatus } from '../types/person';
import type { EventItem } from '../types/event';
import { PersonAvatar } from './PersonAvatar';

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
  if (!person) return null;

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

  // Format handles
  const cleanXHandle = person.xHandle
    ? person.xHandle.replace(/^@/, '').replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '')
    : null;
  const cleanGithub = person.githubUrl
    ? person.githubUrl.replace(/https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')
    : null;

  // Match attending event objects
  const attendedEventsList = events.filter(e => person.attendingEvents.includes(e.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-end animate-in fade-in duration-150 select-none">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-[#FFFFFF] border-l-2 border-[#000000] h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        
        {/* Header bar */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#000000] p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-base font-bold text-[#000000]">
              COMMUNITY PROFILE
            </span>
            <span className="text-[#999999]">•</span>
            <span
              className={`font-mono text-xs font-bold uppercase px-2 py-0.5 border ${badgeStyle}`}
            >
              {person.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF] text-[#000000] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6 sm:p-8 space-y-8 flex-1">
          
          {/* Top Hero: Avatar + Name + Location + Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-[#EAEAEA] pb-6">
            <PersonAvatar
              name={person.name}
              avatarUrl={person.avatar}
              size="xl"
              className="border-2 border-[#000000] shadow-md"
            />

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#050505] tracking-tight">
                  {person.name}
                </h2>
                {isCurrentUser && (
                  <span className="font-mono text-xs font-black uppercase bg-[#000000] text-[#FFFFFF] px-2 py-0.5">
                    YOUR PROFILE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#555555] font-mono">
                <MapPin className="w-3.5 h-3.5 text-[#000000]" />
                <span className="font-semibold text-[#111111]">{person.city}</span>
                <span className="text-[#CCCCCC]">•</span>
                <span>Active for Mumbai Week</span>
              </div>

              {/* Status / Connect Button inside hero */}
              <div className="pt-2">
                {isCurrentUser ? (
                  <button
                    onClick={() => {
                      onClose();
                      onEditProfile();
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#000000] text-[#FFFFFF] px-4 py-2 font-mono text-xs font-bold hover:bg-[#222222] transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>EDIT MY PROFILE</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onCycleConnection(person.id)}
                      className={`inline-flex items-center gap-2 px-5 py-2 font-mono text-xs font-bold transition-all border shadow-sm ${
                        connectionStatus === 'CONNECTED'
                          ? 'bg-[#15803D] border-[#15803D] text-[#FFFFFF] hover:bg-[#166534]'
                          : connectionStatus === 'REQUESTED'
                          ? 'bg-[#D97706] border-[#D97706] text-[#FFFFFF] hover:bg-[#B45309]'
                          : 'bg-[#000000] border-[#000000] text-[#FFFFFF] hover:bg-[#222222]'
                      }`}
                    >
                      {connectionStatus === 'CONNECTED' ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>CONNECTED</span>
                        </>
                      ) : connectionStatus === 'REQUESTED' ? (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>REQUEST SENT</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>CONNECT</span>
                        </>
                      )}
                    </button>
                    <span className="font-mono text-[11px] text-[#777777]">
                      {connectionStatus === 'CONNECTED'
                        ? 'You are connected'
                        : connectionStatus === 'REQUESTED'
                        ? 'Request pending'
                        : 'Click to connect'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Biography Section */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-[#888888] uppercase tracking-wider">
              ABOUT // BIO
            </h4>
            <div className="bg-[#FAFAFA] border border-[#EAEAEA] p-4 text-[#222222] font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {person.bio || 'No bio provided yet.'}
            </div>
          </div>

          {/* Social Links Grid */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-[#888888] uppercase tracking-wider">
              ONLINE PRESENCE & LINKS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
              {cleanXHandle ? (
                <a
                  href={`https://x.com/${cleanXHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-[#000000] bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-black text-sm">𝕏</span>
                    <span className="font-bold">@{cleanXHandle}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="p-3 border border-dashed border-[#D8D8D8] text-[#999999] flex items-center gap-2">
                  <span className="font-black text-sm">𝕏</span>
                  <span>Not linked</span>
                </div>
              )}

              {cleanGithub ? (
                <a
                  href={person.githubUrl?.startsWith('http') ? person.githubUrl : `https://github.com/${cleanGithub}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-[#000000] bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-bold">GitHub:</span>
                    <span className="font-bold truncate max-w-[130px]">{cleanGithub}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="p-3 border border-dashed border-[#D8D8D8] text-[#999999] flex items-center gap-2">
                  <span>GitHub:</span>
                  <span>Not linked</span>
                </div>
              )}

              {person.linkedinUrl && (
                <a
                  href={person.linkedinUrl.startsWith('http') ? person.linkedinUrl : `https://${person.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:col-span-2 flex items-center justify-between p-3 border border-[#000000] bg-[#FFFFFF] hover:bg-[#000000] hover:text-[#FFFFFF] transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-bold">LinkedIn:</span>
                    <span className="truncate max-w-[280px] font-bold">{person.linkedinUrl}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </a>
              )}
            </div>
          </div>

          {/* Attending Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs font-bold text-[#888888] uppercase tracking-wider">
                ATTENDING EVENTS ({person.attendingEvents.length})
              </h4>
            </div>

            {attendedEventsList.length === 0 ? (
              <div className="p-4 border border-dashed border-[#D8D8D8] text-center font-mono text-xs text-[#777777]">
                No events selected yet.
              </div>
            ) : (
              <div className="space-y-2">
                {attendedEventsList.map(evt => (
                  <div
                    key={evt.id}
                    className="p-3 border border-[#E0E0E0] hover:border-[#000000] bg-[#FFFFFF] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-[#000000] text-[#FFFFFF] px-1.5 py-0.5 font-bold">
                          {evt.startDate.slice(5)}
                        </span>
                        <span className="font-mono text-[10px] text-[#666666]">
                          {evt.category}
                        </span>
                      </div>
                      <h5 className="font-heading font-black text-sm text-[#000000] truncate mt-1">
                        {evt.title}
                      </h5>
                      <div className="font-mono text-[11px] text-[#666666] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#000000]" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>

                    {onSelectEvent && (
                      <button
                        onClick={() => {
                          onClose();
                          onSelectEvent(evt.id);
                        }}
                        className="font-mono text-[11px] font-bold text-[#000000] hover:underline shrink-0 p-2 border border-[#EAEAEA] hover:border-[#000000]"
                      >
                        VIEW EVENT
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#FAFAFA] border-t border-[#000000] p-4 flex items-center justify-between">
          <div className="font-mono text-[11px] text-[#666666]">
            MUMBAI ONCHAIN WEEK // COMMUNITY NETWORK
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#000000] text-[#FFFFFF] font-mono text-xs font-bold hover:bg-[#222222] transition-colors"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};
