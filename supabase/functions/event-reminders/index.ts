// event-reminders: "<event> starts in 15 min" pushes for saved events.
//
// POST /functions/v1/event-reminders   (no body, no sign-in)
// Run every 5 minutes by supabase/cron/event-reminders.sql. Each saved event
// is reminded once: rows are marked before sending, so extra or overlapping
// calls send nothing twice. Deploy with --no-verify-jwt.
//
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (same as
// notify-connection). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Reminded once it starts within this window. The cron runs every 5 minutes,
// so most land 15–20 minutes ahead; events saved later still get one.
const AHEAD_MS = 20 * 60 * 1000;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = Date.now();

  // Claim what's due by marking it, so a second run can't pick it up too.
  const { data: due, error } = await db
    .from('saved_events')
    .update({ reminded_at: new Date(now).toISOString() })
    .is('reminded_at', null)
    .gt('starts_at', new Date(now).toISOString())
    .lte('starts_at', new Date(now + AHEAD_MS).toISOString())
    .select('user_id, event_id, title, venue, starts_at');
  if (error) return json(500, { error: error.message });
  if (!due?.length) return json(200, { due: 0, sent: 0 });

  const userIds = [...new Set(due.map((d) => d.user_id as string))];
  const { data: subs } = await db.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth').in('user_id', userIds);
  if (!subs?.length) return json(200, { due: due.length, sent: 0 });

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@mumbaionchain.xyz',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  let sent = 0;
  const gone = new Set<string>();
  await Promise.all(
    due.flatMap((d) => {
      const mins = Math.max(1, Math.round((new Date(d.starts_at).getTime() - now) / 60000));
      const message = JSON.stringify({
        title: `${d.title || 'Your event'} starts in ${mins} min`,
        body: d.venue ? `📍 ${d.venue}` : 'Tap for directions and who’s going.',
        url: `/?event=${encodeURIComponent(d.event_id)}`,
        tag: `soon:${d.event_id}`,
      });
      return subs
        .filter((s) => s.user_id === d.user_id)
        .map(async (s) => {
          try {
            // Useless once the event has started.
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, message, { TTL: mins * 60 });
            sent++;
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            if (code === 404 || code === 410) gone.add(s.id);
          }
        });
    })
  );
  if (gone.size) await db.from('push_subscriptions').delete().in('id', [...gone]);
  return json(200, { due: due.length, sent });
});
