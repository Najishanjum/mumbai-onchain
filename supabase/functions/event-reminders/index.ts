// event-reminders: "<event> starts in 15 min" pushes for saved events, and
// "<community> reached Rising" pushes to a community's leads when it levels up.
//
// POST /functions/v1/event-reminders   (no body, no sign-in)
// Run every 5 minutes by supabase/cron/event-reminders.sql. Each saved event
// is reminded once: rows are marked before sending, so extra or overlapping
// calls send nothing twice. Deploy with --no-verify-jwt.
//
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (same as
// notify-connection). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided.

import webpush from 'npm:web-push@3.6.7';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { pushTo } from '../_shared/push.ts';

// Reminded once it starts within this window. The cron runs every 5 minutes,
// so most land 15–20 minutes ahead; events saved later still get one.
const AHEAD_MS = 20 * 60 * 1000;

// What each level unlocks, for the push (levels: supabase/migrations/20261103000000_community_levels.sql).
const LEVELS: Record<number, { name: string; unlock: string }> = {
  1: { name: 'Rising', unlock: 'You can now post stories as your community.' },
  2: { name: 'Featured', unlock: 'You’re in Featured communities on Today, and get 3 messages a day.' },
  3: { name: 'Champion', unlock: 'You’re pinned on the Partners page, and can message everyone once without approval.' },
};

/** Tells each community's leads when it reaches a new level. Each level is announced once. */
async function announceLevelUps(db: SupabaseClient): Promise<number> {
  const { data: ups } = await db.rpc('claim_level_ups');
  let sent = 0;
  for (const up of (ups ?? []) as { community_id: string; community_name: string; level: number }[]) {
    const level = LEVELS[up.level];
    if (!level) continue;
    const { data: leads } = await db.from('community_members').select('user_id').eq('community_id', up.community_id).eq('role', 'lead');
    sent += await pushTo(db, (leads ?? []).map((l) => l.user_id as string), {
      title: `${up.community_name} reached ${level.name} 🎉`,
      body: level.unlock,
      url: `/?community=${up.community_id}`,
      tag: `level:${up.community_id}:${up.level}`,
    });
  }
  return sent;
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = Date.now();
  // Level-ups first, so a quiet minute for reminders still sends them.
  await announceLevelUps(db).catch(() => 0);

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
