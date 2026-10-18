import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface ConnectionCounts {
  /** People this profile added. */
  added: number;
  /** People who added this profile. */
  addedYou: number;
}

/**
 * "Added 12 · Added you 8" for a profile, from connection_counts() in the
 * database (counts only; who added whom stays private). Null until loaded,
 * or when accounts aren't set up. `refresh` re-reads it, e.g. after an add.
 */
export function useConnectionCounts(profileId: string | undefined, refresh: unknown = null): ConnectionCounts | null {
  const [counts, setCounts] = useState<ConnectionCounts | null>(null);
  useEffect(() => {
    const client = supabase;
    if (!client || !profileId) return;
    let live = true;
    client.rpc('connection_counts', { p_profile_id: profileId }).then(({ data, error }) => {
      if (!live || error) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setCounts({ added: row.added ?? 0, addedYou: row.added_you ?? 0 });
    });
    return () => {
      live = false;
    };
  }, [profileId, refresh]);
  return counts;
}
