// send-push: delivers a web push notification to app users.
//
// POST /functions/v1/send-push
//   headers: x-push-secret: <PUSH_ADMIN_SECRET>
//   body:    { "title": "...", "body": "...", "url": "/?tab=schedule",
//              "tag": "optional-group", "userIds": ["<auth user id>", ...] }
// Without userIds it goes to everyone who allowed notifications.
//
// Secrets (supabase secrets set ...): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (mailto: or https: contact), PUSH_ADMIN_SECRET.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-push-secret, authorization, apikey',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  const secret = Deno.env.get('PUSH_ADMIN_SECRET');
  if (!secret || req.headers.get('x-push-secret') !== secret) return json(401, { error: 'Not allowed' });

  let payload: { title?: string; body?: string; url?: string; tag?: string; userIds?: string[] };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Body must be JSON' });
  }
  if (!payload.title) return json(400, { error: 'title is required' });

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@mumbaionchain.xyz',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let query = db.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  if (payload.userIds?.length) query = query.in('user_id', payload.userIds);
  const { data: subs, error } = await query;
  if (error) return json(500, { error: error.message });

  const message = JSON.stringify({ title: payload.title, body: payload.body ?? '', url: payload.url ?? '/', tag: payload.tag });
  let sent = 0;
  const gone: string[] = [];

  // A few hundred at a time keeps the function well inside its time limit.
  const BATCH = 200;
  for (let i = 0; i < (subs ?? []).length; i += BATCH) {
    const batch = subs!.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, message, { TTL: 60 * 60 * 12 });
          sent++;
        } catch (e) {
          // 404/410: the app was removed or permission revoked. Forget the device.
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) gone.push(s.id);
        }
      })
    );
  }
  if (gone.length) await db.from('push_subscriptions').delete().in('id', gone);

  return json(200, { sent, removed: gone.length, total: subs?.length ?? 0 });
});
