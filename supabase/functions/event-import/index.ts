// event-import: reads an event page (Luma and most event sites) and returns
// its details for Admin → Events to fill the form. Nothing is saved here.
//
// POST /functions/v1/event-import
//   headers: Authorization: Bearer <an admin's access token>
//   body:    { "url": "https://luma.com/abc123" }  an event
//        or  { "url": "https://luma.com/ibw" }     a Luma calendar
//        or  { "mapLink": "https://maps.app.goo.gl/…" }  a short Google Maps
//              link (what the iPhone app shares): answers { lat, lng }
// Answers { event, partial }, { calendar: { name, events } } or { error }
// (status 200, so the app shows the message); parse.ts does the reading.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { lumaCalendar, lumaEntry, parseEventPage } from './parse.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

const MAX_BYTES = 3_000_000;

// A pin in a Google Maps address or page: the place's own (!3d…!4d…) first,
// then the map's centre (@lat,lng), then ?q= / center= coordinates.
const PIN = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|center)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i];
function findPin(text: string): { lat: number; lng: number } | null {
  let t = text;
  try {
    t = decodeURIComponent(text);
  } catch {
    // a page with stray % signs: read it as it is
  }
  for (const re of PIN) {
    const m = t.match(re);
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
}

/** Opens a short Google Maps link (only those) and finds the pin it points to. */
async function resolveMapLink(link: string): Promise<{ lat: number; lng: number } | { error: string }> {
  let u: URL;
  try {
    u = new URL(link.trim());
  } catch {
    return { error: 'That isn’t a link.' };
  }
  const short = u.hostname === 'maps.app.goo.gl' || (u.hostname === 'goo.gl' && u.pathname.startsWith('/maps'));
  if (!short) return { error: 'Only short Google Maps links (maps.app.goo.gl) are opened here.' };
  try {
    const res = await fetch(u, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
      headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'en' },
    });
    // The address it lands on usually has the pin; if not, the page does.
    const fromUrl = findPin(res.url);
    if (fromUrl) return fromUrl;
    const page = (await res.text()).slice(0, MAX_BYTES);
    return findPin(page) ?? { error: 'Couldn’t find the pin in that link. Paste the coordinates instead.' };
  } catch {
    return { error: 'Couldn’t open that link. Check it, or paste the coordinates.' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  // Admins only: this fetches pages on request.
  const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: isAdmin } = await asCaller.rpc('is_admin');
  if (isAdmin !== true) return json(403, { error: 'Admins only' });

  let body: { url?: string; mapLink?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Body must be JSON' });
  }
  if (body.mapLink) return json(200, await resolveMapLink(String(body.mapLink)));

  let url: URL;
  try {
    url = new URL(String(body.url ?? '').trim());
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

  // A Luma calendar (luma.com/ibw): every upcoming event, to pick from.
  const cal = lumaCalendar(html);
  if (cal) {
    let entries = cal.entries;
    let complete = false;
    try {
      const all: unknown[] = [];
      let cursor = '';
      for (let page = 0; page < 5; page++) {
        const api = new URL('https://api.lu.ma/calendar/get-items');
        api.searchParams.set('calendar_api_id', cal.apiId);
        api.searchParams.set('period', 'future');
        api.searchParams.set('pagination_limit', '100');
        if (cursor) api.searchParams.set('pagination_cursor', cursor);
        const res = await fetch(api, { signal: AbortSignal.timeout(10_000), headers: { accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json();
        all.push(...(body.entries ?? []));
        if (!body.has_more || !body.next_cursor) break;
        cursor = body.next_cursor;
      }
      entries = all;
      complete = true;
    } catch {
      // Luma's list didn't answer (it rate-limits): the 20 on the page will do.
    }
    const events = entries.map(lumaEntry).filter((e): e is NonNullable<typeof e> => e !== null);
    if (!events.length) return json(200, { error: 'That calendar has no upcoming events.' });
    return json(200, { calendar: { name: cal.name, events, complete } });
  }

  return json(200, parseEventPage(html, url.toString()));
});
