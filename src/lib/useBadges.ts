import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase';

export type Badge = 'team' | 'lead';

// Who wears a ring: the Mumbai Onchain team, and leads of partner
// communities (with which ones). Loaded once and shared by every avatar.
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

/** The ring a person gets (team wins over lead), and the communities they lead. */
export function useBadge(profileId: string | undefined): { badge: Badge | null; leads: string[] } {
  const s = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    void load();
  }, []);
  if (!profileId) return { badge: null, leads: [] };
  const leads = s.leads.get(profileId) ?? [];
  return { badge: s.team.has(profileId) ? 'team' : leads.length ? 'lead' : null, leads };
}

/** Ring colours: gold for the team, the app's saffron-to-pink for community leads. */
export const BADGE_RING: Record<Badge, string> = {
  team: 'linear-gradient(135deg, #F7D774, #E0A43A 55%, #B9781E)',
  lead: 'linear-gradient(135deg, #FF8A3D, #FF5FA8)',
};
