// notify-connection: web pushes for people, "<name> added you",
// "<name> replied to your story", the place and partner review loops, and
// telling the admin team what each other did.
//
// POST /functions/v1/notify-connection
//   headers: Authorization: Bearer <the signed-in user's access token>
//   body:    { "toProfileId": "<profile id>" }      after an add
//        or  { "replyId": "<story reply id>" }      after a story reply
//        or  { "placeId": "<community place id>" }  after adding a place: tells the admins
//        or  { "approvedPlaceId": "<id>" }          an admin approved it: tells whoever added it
//        or  { "partnerApplicationId": "<id>" }     a community applied (no sign-in needed): tells the admins
//        or  { "adminEvent": { "kind", "detail" } } an admin did something: tells the other admins
//        or  { "editId": "<content edit id>" }      a lead suggested a change to their community: tells the admins
// Called by the app right after it saves the change. It only sends when the
// caller really made it in the last few minutes, so it can't be used to spam.
//
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (same as
// send-push). SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
// are provided by Supabase.

import webpush from 'npm:web-push@3.6.7';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

const FRESH_MS = 5 * 60 * 1000;
const isFresh = (at: string | null) => Boolean(at) && Date.now() - new Date(at!).getTime() <= FRESH_MS;

// What admins tell each other: "<name> <what>", with the item as the body.
const ADMIN_EVENTS: Record<string, { what: string; tab: string }> = {
  place_approved: { what: 'approved a place', tab: 'places' },
  place_rejected: { what: 'rejected a place', tab: 'places' },
  place_hidden: { what: 'hid a place from the map', tab: 'places' },
  place_restored: { what: 'put a place back on the map', tab: 'places' },
  place_deleted: { what: 'deleted a place', tab: 'places' },
  story_removed: { what: 'took down a story', tab: 'stories' },
  partner_approved: { what: 'approved a community partner', tab: 'partners' },
  partner_rejected: { what: 'rejected a partner application', tab: 'partners' },
  partner_reopened: { what: 'moved a partner back to waiting', tab: 'partners' },
  partner_deleted: { what: 'deleted a partner application', tab: 'partners' },
  broadcast_sent: { what: 'sent a notification to everyone', tab: 'notify' },
  admin_added: { what: 'added an admin', tab: 'team' },
  admin_removed: { what: 'removed an admin', tab: 'team' },
  event_added: { what: 'added an event', tab: 'events' },
  event_updated: { what: 'changed an event', tab: 'events' },
  event_hidden: { what: 'hid an event', tab: 'events' },
  place_changed: { what: 'suggested a change to a place, review it', tab: 'places' },
  place_change_approved: { what: 'approved a change to a place', tab: 'places' },
  place_change_rejected: { what: 'rejected a change to a place', tab: 'places' },
  partner_changed: { what: 'suggested a change to a partner, review it', tab: 'partners' },
  partner_change_approved: { what: 'approved a change to a partner', tab: 'partners' },
  partner_change_rejected: { what: 'rejected a change to a partner', tab: 'partners' },
};

const adminIds = async (db: SupabaseClient) => ((await db.from('app_admins').select('user_id')).data ?? []).map((a) => a.user_id as string);

async function sendTo(db: SupabaseClient, userIds: string[], message: string) {
  if (!userIds.length) return json(200, { sent: 0, reason: 'no account' });
  const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').in('user_id', userIds);
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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  let toProfileId = '';
  let replyId = '';
  let placeId = '';
  let approvedPlaceId = '';
  let partnerApplicationId = '';
  let adminEvent: { kind: string; detail: string } | null = null;
  let checkIn = false;
  let editId = '';
  try {
    const body = await req.json();
    toProfileId = String(body.toProfileId ?? '');
    replyId = String(body.replyId ?? '');
    placeId = String(body.placeId ?? '');
    approvedPlaceId = String(body.approvedPlaceId ?? '');
    partnerApplicationId = String(body.partnerApplicationId ?? '');
    if (body.adminEvent) adminEvent = { kind: String(body.adminEvent.kind ?? ''), detail: String(body.adminEvent.detail ?? '') };
    checkIn = body.checkIn === true;
    editId = String(body.editId ?? '');
  } catch {
    return json(400, { error: 'Body must be JSON' });
  }
  if (!toProfileId && !replyId && !placeId && !approvedPlaceId && !partnerApplicationId && !adminEvent && !checkIn && !editId) {
    return json(400, { error: 'toProfileId, replyId, placeId, approvedPlaceId, partnerApplicationId, adminEvent, checkIn or editId is required' });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (partnerApplicationId) {
    // Applying needs no account. Only a pending application from the last few
    // minutes counts, and marking it here means each one notifies once.
    const { data: app } = await db
      .from('community_partner_applications')
      .update({ admins_notified_at: new Date().toISOString() })
      .eq('id', partnerApplicationId)
      .eq('status', 'pending')
      .is('admins_notified_at', null)
      .gte('created_at', new Date(Date.now() - FRESH_MS).toISOString())
      .select('community_name, lead_name')
      .maybeSingle();
    if (!app) return json(200, { sent: 0, reason: 'no new application' });
    return sendTo(
      db,
      await adminIds(db),
      JSON.stringify({
        title: 'New community partner application',
        body: `${app.community_name}, from ${app.lead_name}`,
        url: '/?admin=partners',
        tag: 'partners-review',
      })
    );
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: who } = await asCaller.auth.getUser();
  if (!who.user) return json(401, { error: 'Sign in first' });

  // The caller's profile.
  const { data: me } = await db.from('profiles').select('id, name').eq('owner_id', who.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

  // Who to tell, and what.
  let targetUserIds: string[] = [];
  let message = '';
  if (adminEvent) {
    // One admin did something: the rest of the team hears about it.
    const event = ADMIN_EVENTS[adminEvent.kind];
    if (!event) return json(400, { error: 'Unknown adminEvent kind' });
    const { data: isAdmin } = await asCaller.rpc('is_admin');
    if (isAdmin !== true) return json(403, { error: 'Admins only' });
    const detail = adminEvent.detail.trim();
    targetUserIds = await adminIds(db);
    message = JSON.stringify({
      title: `${me?.name ?? 'An admin'} ${event.what}`,
      body: detail.length > 160 ? `${detail.slice(0, 159)}…` : detail,
      url: `/?admin=${event.tab}`,
      tag: `admin:${adminEvent.kind}:${Date.now()}`,
    });
  } else if (editId) {
    // A community lead just suggested a change to their community: the admins review it.
    const { data: edit } = await db
      .from('content_edits')
      .select('target, target_id, status, created_at, proposed_by')
      .eq('id', editId)
      .maybeSingle();
    if (!edit || edit.proposed_by !== who.user.id || edit.status !== 'pending' || !isFresh(edit.created_at)) return json(200, { sent: 0, reason: 'not a new change' });
    const { data: c } = await db.from('community_partner_applications').select('community_name').eq('id', edit.target_id).maybeSingle();
    targetUserIds = await adminIds(db);
    message = JSON.stringify({
      title: `${me?.name ?? 'A lead'} suggested a change to ${c?.community_name ?? 'their community'}`,
      body: 'Review it in Partners → Waiting.',
      url: '/?admin=partners',
      tag: `edit:${editId}`,
    });
  } else if (approvedPlaceId) {
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
    targetUserIds = await adminIds(db);
    message = JSON.stringify({
      title: 'New place to review',
      body: `${place.name}${place.area ? ` · ${place.area}` : ''}, added by ${me?.name ?? 'someone'}`,
      url: '/?admin=places',
      tag: 'places-review',
    });
  } else if (checkIn) {
    if (!me) return json(400, { error: 'No profile' });
    // Their check-in, made just now: tell people they've added, or who added
    // them, that are checked in at the same event. Never the whole room.
    const { data: mine } = await db.from('check_ins').select('event_id, event_title, checked_in_at').eq('user_id', who.user.id).maybeSingle();
    if (!mine || !isFresh(mine.checked_in_at)) return json(200, { sent: 0, reason: 'no recent check-in' });
    const { data: room } = await db
      .from('check_ins')
      .select('user_id, profile_id')
      .eq('event_id', mine.event_id)
      .gt('expires_at', new Date().toISOString())
      .neq('user_id', who.user.id);
    const others = (room ?? []).map((r) => r.profile_id as string);
    if (!others.length) return json(200, { sent: 0, reason: 'nobody else here' });
    const [{ data: added }, { data: addedMe }] = await Promise.all([
      db.from('connections').select('to_profile_id').eq('from_profile_id', me.id).in('to_profile_id', others),
      db.from('connections').select('from_profile_id').eq('to_profile_id', me.id).in('from_profile_id', others),
    ]);
    const known = new Set([...(added ?? []).map((c) => c.to_profile_id), ...(addedMe ?? []).map((c) => c.from_profile_id)]);
    targetUserIds = (room ?? []).filter((r) => known.has(r.profile_id)).map((r) => r.user_id as string);
    message = JSON.stringify({
      title: `${me.name} is here too 👋`,
      body: `Checked in at ${mine.event_title || 'your event'}. Go say hi.`,
      url: `/?event=${encodeURIComponent(mine.event_id)}`,
      tag: `here:${mine.event_id}:${me.id}`,
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
      title: `${me.name} started following you`,
      body: 'Tap to see their profile and follow back.',
      url: `/?tab=people&person=${encodeURIComponent(me.id)}`,
      tag: `added:${me.id}`,
    });
  }
  // Never notify yourself (an admin adding a place, approving their own).
  return sendTo(
    db,
    targetUserIds.filter((id) => id && id !== who.user.id),
    message
  );
});
