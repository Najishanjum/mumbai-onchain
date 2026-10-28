// devcon-sync: copies Devcon 8's programme into devcon_sessions, from the
// four day pages plus the API's details (see parse.ts). Sessions that left
// the programme are removed, but only after a run that read every day page,
// so a Devcon hiccup never empties the app's programme.
//
// POST /functions/v1/devcon-sync   (no body, no sign-in)
// Run every 30 minutes by supabase/cron/devcon-sync.sql. Safe to call any
// time. Deploy with --no-verify-jwt.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { DAYS, mergeApi, parseDayPage, type SessionRow } from './parse.ts';

const PAGE = (n: number) => `https://app.devcon.org/ai/devcon8/day/${n}`;
const API = 'https://api.devcon.org/sessions?event=devcon8&size=2000';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function get(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'user-agent': 'mumbaionchain.site programme sync' } });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const runAt = new Date().toISOString();

  const pages = await Promise.all(DAYS.map(async (day, i) => {
    const res = await get(PAGE(i + 1));
    return res ? parseDayPage(await res.text(), day) : [];
  }));
  const apiRes = await get(API);
  const api = apiRes ? ((await apiRes.json())?.data?.items ?? []) : [];

  const rows: SessionRow[] = mergeApi(pages.flat(), api);
  if (!rows.length) return json(502, { error: 'Devcon programme unavailable' });

  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200).map((r) => ({ ...r, synced_at: runAt }));
    const { error } = await db.from('devcon_sessions').upsert(batch, { onConflict: 'code' });
    if (error) return json(500, { error: error.message });
  }

  let removed = 0;
  if (pages.every((p) => p.length > 0)) {
    const { count, error } = await db.from('devcon_sessions').delete({ count: 'exact' }).lt('synced_at', runAt);
    if (error) return json(500, { error: error.message });
    removed = count ?? 0;
  }
  return json(200, { sessions: rows.length, perDay: pages.map((p) => p.length), api: api.length, removed });
});
