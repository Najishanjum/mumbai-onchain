import type { EventItem } from '../types/event';
import { EVENT_COVERS } from '../data/eventCovers';

// Events whose links are dead (404) but the repo already has artwork for.
const LOCAL_ART: Record<string, string> = {
  'quantstamp-mumbai-lounge': '/images/quantstamp-lounge.png',
  'multichain-day-devcon-mumbai': '/images/multichain-day.png',
};

/** Best available cover for an event, or null for the generated fallback. */
export function eventCover(e: EventItem): string | null {
  return EVENT_COVERS[e.id] || e.imageUrl || LOCAL_ART[e.id] || null;
}
