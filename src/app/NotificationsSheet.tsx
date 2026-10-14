import { useCallback, useMemo, useState } from 'react';
import { Bell, CalendarClock, IdCard, Radio } from 'lucide-react';
import type { EventItem } from '../types/event';
import { getEventStartDateTime } from '../lib/date';
import { isLive, startsIn } from './time';
import { Sheet } from './ui';

const SEEN_KEY = 'mo_seen_notes';
const SOON_MS = 3 * 60 * 60 * 1000;

export interface Reminder {
  id: string;
  tone: 'live' | 'soon' | 'nudge';
  title: string;
  detail: string;
  eventId?: string;
}

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Reminders built from what the user already has: saved events that are on
 * now or start within 3 hours, and a nudge to make a badge. Nothing is sent
 * anywhere; the unread dot clears once the list has been opened.
 */
export function useReminders(events: EventItem[], isSaved: (id: string) => boolean, hasProfile: boolean, now: Date) {
  const reminders = useMemo<Reminder[]>(() => {
    const list: Reminder[] = [];
    for (const e of events) {
      if (!isSaved(e.id)) continue;
      if (isLive(e, now)) {
        list.push({ id: `live:${e.id}:${e.startDate}`, tone: 'live', title: `${e.title} is on now`, detail: e.location, eventId: e.id });
        continue;
      }
      const start = getEventStartDateTime(e);
      const ms = start ? start.getTime() - now.getTime() : -1;
      if (ms > 0 && ms <= SOON_MS) {
        list.push({ id: `soon:${e.id}:${e.startDate}`, tone: 'soon', title: `${e.title} starts ${startsIn(e, now)}`, detail: e.location, eventId: e.id });
      }
    }
    if (!hasProfile) {
      list.push({ id: 'nudge:badge', tone: 'nudge', title: 'Make your badge', detail: 'So people you meet can scan and add you.' });
    }
    return list;
  }, [events, isSaved, hasProfile, now]);

  const [seen, setSeen] = useState<string[]>(readSeen);
  const unread = reminders.some((r) => !seen.includes(r.id));
  const markSeen = useCallback(() => {
    const ids = reminders.map((r) => r.id);
    setSeen(ids);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    } catch {
      // fine without it; the dot just comes back next launch
    }
  }, [reminders]);

  return { reminders, unread, markSeen };
}

const ICONS = { live: Radio, soon: CalendarClock, nudge: IdCard } as const;
const TONES = {
  live: 'bg-[var(--app-live-soft)] text-[var(--app-live)]',
  soon: 'bg-[var(--app-saved-soft)] text-[var(--app-saved)]',
  nudge: 'bg-[var(--app-pressed)] text-[var(--app-primary)]',
} as const;

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

export function NotificationsSheet({
  isOpen,
  onClose,
  reminders,
  onOpenEvent,
  onCreateProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onOpenEvent: (id: string) => void;
  onCreateProfile: () => void;
}) {
  return (
    <Sheet open={isOpen} onClose={onClose} label="Notifications">
      <div className="px-5 pt-3">
        <h2 className="app-title text-[26px]">Notifications</h2>
        {reminders.length === 0 ? (
          <p className="mt-3 text-[15px] text-[var(--app-muted)]">
            Nothing right now. Save events and you’ll see them here when they’re about to start.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {reminders.map((r) => {
              const Icon = ICONS[r.tone];
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (r.eventId) onOpenEvent(r.eventId);
                      else onCreateProfile();
                    }}
                    className="app-press w-full flex items-center gap-3 p-3 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-left"
                  >
                    <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${TONES[r.tone]}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-bold leading-snug">{r.title}</span>
                      <span className="block text-[13px] text-[var(--app-muted)] truncate">{r.detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
