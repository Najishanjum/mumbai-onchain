import { useCallback, useMemo, useState } from 'react';
import { Bell, CalendarClock, Check, IdCard, Megaphone, MessageCircle, UserPlus } from 'lucide-react';
import type { EventItem } from '../types/event';
import { getEventStartDateTime } from '../lib/date';
import { usePeopleStore } from '../lib/usePeopleStore';
import { PersonAvatar } from '../components/PersonAvatar';
import { roleColor } from './Badge';
import { isLive, startsIn } from './time';
import { LiveDot, Sheet } from './ui';

// id → when it was first seen. Older builds kept a plain list of ids.
const SEEN_KEY = 'mo_seen_notes';
// Follows, replies and community messages leave the list this long after you've seen them.
const KEEP_SEEN_MS = 48 * 60 * 60 * 1000;
const SOON_MS = 3 * 60 * 60 * 1000;

export interface Reminder {
  id: string;
  tone: 'live' | 'soon' | 'nudge' | 'added' | 'reply' | 'message';
  title: string;
  detail: string;
  eventId?: string;
  personId?: string;
  /** When it happened (people who added you, replies). */
  at?: string;
  /** Who it's from, for their photo. */
  person?: { name: string; avatar?: string; role?: string };
  /** The story they replied to. */
  thumb?: string;
  /** A community's message: opens its page. */
  communityId?: string;
}

/** A message from one of your communities. */
export interface CommunityNote {
  id: string;
  communityId: string;
  name: string;
  logo?: string;
  title: string;
  body: string;
  at: string;
}

export interface AddedBy {
  personId: string;
  name: string;
  avatar?: string;
  role?: string;
  at: string;
}

export interface RepliedBy extends AddedBy {
  id: string;
  body: string;
  thumb?: string;
}

function readSeen(): Record<string, number> {
  try {
    const saved = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    if (Array.isArray(saved)) return Object.fromEntries(saved.map((id: string) => [id, Date.now()]));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

/**
 * Reminders built from what the user already has: saved events that are on
 * now or start within 3 hours, people who added you, replies to your stories,
 * and a nudge to make a badge. The unread dot clears once the list is opened.
 */
export function useReminders(
  events: EventItem[],
  isSaved: (id: string) => boolean,
  hasProfile: boolean,
  now: Date,
  addedBy: AddedBy[] = [],
  repliedBy: RepliedBy[] = [],
  messages: CommunityNote[] = []
) {
  const all = useMemo<Reminder[]>(() => {
    // Time-sensitive first: saved events on now or about to start.
    const list: Reminder[] = [];
    for (const e of events) {
      if (!isSaved(e.id)) continue;
      if (isLive(e, now)) {
        list.push({ id: `live:${e.id}:${e.startDate}`, tone: 'live', title: e.title, detail: e.location, eventId: e.id });
        continue;
      }
      const start = getEventStartDateTime(e);
      const ms = start ? start.getTime() - now.getTime() : -1;
      if (ms > 0 && ms <= SOON_MS) {
        list.push({ id: `soon:${e.id}:${e.startDate}`, tone: 'soon', title: e.title, detail: `Starts ${startsIn(e, now)} · ${e.location}`, eventId: e.id });
      }
    }
    // Then people, newest first.
    const social: Reminder[] = [
      ...repliedBy.map((r) => ({
        id: `reply:${r.id}`,
        tone: 'reply' as const,
        title: r.name,
        detail: r.body,
        personId: r.personId,
        at: r.at,
        person: { name: r.name, avatar: r.avatar, role: r.role },
        thumb: r.thumb,
      })),
      ...messages.map((m) => ({
        id: `msg:${m.id}`,
        tone: 'message' as const,
        title: m.name,
        detail: m.body ? `${m.title}. ${m.body}` : m.title,
        communityId: m.communityId,
        at: m.at,
        person: { name: m.name, avatar: m.logo },
      })),
      ...addedBy.map((a) => ({
        id: `added:${a.personId}`,
        tone: 'added' as const,
        title: a.name,
        detail: '',
        personId: a.personId,
        at: a.at,
        person: { name: a.name, avatar: a.avatar, role: a.role },
      })),
    ].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
    list.push(...social);
    if (!hasProfile) {
      list.push({ id: 'nudge:badge', tone: 'nudge', title: 'Make your badge', detail: 'So people you meet can scan and add you.' });
    }
    return list;
  }, [events, isSaved, hasProfile, now, addedBy, repliedBy, messages]);

  const [seen, setSeen] = useState<Record<string, number>>(readSeen);
  // People who added you and replies stay until seen, then for 48 hours.
  const visible = useMemo(
    () => all.filter((r) => !((r.tone === 'added' || r.tone === 'reply' || r.tone === 'message') && seen[r.id] && now.getTime() - seen[r.id] > KEEP_SEEN_MS)),
    [all, seen, now]
  );
  const unread = visible.some((r) => !seen[r.id]);
  /** Marks everything seen and returns what was new, for the New section. */
  const markSeen = useCallback((): Set<string> => {
    const fresh = new Set(visible.filter((r) => !seen[r.id]).map((r) => r.id));
    // Keep first-seen times; drop ids that no longer exist.
    const next: Record<string, number> = {};
    for (const r of all) {
      const at = seen[r.id] ?? (visible.includes(r) ? Date.now() : undefined);
      if (at) next[r.id] = at;
    }
    setSeen(next);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {
      // fine without it; the dot just comes back next launch
    }
    return fresh;
  }, [all, visible, seen]);

  // What dropped off after 48 hours, behind "See older".
  const older = useMemo(() => all.filter((r) => !visible.includes(r)), [all, visible]);
  return { reminders: visible, older, unread, markSeen };
}

export function BellButton({ unread, onClick }: { unread: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={unread ? 'Notifications, new' : 'Notifications'}
      className="app-press relative shrink-0 w-11 h-11 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center"
    >
      <Bell className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
      {unread && (
        <span className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-[var(--app-live)] border-2 border-[var(--app-surface)]" aria-hidden="true" />
      )}
    </button>
  );
}

/** "now", "5m", "2h", "3d", like a chat app. */
function ago(iso: string | undefined, now: number): string {
  if (!iso) return '';
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / (60 * 24))}d`;
}

function SectionLabel({ children }: { children: string }) {
  return <h3 className="px-5 pt-5 pb-1.5 text-[15px] font-bold">{children}</h3>;
}

/** Their photo, with a small mark for what they did. */
function PersonMark({ person, tone }: { person: NonNullable<Reminder['person']>; tone: 'added' | 'reply' | 'message' }) {
  const Icon = tone === 'added' ? UserPlus : tone === 'message' ? Megaphone : MessageCircle;
  return (
    <span className="relative shrink-0">
      <PersonAvatar name={person.name} avatarUrl={person.avatar} size="md" className="rounded-full! border-0! w-11! h-11!" />
      <span
        className="absolute -right-0.5 -bottom-0.5 w-5 h-5 rounded-full border-2 border-[var(--app-bg)] flex items-center justify-center text-white"
        style={{ background: roleColor(person.role) }}
        aria-hidden="true"
      >
        <Icon className="w-2.5 h-2.5" strokeWidth={3} />
      </span>
    </span>
  );
}

export function NotificationsSheet({
  isOpen,
  onClose,
  reminders,
  older = [],
  fresh,
  onOpenEvent,
  onCreateProfile,
  onOpenPerson,
  onOpenCommunity,
}: {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  /** Seen more than 48 hours ago: hidden until "See older". */
  older?: Reminder[];
  /** What was unread when the sheet opened. */
  fresh: Set<string>;
  onOpenEvent: (id: string) => void;
  onCreateProfile: () => void;
  onOpenPerson: (id: string) => void;
  onOpenCommunity?: (id: string) => void;
}) {
  const { getConnectionStatus, setConnectionStatus } = usePeopleStore();
  const [showOlder, setShowOlder] = useState(false);
  const now = Date.now();
  const upcoming = reminders.filter((r) => r.tone === 'live' || r.tone === 'soon');
  const people = reminders.filter((r) => r.tone === 'added' || r.tone === 'reply' || r.tone === 'message');
  const nudges = reminders.filter((r) => r.tone === 'nudge');
  const newPeople = people.filter((r) => fresh.has(r.id));
  const earlier = people.filter((r) => !fresh.has(r.id));

  const open = (r: Reminder) => {
    onClose();
    // A message: its community's page (the team's notes to leads have none).
    if (r.tone === 'message') {
      if (r.communityId) onOpenCommunity?.(r.communityId);
    } else if (r.personId) onOpenPerson(r.personId);
    else if (r.eventId) onOpenEvent(r.eventId);
    else onCreateProfile();
  };

  const row = 'app-press w-full flex items-center gap-3 px-5 py-2.5 text-left active:bg-[var(--app-pressed)]';

  const personRow = (r: Reminder) => {
    const added = r.personId ? getConnectionStatus(r.personId) === 'CONNECTED' : false;
    return (
      <li key={r.id} className="relative">
        <button type="button" onClick={() => open(r)} className={row}>
          <PersonMark person={r.person!} tone={r.tone as 'added' | 'reply' | 'message'} />
          <span className={`flex-1 min-w-0 text-[15px] leading-snug line-clamp-3 ${r.tone === 'added' ? 'pr-24' : ''}`}>
            <b className="font-bold">{r.title}</b>{' '}
            {r.tone === 'added' ? 'started following you.' : r.tone === 'message' ? r.detail : <>replied to your story: “{r.detail}”</>}{' '}
            <span className="text-[var(--app-muted)]">{ago(r.at, now)}</span>
          </span>
          {r.tone === 'reply' && r.thumb && <img src={r.thumb} alt="" className="shrink-0 w-10 h-[52px] rounded-md object-cover bg-[var(--app-line)]" />}
        </button>
        {/* Outside the row button, so it adds instead of opening the profile. */}
        {r.tone === 'added' && r.personId && (
          <button
            type="button"
            onClick={() => setConnectionStatus(r.personId!, 'CONNECTED')}
            disabled={added}
            className={`absolute right-5 top-1/2 -translate-y-1/2 h-8 px-3.5 rounded-lg text-[14px] font-bold inline-flex items-center gap-1 ${
              added ? 'bg-[var(--app-pressed)] text-[var(--app-muted)]' : 'app-press bg-[var(--app-primary)] text-[var(--app-on-primary)]'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                Following
              </>
            ) : (
              'Follow back'
            )}
          </button>
        )}
      </li>
    );
  };

  return (
    <Sheet open={isOpen} onClose={onClose} label="Notifications">
      <div className="pt-3 pb-2">
        <h2 className="px-5 app-title text-[26px]">Notifications</h2>

        {reminders.length === 0 ? (
          <div className="px-8 pt-12 pb-10 text-center">
            <span className="mx-auto w-16 h-16 rounded-full border-2 border-[var(--app-line)] flex items-center justify-center">
              <Bell className="w-7 h-7 text-[var(--app-muted)]" aria-hidden="true" />
            </span>
            <p className="mt-4 text-[17px] font-bold">You’re all caught up</p>
            <p className="mt-1 text-[15px] text-[var(--app-muted)]">When someone follows you, replies to your story or your community sends a message, or a saved event is about to start, it shows up here.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <SectionLabel>Coming up</SectionLabel>
                <ul>
                  {upcoming.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => open(r)} className={row}>
                        <span
                          className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                            r.tone === 'live' ? 'bg-[var(--app-live-soft)]' : 'bg-[var(--app-saved-soft)] text-[var(--app-saved)]'
                          }`}
                        >
                          {r.tone === 'live' ? <LiveDot /> : <CalendarClock className="w-5 h-5" aria-hidden="true" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[15px] font-bold leading-snug truncate">{r.title}</span>
                          <span className={`block text-[14px] truncate ${r.tone === 'live' ? 'text-[var(--app-live)] font-semibold' : 'text-[var(--app-muted)]'}`}>
                            {r.tone === 'live' ? `On now · ${r.detail}` : r.detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {newPeople.length > 0 && (
              <>
                <SectionLabel>New</SectionLabel>
                <ul>{newPeople.map(personRow)}</ul>
              </>
            )}
            {earlier.length > 0 && (
              <>
                <SectionLabel>Earlier</SectionLabel>
                <ul>{earlier.map(personRow)}</ul>
              </>
            )}
            {nudges.map((r) => (
              <button key={r.id} type="button" onClick={() => open(r)} className={`${row} mt-4`}>
                <span className="shrink-0 w-11 h-11 rounded-xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] flex items-center justify-center">
                  <IdCard className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-bold">{r.title}</span>
                  <span className="block text-[14px] text-[var(--app-muted)]">{r.detail}</span>
                </span>
              </button>
            ))}
          </>
        )}
        {older.length > 0 &&
          (showOlder ? (
            <>
              <SectionLabel>Older</SectionLabel>
              <ul>{older.map(personRow)}</ul>
            </>
          ) : (
            <button type="button" onClick={() => setShowOlder(true)} className="mt-3 mx-5 w-[calc(100%-40px)] h-11 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] text-[15px] font-semibold">
              See older notifications ({older.length})
            </button>
          ))}
      </div>
    </Sheet>
  );
}
