// Event details from an event page's HTML, as Admin → Events fills its form.
// Event pages publish schema.org Event data (JSON-LD); Luma's has the title,
// IST start and end, venue, address, map point, cover and hosts. Pages
// without it fall back to their og: title, image and description.
// No Deno APIs here, so it runs in tests too.

type Obj = Record<string, unknown>;

export interface ImportedEvent {
  title: string;
  description: string;
  organizer: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string;
  official_url: string;
  source_url: string;
}

export type ParseResult = { event: Partial<ImportedEvent>; partial: boolean } | { error: string };

/** "2026-11-01T17:00:00.000+05:30" → { date: "2026-11-01", time: "17:00" } in IST. */
export function ist(iso: unknown): { date: string; time: string } | null {
  if (typeof iso !== 'string') return null;
  // Date only: no time given.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { date: iso, time: 'TBA' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const first = <T>(v: T | T[] | undefined): T | undefined => (Array.isArray(v) ? v[0] : v);
const isEvent = (o: Obj) => {
  const t = o['@type'];
  return (Array.isArray(t) ? t : [t]).some((x) => typeof x === 'string' && /Event$/.test(x));
};

/** Every JSON-LD object on the page, flattening arrays and @graph. */
function jsonLd(html: string): Obj[] {
  const out: Obj[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      out.push(v as Obj);
      if (Array.isArray((v as Obj)['@graph'])) ((v as Obj)['@graph'] as unknown[]).forEach(walk);
    }
  };
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1]));
    } catch {
      // a broken block; try the next
    }
  }
  return out;
}

function meta(html: string, prop: string): string {
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i');
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
  return (html.match(a)?.[1] ?? html.match(b)?.[1] ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export function parseEventPage(html: string, pageUrl: string): ParseResult {
  const canonical = meta(html, 'og:url') || pageUrl;
  const ev = jsonLd(html).find(isEvent);
  if (!ev) {
    const title = meta(html, 'og:title');
    if (!title) return { error: 'No event details on that page. Fill it in by hand.' };
    return { partial: true, event: { title, description: meta(html, 'og:description'), image_url: meta(html, 'og:image'), official_url: canonical, source_url: canonical } };
  }

  const start = ist(ev.startDate);
  const end = ist(ev.endDate) ?? start;
  const place = first(ev.location as Obj | Obj[] | undefined) ?? {};
  const online = place['@type'] === 'VirtualLocation';
  const addr = (place.address ?? {}) as Obj | string;
  const address = typeof addr === 'string' ? addr : [addr.streetAddress, addr.addressLocality, addr.addressRegion].map(text).filter(Boolean).join(', ');
  const geo = (place.geo ?? {}) as Obj;
  const lat = Number(geo.latitude ?? place.latitude);
  const lng = Number(geo.longitude ?? place.longitude);
  const image = first(ev.image as unknown);
  const hosts = ((Array.isArray(ev.organizer) ? ev.organizer : ev.organizer ? [ev.organizer] : []) as Obj[]).map((o) => text(o.name)).filter(Boolean);

  return {
    partial: !start,
    event: {
      title: (text(ev.name) || meta(html, 'og:title')).slice(0, 200),
      description: text(ev.description).slice(0, 5000),
      organizer: hosts.slice(0, 3).join(', ').slice(0, 200),
      start_date: start?.date ?? '',
      start_time: start?.time ?? 'TBA',
      end_date: end?.date ?? '',
      end_time: end?.time ?? 'TBA',
      location: online ? 'Online' : text(place.name) || 'Mumbai, India',
      address: online ? '' : address,
      latitude: Number.isFinite(lat) && lat !== 0 ? lat : null,
      longitude: Number.isFinite(lng) && lng !== 0 ? lng : null,
      image_url: typeof image === 'string' ? image : text((image as Obj | undefined)?.url) || meta(html, 'og:image'),
      official_url: canonical,
      source_url: canonical,
    },
  };
}
