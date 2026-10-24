// event-import: reads an event page (Luma and most event sites) and returns
// its details for Admin → Events to fill the form. Nothing is saved here.
//
// POST /functions/v1/event-import
//   headers: Authorization: Bearer <an admin's access token>
//   body:    { "url": "https://luma.com/abc123" }
// Answers { event, partial } or { error } (status 200, so the app shows the
// message); parse.ts does the reading.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { parseEventPage } from './parse.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

const MAX_BYTES = 3_000_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  // Admins only: this fetches pages on request.
  const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: isAdmin } = await asCaller.rpc('is_admin');
  if (isAdmin !== true) return json(403, { error: 'Admins only' });

  let url: URL;
  try {
    url = new URL(String((await req.json()).url ?? '').trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('not a web link');
  } catch {
    return json(200, { error: 'Paste a full link, like https://luma.com/abc123' });
  }
  // lu.ma links redirect to luma.com.
  if (url.hostname === 'lu.ma') url.hostname = 'luma.com';

  let html = '';
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; MumbaiOnchainBot/1.0; +https://www.mumbaionchain.site)', accept: 'text/html' },
    });
    if (!res.ok) return json(200, { error: `That page answered ${res.status}. Check the link, or fill the event in by hand.` });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return json(200, { error: 'That page is too big to read. Fill the event in by hand.' });
    html = new TextDecoder().decode(buf);
  } catch {
    return json(200, { error: 'Couldn’t open that page. Check the link, or fill the event in by hand.' });
  }

  return json(200, parseEventPage(html, url.toString()));
});
