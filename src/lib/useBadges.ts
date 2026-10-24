import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase';

export type Badge = 'team' | 'lead';

// The line under a name on a profile: the Mumbai Onchain team, and leads of
// partner communities (with which ones). Loaded once and shared.
interface State {
  team: Set<string>;
  leads: Map<string, string[]>; // profile id → community ids
}
let state: State = { team: new Set(), leads: new Map() };
let loading = false;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

async function load() {
  const client = supabase;
  if (loading || !client) return;
  loading = true;
  const [team, leads] = await Promise.all([
    client.rpc('team_profile_ids'),
    client.from('community_members').select('profile_id, community_id').eq('role', 'lead'),
  ]);
  const leadMap = new Map<string, string[]>();
  for (const r of leads.data ?? []) leadMap.set(r.profile_id, [...(leadMap.get(r.profile_id) ?? []), r.community_id]);
  state = { team: new Set(((team.data ?? []) as unknown[]).map((v) => (typeof v === 'string' ? v : String(Object.values(v as object)[0])))), leads: leadMap };
  listeners.forEach((l) => l());
}

/** Team or community lead (team wins), and the communities they lead. */
export function useBadge(profileId: string | undefined): { badge: Badge | null; leads: string[] } {
  const s = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    void load();
  }, []);
  if (!profileId) return { badge: null, leads: [] };
  const leads = s.leads.get(profileId) ?? [];
  return { badge: s.team.has(profileId) ? 'team' : leads.length ? 'lead' : null, leads };
}
