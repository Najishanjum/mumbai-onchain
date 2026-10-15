import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

// Web push: this phone's subscription, saved against the signed-in account so
// the send-push Edge Function can reach it. Needs notification permission,
// an installed app on iPhone (iOS 16.4+), and VITE_VAPID_PUBLIC_KEY.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const padded = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** This phone's push subscription, creating one if notifications are allowed. */
export async function ensurePushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported() || Notification.permission !== 'granted') return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY!) as BufferSource,
    });
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
