import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface SnapViewer {
  profileId: string;
  viewedAt: string;
}

// Views already sent this session, so replaying a story doesn't write again.
const recorded = new Set<string>();

/** Counts this account as having seen someone else's snap (snap_views). Best effort. */
export function recordSnapView(snapId: string, profileId: string) {
  const key = `${snapId}:${profileId}`;
  if (!supabase || recorded.has(key)) return;
  recorded.add(key);
  void supabase
    .from('snap_views')
    .upsert({ snap_id: snapId, viewer_profile_id: profileId }, { onConflict: 'snap_id,viewer_id', ignoreDuplicates: true })
    .then(({ error }) => {
      if (error) recorded.delete(key);
    });
}

/** Who saw one of your snaps, newest first; null while loading. */
export function useSnapViewers(snapId: string | null): SnapViewer[] | null {
  const [viewers, setViewers] = useState<SnapViewer[] | null>(null);
  useEffect(() => {
    const client = supabase;
    if (!client || !snapId) return;
    let live = true;
    setViewers(null);
    client
      .from('snap_views')
      .select('viewer_profile_id, viewed_at')
      .eq('snap_id', snapId)
      .order('viewed_at', { ascending: false })
      .then(({ data }) => {
        if (live) setViewers((data ?? []).map((v) => ({ profileId: v.viewer_profile_id, viewedAt: v.viewed_at })));
      });
    return () => {
      live = false;
    };
  }, [snapId]);
  return viewers;
}
