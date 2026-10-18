// notify-connection: tells someone "<name> added you" with a web push.
//
// POST /functions/v1/notify-connection
//   headers: Authorization: Bearer <the signed-in user's access token>
//   body:    { "toProfileId": "<profile id>" }
// Called by the app right after it saves an add. It only sends when the caller
// really made that add in the last few minutes, so it can't be used to spam.
//
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (same as
// send-push). SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
// are provided by Supabase.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

const FRESH_MS = 5 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: who } = await asCaller.auth.getUser();
  if (!who.user) return json(401, { error: 'Sign in first' });

  let toProfileId = '';
  try {
    toProfileId = String((await req.json()).toProfileId ?? '');
  } catch {
    return json(400, { error: 'Body must be JSON' });
  }
  if (!toProfileId) return json(400, { error: 'toProfileId is required' });

  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // The caller's profile, and their add to that person, made just now.
  const { data: me } = await db.from('profiles').select('id, name').eq('owner_id', who.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!me) return json(400, { error: 'No profile' });
  const { data: add } = await db
    .from('connections')
    .select('created_at')
    .eq('from_profile_id', me.id)
    .eq('to_profile_id', toProfileId)
    .maybeSingle();
  if (!add || Date.now() - new Date(add.created_at).getTime() > FRESH_MS) return json(200, { sent: 0, reason: 'no recent add' });

  // Their account (website-only profiles have none, so nobody to notify).
  const { data: target } = await db.from('profiles').select('owner_id').eq('id', toProfileId).maybeSingle();
  if (!target?.owner_id) return json(200, { sent: 0, reason: 'no account' });

  const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', target.owner_id);
  if (!subs?.length) return json(200, { sent: 0, reason: 'notifications off' });

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@mumbaionchain.xyz',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );
  const message = JSON.stringify({
    title: `${me.name} added you`,
    body: 'Tap to see their profile and add them back.',
    url: `/?tab=people&person=${encodeURIComponent(me.id)}`,
    tag: `added:${me.id}`,
  });

  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, message, { TTL: 60 * 60 * 12 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id);
      }
    })
  );
  if (gone.length) await db.from('push_subscriptions').delete().in('id', gone);
  return json(200, { sent });
});
