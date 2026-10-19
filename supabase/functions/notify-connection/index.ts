// notify-connection: web pushes for people, "<name> added you",
// "<name> replied to your story", and the place review loop.
//
// POST /functions/v1/notify-connection
//   headers: Authorization: Bearer <the signed-in user's access token>
//   body:    { "toProfileId": "<profile id>" }      after an add
//        or  { "replyId": "<story reply id>" }      after a story reply
//        or  { "placeId": "<community place id>" }  after adding a place: tells the admins
//        or  { "approvedPlaceId": "<id>" }          an admin approved it: tells whoever added it
// Called by the app right after it saves the change. It only sends when the
// caller really made it in the last few minutes, so it can't be used to spam.
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
const isFresh = (at: string | null) => Boolean(at) && Date.now() - new Date(at!).getTime() <= FRESH_MS;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: who } = await asCaller.auth.getUser();
  if (!who.user) return json(401, { error: 'Sign in first' });

  let toProfileId = '';
  let replyId = '';
  let placeId = '';
  let approvedPlaceId = '';
  try {
    const body = await req.json();
    toProfileId = String(body.toProfileId ?? '');
    replyId = String(body.replyId ?? '');
    placeId = String(body.placeId ?? '');
    approvedPlaceId = String(body.approvedPlaceId ?? '');
  } catch {
    return json(400, { error: 'Body must be JSON' });
  }
  if (!toProfileId && !replyId && !placeId && !approvedPlaceId) {
    return json(400, { error: 'toProfileId, replyId, placeId or approvedPlaceId is required' });
  }

  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // The caller's profile.
  const { data: me } = await db.from('profiles').select('id, name').eq('owner_id', who.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

  // Who to tell, and what.
  let targetUserIds: string[] = [];
  let message = '';
  if (approvedPlaceId) {
    // An admin approved it just now: tell the person who added it.
    const { data: isAdmin } = await asCaller.rpc('is_admin');
    if (isAdmin !== true) return json(403, { error: 'Admins only' });
    const { data: place } = await db.from('community_places').select('name, owner_id, status, reviewed_at').eq('id', approvedPlaceId).maybeSingle();
    if (!place || place.status !== 'live' || !isFresh(place.reviewed_at)) return json(200, { sent: 0, reason: 'not just approved' });
    targetUserIds = [place.owner_id];
    message = JSON.stringify({
      title: 'Your place is on the map 📍',
      body: `${place.name} was approved. Everyone can see it now.`,
      url: '/?open=map',
      tag: `place-live:${approvedPlaceId}`,
    });
  } else if (placeId) {
    // They added a place just now: tell the admins it's waiting.
    const { data: place } = await db.from('community_places').select('name, area, owner_id, status, created_at').eq('id', placeId).maybeSingle();
    if (!place || place.owner_id !== who.user.id || place.status !== 'pending' || !isFresh(place.created_at)) {
      return json(200, { sent: 0, reason: 'no recent place' });
    }
    const { data: admins } = await db.from('app_admins').select('user_id');
    targetUserIds = (admins ?? []).map((a) => a.user_id);
    message = JSON.stringify({
      title: 'New place to review',
      body: `${place.name}${place.area ? ` · ${place.area}` : ''}, added by ${me?.name ?? 'someone'}`,
      url: '/?admin=places',
      tag: 'places-review',
    });
  } else if (replyId) {
    if (!me) return json(400, { error: 'No profile' });
    // Their reply, made just now, and the account behind the snap.
    const { data: reply } = await db.from('story_replies').select('owner_id, from_profile_id, body, created_at, snap_id').eq('id', replyId).maybeSingle();
    if (!reply || reply.owner_id !== who.user.id || !isFresh(reply.created_at)) return json(200, { sent: 0, reason: 'no recent reply' });
    const { data: snap } = await db.from('snaps').select('owner_id').eq('id', reply.snap_id).maybeSingle();
    targetUserIds = snap?.owner_id ? [snap.owner_id] : [];
    const text = reply.body.length > 140 ? `${reply.body.slice(0, 139)}…` : reply.body;
    message = JSON.stringify({
      title: `${me.name} replied to your story`,
      body: text,
      url: `/?tab=people&person=${encodeURIComponent(reply.from_profile_id)}`,
      tag: `reply:${replyId}`,
    });
  } else {
    if (!me) return json(400, { error: 'No profile' });
    // Their add to that person, made just now.
    const { data: add } = await db
      .from('connections')
      .select('created_at')
      .eq('from_profile_id', me.id)
      .eq('to_profile_id', toProfileId)
      .maybeSingle();
    if (!add || !isFresh(add.created_at)) return json(200, { sent: 0, reason: 'no recent add' });
    // Their account (website-only profiles have none, so nobody to notify).
    const { data: target } = await db.from('profiles').select('owner_id').eq('id', toProfileId).maybeSingle();
    targetUserIds = target?.owner_id ? [target.owner_id] : [];
    message = JSON.stringify({
      title: `${me.name} added you`,
      body: 'Tap to see their profile and add them back.',
      url: `/?tab=people&person=${encodeURIComponent(me.id)}`,
      tag: `added:${me.id}`,
    });
  }
  // Never notify yourself (an admin adding a place, approving their own).
  targetUserIds = targetUserIds.filter((id) => id && id !== who.user.id);
  if (!targetUserIds.length) return json(200, { sent: 0, reason: 'no account' });

  const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').in('user_id', targetUserIds);
  if (!subs?.length) return json(200, { sent: 0, reason: 'notifications off' });

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@mumbaionchain.xyz',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

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
