// community-message: partner community leads messaging people.
//
// POST /functions/v1/community-message
//   headers: Authorization: Bearer <the signed-in user's access token>
//   body:    { "send": { "communityId", "title", "body", "audience": "members" | "everyone" } }
//              a lead (or an admin): to members it goes out now (2 a day per
//              community); to everyone it waits for an admin
//        or  { "review": { "id", "decision": "approve" | "reject", "note"? } }
//              an admin: sends a waiting message to everyone, or declines it
// No links in messages: a lead's account could be taken over, and this is a
// crypto week. Every message is kept in broadcasts as the history.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { pushTo } from '../_shared/push.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};
// Errors are 200 with { error } so the app can show the message.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

const DAILY_LIMIT = 2;
const DAY_MS = 24 * 60 * 60 * 1000;
// Anything that looks like a link (same as LINK in src/lib/useBroadcasts.ts).
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|xyz|io|me|ly|gg|org|net|app|site|co|in|link|to|fi|money|finance|so|ai|dev|tech|club|lol)\b|t\.me\/|wa\.me\/)/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: who } = await asCaller.auth.getUser();
  if (!who.user) return json({ error: 'Sign in first.' });
  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: isAdmin } = await asCaller.rpc('is_admin');

  let input: { send?: { communityId?: string; title?: string; body?: string; audience?: string }; review?: { id?: string; decision?: string; note?: string } };
  try {
    input = await req.json();
  } catch {
    return json({ error: 'Body must be JSON' }, 400);
  }

  // ── A lead sends ──────────────────────────────────────────────────────
  if (input.send) {
    const communityId = String(input.send.communityId ?? '');
    const title = String(input.send.title ?? '').trim();
    const body = String(input.send.body ?? '').trim();
    const audience = input.send.audience === 'everyone' ? 'everyone' : 'members';
    if (!title) return json({ error: 'Add a title.' });
    if (title.length > 80 || body.length > 240) return json({ error: 'Keep the title under 80 characters and the message under 240.' });
    if (LINK.test(`${title} ${body}`)) return json({ error: 'Messages can’t have links. Tell people where to find it instead, like “on our Telegram”.' });

    const { data: isLead } = await asCaller.rpc('is_community_lead', { p_community_id: communityId });
    if (isLead !== true && isAdmin !== true) return json({ error: 'Only this community’s leads can message its members.' });
    const { data: community } = await db.from('community_partner_applications').select('community_name, status').eq('id', communityId).maybeSingle();
    if (!community || community.status !== 'approved') return json({ error: 'That community isn’t listed right now.' });
    const { data: me } = await db.from('profiles').select('id, name').eq('owner_id', who.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (audience === 'everyone') {
      const { count } = await db.from('broadcasts').select('id', { count: 'exact', head: true }).eq('community_id', communityId).eq('status', 'pending');
      if ((count ?? 0) > 0) return json({ error: 'You already have a message waiting for the admins. You’ll hear back soon.' });
      const { data: row, error } = await db
        .from('broadcasts')
        .insert({ community_id: communityId, sender_id: who.user.id, sender_profile_id: me?.id ?? null, title, body, audience, status: 'pending' })
        .select('id')
        .single();
      if (error) return json({ error: 'Couldn’t send your request. Try again.' });
      const { data: admins } = await db.from('app_admins').select('user_id');
      await pushTo(
        db,
        (admins ?? []).map((a) => a.user_id as string),
        { title: `${community.community_name} wants to message everyone`, body: `“${title}”. Approve or decline it in Notify.`, url: '/?admin=notify', tag: `request:${row.id}` }
      );
      return json({ status: 'pending' });
    }

    const { count } = await db
      .from('broadcasts')
      .select('id', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .eq('audience', 'members')
      .eq('status', 'sent')
      .gte('sent_at', new Date(Date.now() - DAY_MS).toISOString());
    if ((count ?? 0) >= DAILY_LIMIT) return json({ error: `That’s ${DAILY_LIMIT} messages in the last 24 hours, the most for now. Try again later.` });

    const { data: members } = await db.from('community_members').select('user_id').eq('community_id', communityId).eq('muted', false).neq('user_id', who.user.id);
    const { data: row, error } = await db
      .from('broadcasts')
      .insert({ community_id: communityId, sender_id: who.user.id, sender_profile_id: me?.id ?? null, title, body, audience, status: 'sent', sent_at: new Date().toISOString() })
      .select('id')
      .single();
    if (error) return json({ error: 'Couldn’t send. Try again.' });
    const recipients = await pushTo(
      db,
      (members ?? []).map((m) => m.user_id as string),
      { title: `${community.community_name}: ${title}`, body, url: `/?community=${communityId}`, tag: `cmsg:${row.id}` }
    );
    await db.from('broadcasts').update({ recipients }).eq('id', row.id);
    return json({ status: 'sent', recipients, members: members?.length ?? 0 });
  }

  // ── An admin approves or declines a message to everyone ─────────────────
  if (input.review) {
    if (isAdmin !== true) return json({ error: 'Admins only.' }, 403);
    const id = String(input.review.id ?? '');
    const approve = input.review.decision === 'approve';
    const note = String(input.review.note ?? '').trim().slice(0, 200);
    // Claim it, so two admins can't both send it.
    const { data: msg } = await db
      .from('broadcasts')
      .update({ status: approve ? 'sent' : 'rejected', reviewed_by: who.user.id, reviewed_at: new Date().toISOString(), review_note: note, sent_at: approve ? new Date().toISOString() : null })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id, community_id, sender_id, title, body')
      .maybeSingle();
    if (!msg) return json({ error: 'Someone already answered this one.' });
    const { data: community } = await db.from('community_partner_applications').select('community_name').eq('id', msg.community_id).maybeSingle();
    const name = community?.community_name ?? 'A community';

    let recipients = 0;
    if (approve) {
      recipients = await pushTo(db, null, { title: `${name}: ${msg.title}`, body: msg.body, url: `/?community=${msg.community_id}`, tag: `cmsg:${msg.id}` });
      await db.from('broadcasts').update({ recipients }).eq('id', msg.id);
    }
    // Tell the lead how it went.
    if (msg.sender_id) {
      await pushTo(db, [msg.sender_id], {
        title: approve ? 'Your message went out to everyone 🎉' : 'Your message to everyone wasn’t sent',
        body: approve ? `“${msg.title}” reached ${recipients} phones.` : note || `“${msg.title}”. You can still message your members.`,
        url: `/?community=${msg.community_id}`,
        tag: `review:${msg.id}`,
      });
    }
    return json({ status: approve ? 'sent' : 'rejected', recipients });
  }

  return json({ error: 'Nothing to do.' }, 400);
});
