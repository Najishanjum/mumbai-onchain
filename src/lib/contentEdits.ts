import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

// Changes to places and partners wait for an admin's review
// (supabase/migrations/20261106000000_content_edits.sql). The live version
// stays as it is until one is approved.

export type EditTarget = 'place' | 'partner';

export interface ContentEdit {
  id: string;
  target: EditTarget;
  targetId: string;
  changes: Record<string, string | number>;
  proposedBy: string;
  proposerName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

type Row = {
  id: string;
  target: EditTarget;
  target_id: string;
  changes: Record<string, string | number>;
  proposed_by: string;
  proposer_name: string;
  status: ContentEdit['status'];
  created_at: string;
};
const toEdit = (r: Row): ContentEdit => ({
  id: r.id,
  target: r.target,
  targetId: r.target_id,
  changes: r.changes,
  proposedBy: r.proposed_by,
  proposerName: r.proposer_name,
  status: r.status,
  createdAt: r.created_at,
});

/** Only the fields that differ from what's live, trimmed. Empty when nothing changed. */
export function diff<T extends Record<string, unknown>>(before: T, after: Partial<Record<keyof T, string | number>>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(after)) {
    const next = typeof v === 'string' ? v.trim() : v;
    const prev = before[k] ?? '';
    if (next === undefined || String(next) === String(prev).trim()) continue;
    out[k] = next as string | number;
  }
  return out;
}

export async function proposeEdit(target: EditTarget, targetId: string, changes: Record<string, string | number>): Promise<string | null> {
  if (!supabase) return 'Not connected.';
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return 'Sign in first.';
  const { data: row, error } = await supabase.from('content_edits').insert({ target, target_id: targetId, changes, proposed_by: user.id }).select('id').single();
  if (error || !row) return 'Couldn’t send it for review. Try again.';
  // A partner's change (often from its lead): the admins get a push to review it.
  if (target === 'partner') void supabase.functions.invoke('notify-connection', { body: { editId: row.id } });
  return null;
}

export async function reviewEdit(id: string, approve: boolean, note = ''): Promise<string | null> {
  if (!supabase) return 'Not connected.';
  const { error } = await supabase.rpc('review_content_edit', { p_id: id, p_approve: approve, p_note: note });
  if (!error) return null;
  return /already answered/i.test(error.message) ? 'Someone already answered this one.' : 'Couldn’t save that. Check the change is valid and try again.';
}

/** Changes waiting for review: all of one kind (admins), or one item's (its lead). */
export function useWaitingEdits(target: EditTarget, targetId?: string) {
  const [items, setItems] = useState<ContentEdit[] | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let live = true;
    let q = supabase.from('content_edits').select('id, target, target_id, changes, proposed_by, proposer_name, status, created_at').eq('target', target).eq('status', 'pending').order('created_at');
    if (targetId) q = q.eq('target_id', targetId);
    q.then(({ data, error }) => live && setItems(error ? [] : ((data ?? []) as Row[]).map(toEdit)));
    return () => {
      live = false;
    };
  }, [target, targetId, nonce]);
  return { items, reload: useCallback(() => setNonce((n) => n + 1), []) };
}

/** What the Google Maps app on iPhone shares: opened by the server (resolveMapLink). */
export const isShortMapLink = (text: string) => /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(text.trim());

/** The pin behind a short Google Maps link, found by the event-import function (admins only). */
export async function resolveMapLink(link: string): Promise<{ lat: number; lng: number } | { error: string }> {
  if (!supabase) return { error: 'Not connected.' };
  const { data, error } = await supabase.functions.invoke('event-import', { body: { mapLink: link.trim() } });
  if (error || !data) return { error: 'Couldn’t open that link. Paste the coordinates instead.' };
  return data as { lat: number; lng: number } | { error: string };
}

/**
 * A location from what people paste: a Google Maps link (the place's own pin
 * if it has one, else the map's centre) or plain "lat, lng". Short
 * maps.app.goo.gl links go through resolveMapLink first.
 */
export function parseLocation(text: string): { lat: number; lng: number } | { error: string } {
  let t = text.trim();
  try {
    t = decodeURIComponent(t);
  } catch {
    // stray % signs: read it as it is
  }
  if (isShortMapLink(t)) return { error: 'Reading the short link…' };
  const tries = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/];
  for (const re of tries) {
    const m = t.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (lat < 18.8 || lat > 19.4 || lng < 72.7 || lng > 73.2) return { error: 'That spot isn’t in Mumbai. Check the link or coordinates.' };
    return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
  }
  return { error: 'Paste a Google Maps link or coordinates like 18.9227, 72.8317.' };
}
