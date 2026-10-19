import { useEffect } from 'react';
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

/** This phone's push subscription, creating one if notifications are allowed. */
export async function ensurePushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported() || Notification.permission !== 'granted') return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const key = base64UrlToBytes(VAPID_PUBLIC_KEY);
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      if (sameKey(existing.options.applicationServerKey, key)) return existing;
      // Made with an older key: swap it quietly, permission stays granted.
      staleEndpoint = existing.endpoint;
      await existing.unsubscribe();
    }
    return await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key as BufferSource });
  } catch {
    return null;
  }
}

/** Save (or refresh) this phone's subscription for the signed-in user. */
export async function savePushSubscription(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const sub = await ensurePushSubscription();
  if (!sub) return false;
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
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
