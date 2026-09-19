import { format, parseISO, isAfter, isBefore, isEqual } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { EventItem } from '../types/event';

export const TIMEZONE = 'Asia/Kolkata';

// Get current date/time in Asia/Kolkata
export function getCurrentISTDate(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

// Format date string for display (e.g. "03 NOV 2026", "NOV 01")
export function formatDateDisplay(dateStr: string, formatPattern: string = 'dd MMM yyyy'): string {
  try {
    const parsed = parseISO(dateStr);
    return format(parsed, formatPattern).toUpperCase();
  } catch (e) {
    return dateStr;
  }
}

// Calculate countdown to November 1, 2026 00:00 IST
export function getCountdownToNov1(now: Date = new Date()) {
  // Nov 1 2026 00:00:00 IST
  const targetDate = new Date('2026-11-01T00:00:00+05:30');
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / 1000 / 60) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, isPast: false };
}

// Convert event date and time string into a Date object in IST
export function getEventStartDateTime(event: EventItem): Date | null {
  if (!event.startDate || event.startTime === 'TBA') return null;
  const timeStr = event.startTime.length === 5 ? `${event.startTime}:00` : '00:00:00';
  return new Date(`${event.startDate}T${timeStr}+05:30`);
}

export function getEventEndDateTime(event: EventItem): Date | null {
  if (!event.endDate || event.endTime === 'TBA') return null;
  const timeStr = event.endTime.length === 5 ? `${event.endTime}:00` : '23:59:59';
  return new Date(`${event.endDate}T${timeStr}+05:30`);
}

// Determine if an event is currently LIVE NOW
export function isEventLiveNow(event: EventItem, now: Date = new Date()): boolean {
  const start = getEventStartDateTime(event);
  const end = getEventEndDateTime(event);
  if (!start || !end) return false;

  return (isAfter(now, start) || isEqual(now, start)) && (isBefore(now, end) || isEqual(now, end));
}

// Determine if an event is already COMPLETED
export function isEventCompleted(event: EventItem, now: Date = new Date()): boolean {
  const end = getEventEndDateTime(event);
  if (!end) return false;
  return isAfter(now, end);
}

// Calculate the next upcoming event
export function getNextUpcomingEvent(events: EventItem[], now: Date = new Date()): EventItem | null {
  const upcoming = events
    .filter(e => {
      const start = getEventStartDateTime(e);
      return start && isAfter(start, now);
    })
    .sort((a, b) => {
      const startA = getEventStartDateTime(a)?.getTime() || 0;
      const startB = getEventStartDateTime(b)?.getTime() || 0;
      return startA - startB;
    });

  return upcoming.length > 0 ? upcoming[0] : null;
}

// Calculate events for a given date in IST (YYYY-MM-DD)
export function getEventsForDate(events: EventItem[], dateStr: string): EventItem[] {
  return events.filter(e => {
    // Single day event or multi-day spanning dateStr
    if (e.startDate === dateStr) return true;
    if (e.startDate <= dateStr && e.endDate >= dateStr) return true;
    return false;
  }).sort((a, b) => {
    if (a.startTime === 'TBA') return 1;
    if (b.startTime === 'TBA') return -1;
    return a.startTime.localeCompare(b.startTime);
  });
}
