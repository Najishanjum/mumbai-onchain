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

/**
 * The cover at the size it's shown. Luma's full uploads are often 1–2 MB;
 * its image CDN (and Unsplash) resize on request, so a 64 px thumbnail is a
 * few KB. Other images are returned as they are. Width is in CSS pixels;
 * the CDN doubles it for sharp screens.
 */
export function coverAt(src: string | null | undefined, width: number, square = false): string | null {
  if (!src) return null;
  try {
    const u = new URL(src, window.location.origin);
    if (u.host === 'images.lumacdn.com' && !u.pathname.startsWith('/cdn-cgi/')) {
      const opts = `format=auto,fit=cover,dpr=2,quality=75,width=${width}${square ? `,height=${width}` : ''}`;
      return `https://images.lumacdn.com/cdn-cgi/image/${opts}${u.pathname}`;
    }
    if (u.host === 'images.unsplash.com') {
      u.searchParams.set('w', String(width * 2));
      u.searchParams.set('q', '75');
      u.searchParams.set('auto', 'format');
      if (square) {
        u.searchParams.set('h', String(width * 2));
        u.searchParams.set('fit', 'crop');
      }
      return u.toString();
    }
  } catch {
    // not a URL: leave it
  }
  return src;
}
