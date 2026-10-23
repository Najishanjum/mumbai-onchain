import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import type { PublicCommunityPartner } from '../types/partner';

export type CommunityRole = 'lead' | 'member';
export type JoinedVia = 'link' | 'picked' | 'email' | 'claim';

export interface Community extends PublicCommunityPartner {
  slug: string;
}

export interface Membership {
  communityId: string;
  role: CommunityRole;
  joinedVia: JoinedVia;
  credited: boolean;
  joinedAt: string;
}

export interface CommunityMember extends Membership {
  profileId: string;
}

export const MAX_COMMUNITIES = 3;

// ── The referral link (?c=slug), kept until the person has a pass ─────────
const REF_KEY = 'moc_community_ref';
const ASKED_KEY = 'moc_community_asked';
const REF_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface CommunityRef {
  slug: string;
  via: 'link' | 'picked';
  at: number;
}

/** The community to join once the pass exists: from a link, or picked while making the pass. */
export function rememberCommunity(slug: string | null, via: 'link' | 'picked') {
  try {
    if (!slug) localStorage.removeItem(REF_KEY);
    else if (/^[a-z0-9-]{1,80}$/.test(slug)) localStorage.setItem(REF_KEY, JSON.stringify({ slug, via, at: Date.now() } satisfies CommunityRef));
  } catch {
    // storage blocked: they can still pick their community later
  }
}

/** Remembers ?c=<slug> from the address, so joining after signup credits the link. */
export function captureCommunityRef() {
  try {
    rememberCommunity(new URLSearchParams(window.location.search).get('c'), 'link');
  } catch {
    // no address to read
  }
}

export function readCommunityRef(): CommunityRef | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const ref = JSON.parse(raw) as CommunityRef;
    return Date.now() - ref.at < REF_TTL_MS ? { ...ref, via: ref.via === 'picked' ? 'picked' : 'link' } : null;
  } catch {
    return null;
  }
}

function clearCommunityRef() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    // nothing to clear
  }
}

export function communityAsked(): boolean {
  try {
    return localStorage.getItem(ASKED_KEY) === '1';
  } catch {
    return true; // can't remember an answer, so don't keep asking
  }
}

export function markCommunityAsked() {
  try {
    localStorage.setItem(ASKED_KEY, '1');
  } catch {
    // fine: the card just shows again next time
  }
}

export const communityLink = (slug: string) => `${window.location.origin}/app?c=${encodeURIComponent(slug)}`;

// ── Shared state: approved communities and this account's memberships ─────
interface State {
  communities: Community[] | null;
  mine: Membership[] | null;
  userId: string | null;
}
let state: State = { communities: null, mine: null, userId: null };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const toMembership = (r: { community_id: string; role: CommunityRole; joined_via: JoinedVia; credited: boolean; joined_at: string }): Membership => ({
  communityId: r.community_id,
  role: r.role,
  joinedVia: r.joined_via,
  credited: r.credited,
  joinedAt: r.joined_at,
});

async function loadCommunities() {
  if (!supabase) return set({ communities: [] });
  const { data, error } = await supabase
    .from('community_partners_public')
    .select('id, community_name, community_logo_url, community_description, website_url, x_url, instagram_url, linkedin_url, telegram_url, discord_url, whatsapp_url, slug, created_at')
    .order('community_name');
  if (!error) set({ communities: (data ?? []) as Community[] });
}

async function loadMine(userId: string | null) {
  if (!supabase || !userId) return set({ mine: userId ? [] : null, userId });
  const { data, error } = await supabase
    .from('community_members')
    .select('community_id, role, joined_via, credited, joined_at')
    .eq('user_id', userId)
    .order('joined_at');
  if (!error) set({ mine: (data ?? []).map(toMembership), userId });
}

// Once per account per session: link communities that applied with this email.
const autoLinked = new Set<string>();

/**
 * Communities for everyone; memberships, joining and claiming for the
 * signed-in account. Pass the profile id once they have a pass.
 */
export function useCommunities(userId: string | null, profileId: string | null) {
  const s = useSyncExternalStore(subscribe, () => state);

  useEffect(() => {
    if (state.communities === null) void loadCommunities();
  }, []);

  useEffect(() => {
    void loadMine(userId);
  }, [userId]);

  // A pass and an account: link by email, then finish a join from a referral link.
  useEffect(() => {
    const client = supabase;
    if (!client || !userId || !profileId) return;
    void (async () => {
      if (!autoLinked.has(userId)) {
        autoLinked.add(userId);
        const { data } = await client.rpc('community_auto_link');
        if (typeof data === 'number' && data > 0) await loadMine(userId);
      }
    })();
  }, [userId, profileId]);

  const join = useCallback(
    async (communityId: string, via: 'link' | 'picked'): Promise<string | null> => {
      if (!supabase || !userId || !profileId) return 'Make your pass first.';
      const { error } = await supabase.from('community_members').insert({ community_id: communityId, user_id: userId, profile_id: profileId, role: 'member', joined_via: via });
      if (error && error.code !== '23505') return error.message.includes('up to 3') ? 'You can be in up to 3 communities. Leave one first.' : 'Couldn’t join. Try again.';
      markCommunityAsked();
      await loadMine(userId);
      return null;
    },
    [userId, profileId]
  );

  const leave = useCallback(
    async (communityId: string) => {
      if (!supabase || !userId) return;
      await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', userId);
      await loadMine(userId);
    },
    [userId]
  );

  const claim = useCallback(
    async (code: string): Promise<{ error: string } | { communityId: string; name: string }> => {
      if (!supabase || !userId) return { error: 'Sign in first.' };
      const { data, error } = await supabase.rpc('claim_community', { p_code: code });
      if (error) return { error: error.message || 'That code doesn’t work.' };
      const row = (Array.isArray(data) ? data[0] : data) as { community_id: string; community_name: string } | undefined;
      await loadMine(userId);
      return row ? { communityId: row.community_id, name: row.community_name } : { error: 'That code doesn’t work.' };
    },
    [userId]
  );

  const communities = s.communities ?? [];
  const mine = s.userId === userId ? s.mine : null;
  return {
    communities,
    loaded: s.communities !== null,
    mine,
    byId: (id: string) => communities.find((c) => c.id === id) ?? null,
    bySlug: (slug: string) => communities.find((c) => c.slug === slug) ?? null,
    join,
    leave,
    claim,
  };
}

/**
 * After signup: if they came through a community's link, join it (credited
 * to the link) once their pass exists. Returns the community it joined.
 */
export function useJoinFromRef(userId: string | null, profileId: string | null) {
  const { mine, bySlug, join, loaded } = useCommunities(userId, profileId);
  const [joined, setJoined] = useState<string | null>(null);
  useEffect(() => {
    const ref = readCommunityRef();
    if (!ref || !loaded || !userId || !profileId || mine === null) return;
    const c = bySlug(ref.slug);
    clearCommunityRef();
    if (!c || mine.some((m) => m.communityId === c.id)) return;
    void join(c.id, ref.via).then((err) => !err && setJoined(c.community_name));
  }, [loaded, userId, profileId, mine, bySlug, join]);
  return joined;
}

/** Everyone in one community, leaders first; null while loading. */
export function useCommunityMembers(communityId: string | null, refreshKey = 0): CommunityMember[] | null {
  const [members, setMembers] = useState<CommunityMember[] | null>(null);
  useEffect(() => {
    const client = supabase;
    if (!client || !communityId) return;
    let live = true;
    setMembers(null);
    client
      .from('community_members')
      .select('community_id, profile_id, role, joined_via, credited, joined_at')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: false })
      .then(({ data }) => {
        if (!live) return;
        const rows = (data ?? []).map((r) => ({ ...toMembership(r), profileId: r.profile_id as string }));
        setMembers(rows.sort((a, b) => Number(b.role === 'lead') - Number(a.role === 'lead')));
      });
    return () => {
      live = false;
    };
  }, [communityId, refreshKey]);
  return members;
}

/** A one-use code that makes whoever enters it a leader. Admins and leaders only. */
export async function createClaimCode(communityId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('community_claims').insert({ community_id: communityId }).select('code').single();
  return error ? null : (data.code as string);
}
