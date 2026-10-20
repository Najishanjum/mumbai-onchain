import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

// Web push: this phone's subscription, saved against the signed-in account so
// the send-push Edge Function can reach it. Needs notification permission,
// an installed app on iPhone (iOS 16.4+), and the VAPID public key below.

// Public by design (it's in every subscription), so it lives here rather than
// in the hosting env. Its private half is the VAPID_PRIVATE_KEY Supabase
// secret; change both together.
const VAPID_PUBLIC_KEY = 'BFwJYm2mntCZFm6WNepcBY8pvi7L8BPYNLaEi1KGtDuO0xJCcnWczZ-InnYAjI68ftbH-9ZMJ8NROrp0P9vacRU';

// A subscription made with an older key, replaced this session; its saved row
// is deleted on the next save, since sending to it can only fail.
let staleEndpoint: string | null = null;

function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const padded = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function sameKey(a: ArrayBuffer | null, b: Uint8Array): boolean {
  if (!a || a.byteLength !== b.length) return false;
  const bytes = new Uint8Array(a);
  return bytes.every((v, i) => v === b[i]);
}

// Why the last connect failed, in words someone can screenshot (Me → Notifications).
let lastPushError: string | null = null;

const describe = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));

/** This phone's push subscription, creating one if notifications are allowed. */
export async function ensurePushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported() || Notification.permission !== 'granted') return null;
  try {
    // ready never settles when the service worker didn't install; don't wait forever.
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The app’s service worker isn’t running')), 10000)),
    ]);
    const key = base64UrlToBytes(VAPID_PUBLIC_KEY);
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      if (sameKey(existing.options.applicationServerKey, key)) return existing;
      // Made with an older key: swap it quietly, permission stays granted.
      staleEndpoint = existing.endpoint;
      await existing.unsubscribe();
    }
    return await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key as BufferSource });
  } catch (e) {
    lastPushError = `Couldn’t connect this phone (${describe(e)})`;
    return null;
  }
}

/** Save (or refresh) this phone's subscription for the signed-in user. */
export async function savePushSubscription(userId: string): Promise<boolean> {
  lastPushError = null;
  if (!isSupabaseConfigured() || !supabase) {
    lastPushError = 'The app isn’t connected to its database';
    return false;
  }
  const sub = await ensurePushSubscription();
  if (!sub) return false;
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    lastPushError = 'This browser gave an incomplete push address';
    return false;
  }
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 200),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
  if (error) lastPushError = `Couldn’t save this phone (${error.code ?? ''} ${error.message})`;
  if (!error && staleEndpoint) {
    const { error: cleanup } = await supabase.from('push_subscriptions').delete().eq('endpoint', staleEndpoint);
    if (!cleanup) staleEndpoint = null;
  }
  return !error;
}

/**
 * Keeps the subscription saved while signed in: after sign-in, after
 * notifications are allowed, and on each launch (phones can rotate it).
 */
export function usePushSync(userId: string | null | undefined, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !userId || !pushSupported()) return;
    const sync = () => {
      if (Notification.permission === 'granted') void savePushSubscription(userId);
    };
    sync();
    // The prompt fires this once permission is granted mid-session.
    window.addEventListener('mo:notifications-granted', sync);
    return () => window.removeEventListener('mo:notifications-granted', sync);
  }, [userId, enabled]);
}

export type PushStatus = 'checking' | 'on' | 'off' | 'blocked' | 'unsupported' | 'signed-out' | 'error';

/**
 * This phone's notification status for Me → Notifications, with a way to turn
 * them on (the first-launch prompt only asks once) and to retry. On error,
 * `error` says which step failed.
 */
export function usePushStatus(userId: string | null | undefined) {
  const [state, setState] = useState<{ status: PushStatus; error: string }>({ status: 'checking', error: '' });

  const check = useCallback(async () => {
    if (!pushSupported()) return setState({ status: 'unsupported', error: '' });
    if (Notification.permission === 'denied') return setState({ status: 'blocked', error: '' });
    if (Notification.permission === 'default') return setState({ status: 'off', error: '' });
    if (!userId) return setState({ status: 'signed-out', error: '' });
    setState({ status: 'checking', error: '' });
    const ok = await savePushSubscription(userId);
    setState(ok ? { status: 'on', error: '' } : { status: 'error', error: lastPushError ?? 'Unknown error' });
  }, [userId]);

  useEffect(() => {
    void check();
  }, [check]);

  const turnOn = useCallback(async () => {
    try {
      // Must start inside the tap, or iPhone ignores it.
      await Notification.requestPermission();
    } catch {
      // older browsers: check() reports what's left
    }
    await check();
  }, [check]);

  return { ...state, turnOn, retry: check };
}
