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
  /** Was within 500 m of the venue when checking in. */
  verified: boolean;
}

const MAX_MS = 8 * 60 * 60 * 1000; // a check-in never outlasts a long day
const EARLY_MS = 60 * 60 * 1000; // doors open before the listed start
const REFRESH_MS = 60 * 1000;

// One shared list for every screen, refreshed while anything is watching.
let checkIns: CheckIn[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Reads overlap (the minute timer, checking in, signing in): only the newest
// one's answer counts, or a read from before you checked in could arrive
// last and wipe your check-in off the screen.
let latestRead = 0;

async function refresh() {
  if (!supabase) return;
  const read = ++latestRead;
  const { data, error } = await supabase
    .from('check_ins')
    .select('user_id, profile_id, event_id, checked_in_at, expires_at, verified')
    .gt('expires_at', new Date().toISOString())
    .order('checked_in_at', { ascending: false });
  if (error || read !== latestRead) return;
  checkIns = (data ?? []).map((r) => ({
    userId: r.user_id,
    profileId: r.profile_id,
    eventId: r.event_id,
    checkedInAt: r.checked_in_at,
    expiresAt: r.expires_at,
    verified: Boolean(r.verified),
  }));
  emit();
}

let timer: number | undefined;
// Back in the app after a while: fresh check-ins, not the ones from before.
const onVisible = () => document.visibilityState === 'visible' && void refresh();
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refresh();
    timer = window.setInterval(() => void refresh(), REFRESH_MS);
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

const NEAR_M = 500;

/** Metres between two points on Earth. */
function metres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

/** The event has a map pin, so a check-in there can be verified. */
export const canVerify = (e: EventItem) => e.latitude != null && e.longitude != null;

/**
 * One location reading, compared with the venue's pin: within 500 m (allowing
 * for the reading's own error, indoor GPS drifts) counts as there. Stays on
 * the phone; only the yes/no is saved. No permission or no fix: 'unknown'.
 */
export function isNearVenue(e: EventItem): Promise<'near' | 'far' | 'unknown'> {
  if (!canVerify(e) || !('geolocation' in navigator)) return Promise.resolve('unknown');
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = metres(pos.coords.latitude, pos.coords.longitude, e.latitude!, e.longitude!);
        resolve(d <= NEAR_M + Math.min(pos.coords.accuracy ?? 0, 300) ? 'near' : 'far');
      },
      () => resolve('unknown'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  });
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

  async function checkIn(e: EventItem, profileId: string, verified = false) {
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
      verified,
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
