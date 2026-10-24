// Web push to accounts (or everyone), for functions that send to people.
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.

import webpush from 'npm:web-push@3.6.7';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface PushMessage {
  title: string;
  body: string;
  url: string;
  tag: string;
}

/** Sends to these accounts' phones, or every phone when userIds is null. Returns how many got it. */
export async function pushTo(db: SupabaseClient, userIds: string[] | null, message: PushMessage, ttlSeconds = 60 * 60 * 12): Promise<number> {
  if (userIds && !userIds.length) return 0;
  let query = db.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  if (userIds) query = query.in('user_id', userIds);
  const { data: subs } = await query;
  if (!subs?.length) return 0;

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@mumbaionchain.xyz',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );
  const payload = JSON.stringify(message);
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: ttlSeconds });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id);
      }
    })
  );
  if (gone.length) await db.from('push_subscriptions').delete().in('id', gone);
  return sent;
}
