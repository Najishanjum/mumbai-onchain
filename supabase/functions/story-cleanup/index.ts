// story-cleanup: deletes stories posted with no event once they're 48 hours
// old: the photo and thumbnail in Storage, then the row (its views and
// replies go with it). Event-tagged stories and the team's stay as Highlights.
// Only stories posted after the rule started (app_settings
// story_cleanup_since) are touched.
//
// POST /functions/v1/story-cleanup   (no body, no sign-in)
// Run every hour by supabase/cron/story-cleanup.sql. Safe to call any time:
// it only removes what's already due. Deploy with --no-verify-jwt.

import { createClient } from 'npm:@supabase/supabase-js@2';

const LIFE_MS = 48 * 60 * 60 * 1000;
const NO_EVENT = 'general';
const BATCH = 200;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const thumbPathFor = (path: string) => path.replace(/\.webp$/, '') + '-thumb.webp';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: since } = await db.from('app_settings').select('value').eq('key', 'story_cleanup_since').maybeSingle();
  if (!since?.value) return json(200, { deleted: 0, reason: 'cleanup not started (run the migration)' });

  const { data: admins } = await db.from('app_admins').select('user_id');
  const team = new Set((admins ?? []).map((a) => a.user_id as string));

  const { data: due, error } = await db
    .from('snaps')
    .select('id, owner_id, storage_path')
    .eq('event_id', NO_EVENT)
    .gte('created_at', new Date(since.value).toISOString())
    .lt('created_at', new Date(Date.now() - LIFE_MS).toISOString())
    .limit(BATCH);
  if (error) return json(500, { error: error.message });

  const doomed = (due ?? []).filter((s) => !s.owner_id || !team.has(s.owner_id));
  if (!doomed.length) return json(200, { deleted: 0 });

  // Photos first: if the rows went first and this failed, the files would be orphaned.
  const paths = doomed.flatMap((s) => (s.storage_path ? [s.storage_path, thumbPathFor(s.storage_path)] : []));
  if (paths.length) {
    const { error: e } = await db.storage.from('snaps').remove(paths);
    if (e) return json(500, { error: `storage: ${e.message}` });
  }
  const { error: e2 } = await db.from('snaps').delete().in('id', doomed.map((s) => s.id));
  if (e2) return json(500, { error: e2.message });
  return json(200, { deleted: doomed.length, files: paths.length });
});
