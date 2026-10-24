import React from 'react';
import { BADGE_RING, useBadge } from '../lib/useBadges';

/**
 * A coloured ring around a photo for the Mumbai Onchain team (gold) and
 * community leads (saffron to pink). Everyone else: the photo as it is.
 */
export function BadgeRing({ personId, children, width = 2 }: { personId: string | undefined; children: React.ReactNode; width?: number }) {
  const { badge } = useBadge(personId);
  if (!badge) return <>{children}</>;
  return (
    <span
      className="inline-flex shrink-0 rounded-full"
      style={{ background: BADGE_RING[badge], padding: width }}
      title={badge === 'team' ? 'Mumbai Onchain team' : 'Community lead'}
    >
      {/* A thin gap in the page colour between the ring and the photo. */}
      <span className="inline-flex rounded-full bg-[var(--app-bg)]" style={{ padding: Math.max(1, width / 2) }}>
        {children}
      </span>
    </span>
  );
}
