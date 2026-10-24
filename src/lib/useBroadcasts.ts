import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

// Messages from communities (and the team) to people: broadcasts in the
// database, sent through the community-message function.

export interface Broadcast {
  id: string;
  communityId: string | null;
  senderProfileId: string | null;
  title: string;
  body: string;
  audience: 'members' | 'everyone' | 'leads';
  status: 'sent' | 'pending' | 'rejected';
  reviewNote: string;
  recipients: number;
  createdAt: string;
  sentAt: string | null;
}

export const DAILY_LIMIT = 2;
// Anything that looks like a link (same as LINK in the community-message function).
export const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|xyz|io|me|ly|gg|org|net|app|site|co|in|link|to|fi|money|finance|so|ai|dev|tech|club|lol)\b|t\.me\/|wa\.me\/)/i;

const COLUMNS = 'id, community_id, sender_profile_id, title, body, audience, status, review_note, recipients, created_at, sent_at';

type Row = {
  id: string;
  community_id: string | null;
  sender_profile_id: string | null;
  title: string;
  body: string;
  audience: Broadcast['audience'];
  status: Broadcast['status'];
  review_note: string;
  recipients: number;
  created_at: string;
  sent_at: string | null;
};
const toBroadcast = (r: Row): Broadcast => ({
  id: r.id,
  communityId: r.community_id,
  senderProfileId: r.sender_profile_id,
  title: r.title,
  body: r.body,
  audience: r.audience,
  status: r.status,
  reviewNote: r.review_note,
  recipients: r.recipients,
  createdAt: r.created_at,
  sentAt: r.sent_at,
});

/**
 * Messages: one community's (its leads also see waiting and declined ones),
 * or with communityId 'all' everything this account can see (the admins'
 * history). Null while loading; reload after sending.
 */
export function useBroadcasts(communityId: string | null | 'all', limit = 30) {
  const [items, setItems] = useState<Broadcast[] | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    const client = supabase;
    if (!client || !communityId) return;
    let live = true;
    let q = client.from('broadcasts').select(COLUMNS).order('created_at', { ascending: false }).limit(limit);
    if (communityId !== 'all') q = q.eq('community_id', communityId);
    q.then(({ data }) => live && setItems(((data ?? []) as Row[]).map(toBroadcast)));
    return () => {
      live = false;
    };
  }, [communityId, limit, nonce]);
  return { items, reload: useCallback(() => setNonce((n) => n + 1), []) };
}

/**
 * Messages that reached this account in the last week, for the bell: from
 * its communities (not muted ones), and the team's notes to community leads.
 */
export function useMyMessages(userId: string | null, mutedIds: string[]) {
  const [items, setItems] = useState<Broadcast[]>([]);
  const muted = mutedIds.join(',');
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return setItems([]);
    let live = true;
    client
      .from('broadcasts')
      .select(COLUMNS)
      .eq('status', 'sent')
      .or('community_id.not.is.null,audience.eq.leads')
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!live) return;
        const skip = new Set(muted.split(',').filter(Boolean));
        setItems(((data ?? []) as Row[]).map(toBroadcast).filter((b) => !b.communityId || !skip.has(b.communityId)));
      });
    return () => {
      live = false;
    };
  }, [userId, muted]);
  return items;
}

export type SendResult = { error: string } | { status: 'sent'; recipients: number; members: number } | { status: 'pending' };

export async function sendCommunityMessage(communityId: string, title: string, body: string, audience: 'members' | 'everyone'): Promise<SendResult> {
  if (!supabase) return { error: 'Not connected.' };
  const { data, error } = await supabase.functions.invoke('community-message', { body: { send: { communityId, title, body, audience } } });
  if (error || !data) return { error: 'Couldn’t send. Check your connection and try again.' };
  return data as SendResult;
}

export async function reviewMessage(id: string, decision: 'approve' | 'reject', note = ''): Promise<{ error: string } | { status: string; recipients: number }> {
  if (!supabase) return { error: 'Not connected.' };
  const { data, error } = await supabase.functions.invoke('community-message', { body: { review: { id, decision, note } } });
  if (error || !data) return { error: 'Couldn’t reach the server. Try again.' };
  return data;
}

export async function setMuted(communityId: string, muted: boolean): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc('set_community_muted', { p_community_id: communityId, p_muted: muted });
  return !error;
}

// ── The team's announcements to leads, and "Got it" ───────────────────────
// One list for the bell and lead mode, so tapping Got it in one clears both.
let unseenLeadNotes: Broadcast[] = [];
let unseenFor: string | null = null;
const unseenListeners = new Set<() => void>();
const emitUnseen = () => unseenListeners.forEach((l) => l());

async function loadUnseen(userId: string) {
  if (!supabase) return;
  const [{ data: notes }, { data: reads }] = await Promise.all([
    supabase
      .from('broadcasts')
      .select(COLUMNS)
      .eq('audience', 'leads')
      .eq('status', 'sent')
      .gte('sent_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false }),
    supabase.from('broadcast_reads').select('broadcast_id').eq('user_id', userId),
  ]);
  const read = new Set((reads ?? []).map((r) => r.broadcast_id as string));
  unseenLeadNotes = ((notes ?? []) as Row[]).map(toBroadcast).filter((b) => !read.has(b.id));
  unseenFor = userId;
  emitUnseen();
}

/** The team's announcements this lead hasn't marked "Got it" yet (empty for everyone else). */
export function useLeadAnnouncements(userId: string | null, isLead: boolean) {
  const [, rerender] = useState(0);
  useEffect(() => {
    const l = () => rerender((n) => n + 1);
    unseenListeners.add(l);
    return () => {
      unseenListeners.delete(l);
    };
  }, []);
  useEffect(() => {
    if (userId && isLead) void loadUnseen(userId);
  }, [userId, isLead]);
  const gotIt = useCallback(
    async (id: string) => {
      if (!supabase || !userId) return;
      unseenLeadNotes = unseenLeadNotes.filter((b) => b.id !== id);
      emitUnseen();
      await supabase.from('broadcast_reads').upsert({ broadcast_id: id, user_id: userId });
    },
    [userId]
  );
  return { unseen: userId && isLead && unseenFor === userId ? unseenLeadNotes : [], gotIt };
}

/** For admins: who has marked each announcement to leads seen. */
export function useAnnouncementReads(ids: string[]) {
  const [reads, setReads] = useState<Record<string, Set<string>>>({});
  const key = ids.join(',');
  useEffect(() => {
    const client = supabase;
    if (!client || !key) return;
    let live = true;
    client
      .from('broadcast_reads')
      .select('broadcast_id, user_id')
      .in('broadcast_id', key.split(','))
      .then(({ data }) => {
        if (!live) return;
        const next: Record<string, Set<string>> = {};
        for (const r of data ?? []) (next[r.broadcast_id] ??= new Set()).add(r.user_id);
        setReads(next);
      });
    return () => {
      live = false;
    };
  }, [key]);
  return reads;
}

/** The same message for the leads' WhatsApp group: bold title, then the text. */
export const whatsAppText = (b: Pick<Broadcast, 'title' | 'body'>) => `*${b.title.trim()}*${b.body.trim() ? `\n\n${b.body.trim()}` : ''}`;

/** "now", "5m", "2h", "3d". */
export function shortAgo(iso: string | null): string {
  if (!iso) return '';
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}
