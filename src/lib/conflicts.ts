import type { EventItem, ScheduleConflict } from '../types/event';
import { getEventStartDateTime, getEventEndDateTime } from './date';
import { isBefore, isAfter } from 'date-fns';

/**
 * Detect all overlapping events in the user's schedule.
 * Only checks events with confirmed times (not TBA).
 */
export function detectScheduleConflicts(events: EventItem[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // Filter events with valid dates/times
  const validEvents = events.filter(e => e.startTime !== 'TBA' && e.endTime !== 'TBA');

  for (let i = 0; i < validEvents.length; i++) {
    for (let j = i + 1; j < validEvents.length; j++) {
      const e1 = validEvents[i];
      const e2 = validEvents[j];

      const start1 = getEventStartDateTime(e1);
      const end1 = getEventEndDateTime(e1);
      const start2 = getEventStartDateTime(e2);
      const end2 = getEventEndDateTime(e2);

      if (!start1 || !end1 || !start2 || !end2) continue;

      // Check if start1 < end2 AND start2 < end1 (Overlap condition)
      if (isBefore(start1, end2) && isBefore(start2, end1)) {
        // Calculate overlap window
        const overlapStart = isAfter(start1, start2) ? e1.startTime : e2.startTime;
        const overlapEnd = isBefore(end1, end2) ? e1.endTime : e2.endTime;

        conflicts.push({
          event1: e1,
          event2: e2,
          overlapStart,
          overlapEnd,
          date: e1.startDate === e2.startDate ? e1.startDate : `${e1.startDate} - ${e2.startDate}`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Check if a specific event has any conflict with other events.
 */
export function getEventConflicts(targetEvent: EventItem, allEvents: EventItem[]): EventItem[] {
  if (targetEvent.startTime === 'TBA' || targetEvent.endTime === 'TBA') return [];

  const start1 = getEventStartDateTime(targetEvent);
  const end1 = getEventEndDateTime(targetEvent);
  if (!start1 || !end1) return [];

  return allEvents.filter(e => {
    if (e.id === targetEvent.id || e.startTime === 'TBA' || e.endTime === 'TBA') return false;

    const start2 = getEventStartDateTime(e);
    const end2 = getEventEndDateTime(e);
    if (!start2 || !end2) return false;

    return isBefore(start1, end2) && isBefore(start2, end1);
  });
}
