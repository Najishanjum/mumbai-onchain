import type { EventItem } from '../types/event';
import { getEventEndDateTime, getEventStartDateTime } from '../lib/date';

// All event times are IST. Users may be on another timezone before they fly
// in, so labels always say the IST wall-clock time stored in the data.

const IST = 'Asia/Kolkata';

export type AppTab = 'today' | 'schedule' | 'people' | 'map' | 'me';

export function istDateKey(d: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return d.toLocaleDateString('en-CA', { timeZone: IST });
}

// Mumbai Onchain Week: IBW eve (31 Oct) through ETHGlobal's last day (7 Nov).
export const WEEK_START = '2026-10-31';
export const WEEK_END = '2026-11-07';
export const WEEK_DAYS = (() => {
  const days: string[] = [];
  const d = new Date(`${WEEK_START}T12:00:00+05:30`);
  while (istDateKey(d) <= WEEK_END) {
    days.push(istDateKey(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
})();

export function dayLabel(dateKey: string, today = istDateKey()): string {
  if (dateKey === today) return 'Today';
  const t = new Date(`${today}T12:00:00+05:30`);
  t.setDate(t.getDate() + 1);
  if (dateKey === istDateKey(t)) return 'Tomorrow';
  return new Date(`${dateKey}T12:00:00+05:30`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: IST,
  });
}

export function weekdayShort(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00+05:30`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: IST });
}

export function dayNumber(dateKey: string): string {
  return String(Number(dateKey.slice(8, 10)));
}

export function timeRange(e: EventItem): string {
  if (e.startTime === 'TBA') return 'Time TBA';
  if (e.startDate !== e.endDate) return `${e.startTime} · multi-day`;
  return e.endTime && e.endTime !== 'TBA' ? `${e.startTime}–${e.endTime}` : e.startTime;
}

/** "in 25 min", "in 3 h", "in 4 days" */
export function startsIn(e: EventItem, now = new Date()): string | null {
  const start = getEventStartDateTime(e);
  if (!start) return null;
  const mins = Math.round((start.getTime() - now.getTime()) / 60000);
  if (mins <= 0) return null;
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} h`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

/** "ends 18:00" for events on now */
export function endsAt(e: EventItem): string | null {
  return e.endTime && e.endTime !== 'TBA' ? `until ${e.endTime}` : null;
}

export function isLive(e: EventItem, now = new Date()): boolean {
  const s = getEventStartDateTime(e);
  const end = getEventEndDateTime(e);
  return Boolean(s && end && now >= s && now <= end);
}

export function hasEnded(e: EventItem, now = new Date()): boolean {
  const end = getEventEndDateTime(e);
  return Boolean(end && now > end);
}

export function sortByStart(a: EventItem, b: EventItem): number {
  const sa = getEventStartDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const sb = getEventStartDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return sa - sb;
}

/** Every calendar day (IST) an event covers, for multi-day events. */
export function eventDays(e: EventItem): string[] {
  const days: string[] = [];
  const d = new Date(`${e.startDate}T12:00:00+05:30`);
  const end = e.endDate || e.startDate;
  for (let i = 0; i < 31; i++) {
    const key = istDateKey(d);
    if (key > end) break;
    days.push(key);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** Events without an announced venue use this placeholder location. */
export const VENUE_TBA = 'Mumbai, India';

export function directionsUrl(e: EventItem): string {
  return e.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(`${e.location} ${e.address ?? 'Mumbai'}`)}`;
}

export function greeting(now = new Date()): string {
  const h = Number(now.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: IST }));
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
