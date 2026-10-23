import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import type { EventItem } from '../types/event';
import { getEventEndDateTime, getEventStartDateTime } from './date';

export interface CheckIn {
  userId: string;
  profileId: string;
  eventId: string;
  checkedInAt: string;
  expiresAt: string;
}

const MAX_MS = 8 * 60 * 60 * 1000; // a check-in never outlasts a long day
const EARLY_MS = 60 * 60 * 1000; // doors open before the listed start
const REFRESH_MS = 60 * 1000;

// One shared list for every screen, refreshed while anything is watching.
let checkIns: CheckIn[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function refresh() {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('check_ins')
    .select('user_id, profile_id, event_id, checked_in_at, expires_at')
    .gt('expires_at', new Date().toISOString())
    .order('checked_in_at', { ascending: false });
  if (error) return;
  checkIns = (data ?? []).map((r) => ({
    userId: r.user_id,
    profileId: r.profile_id,
    eventId: r.event_id,
    checkedInAt: r.checked_in_at,
    expiresAt: r.expires_at,
  }));
  emit();
}

let timer: number | undefined;
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refresh();
    timer = window.setInterval(() => void refresh(), REFRESH_MS);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.clearInterval(timer);
  };
}

/** Whether "I'm here" makes sense now: from an hour before the start until the end. */
export function canCheckIn(e: EventItem, now = new Date()): boolean {
  const start = getEventStartDateTime(e);
  const end = getEventEndDateTime(e);
  return Boolean(start && end && now.getTime() >= start.getTime() - EARLY_MS && now <= end);
}

/** Everyone checked in right now, plus actions for this account. */
export function useCheckIns(userId: string | null) {
  const list = useSyncExternalStore(subscribe, () => checkIns);
  // Signing in or out changes what the database lets us read.
  useEffect(() => {
    void refresh();
  }, [userId]);

  const mine = userId ? list.find((c) => c.userId === userId && new Date(c.expiresAt) > new Date()) ?? null : null;

  async function checkIn(e: EventItem, profileId: string) {
    if (!supabase || !userId) return 'Sign in to check in.';
    const end = getEventEndDateTime(e)?.getTime() ?? Date.now() + MAX_MS;
    const expiresAt = new Date(Math.min(end, Date.now() + MAX_MS)).toISOString();
    const { error } = await supabase.from('check_ins').upsert({
      user_id: userId,
      profile_id: profileId,
      event_id: e.id,
      event_title: e.title.slice(0, 200),
      checked_in_at: new Date().toISOString(),
      expires_at: expiresAt,
    });
    if (error) return 'Couldn’t check you in. Try again.';
    await refresh();
    // Best effort: tell people you've added (or who added you) who are here too.
    supabase.functions.invoke('notify-connection', { body: { checkIn: true } }).catch(() => undefined);
    return null;
  }

  async function leave() {
    if (!supabase || !userId) return;
    await supabase.from('check_ins').delete().eq('user_id', userId);
    await refresh();
  }

  return {
    mine,
    hereAt: (eventId: string) => list.filter((c) => c.eventId === eventId),
    checkIn,
    leave,
  };
}
