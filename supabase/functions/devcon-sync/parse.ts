// Turns Devcon's programme into rows for devcon_sessions. Two sources:
//   - the day pages (app.devcon.org/ai/devcon8/day/N): plain text, every
//     session including the community hubs, but summaries are cut short;
//   - the API (api.devcon.org/sessions?event=devcon8): stage sessions only,
//     with full descriptions, speaker photos and X handles, and slides.
// A day page's CODE is the API's sourceId, so the API fills in what it knows.

export interface Speaker {
  name: string;
  avatar?: string;
  x?: string;
}

export interface SessionRow {
  code: string;
  day: string; // YYYY-MM-DD, venue time
  starts_at: string; // ISO
  ends_at: string;
  room: string;
  format: string;
  track: string;
  level: string;
  title: string;
  speakers: Speaker[];
  tags: string[];
  summary: string;
  description: string;
  slides: string;
  url: string;
}

// Day 1 is Tue 3 Nov 2026; the heading on each page says so too.
export const DAYS = ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'];

const at = (day: string, hhmm: string) => new Date(`${day}T${hhmm}:00+05:30`).toISOString();
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// - CODE · 09:00-10:00 · Room · Format · Track · [level: … · ]"Title"[ · with A, B][ · tags: x, y][ · summary]
const LINE = /^- (\S+) · (\d\d:\d\d)-(\d\d:\d\d) · (.+?) · (.*?) · (.*?) · (?:level: (.*?) · )?"(.+?)"(?: · (.*))?$/;

export function parseDayPage(text: string, day: string): SessionRow[] {
  const rows: SessionRow[] = [];
  for (const line of text.split('\n')) {
    const m = LINE.exec(line.trim());
    if (!m) continue;
    const [, code, start, end, room, format, track, level, title, rest = ''] = m;
    let speakers: Speaker[] = [];
    let tags: string[] = [];
    let summary = rest;
    const withM = /^with (.*?)(?: · (.*))?$/.exec(summary);
    if (withM) {
      speakers = withM[1].split(', ').map((name) => ({ name: name.trim() })).filter((s) => s.name);
      summary = withM[2] ?? '';
    }
    const tagM = /^tags: (.*?)(?: · (.*))?$/.exec(summary);
    if (tagM) {
      tags = tagM[1].split(', ').map((t) => t.trim()).filter(Boolean);
      summary = tagM[2] ?? '';
    }
    rows.push({
      code,
      day,
      starts_at: at(day, start),
      // A session running past midnight would end before it starts; none do, but keep it sane.
      ends_at: end > start ? at(day, end) : at(day, start),
      room: room.trim(),
      format: format.trim(),
      track: track.trim(),
      level: (level ?? '').trim(),
      title: title.trim(),
      speakers,
      tags,
      summary: clip(summary.trim(), 400),
      description: '',
      slides: '',
      url: '',
    });
  }
  return rows;
}

// deno-lint-ignore no-explicit-any
type ApiSession = Record<string, any>;

const istDay = (ms: number) => new Date(ms + 5.5 * 3600e3).toISOString().slice(0, 10);

function fromApi(s: ApiSession): SessionRow {
  return {
    code: String(s.sourceId || s.id),
    day: istDay(s.slot_start),
    starts_at: new Date(s.slot_start).toISOString(),
    ends_at: new Date(s.slot_end || s.slot_start).toISOString(),
    room: s.slot_room?.name ?? '',
    format: s.type ?? '',
    track: s.track ?? '',
    level: s.expertise ?? '',
    title: s.title ?? '',
    speakers: [],
    tags: Array.isArray(s.tags) ? s.tags : [],
    summary: '',
    description: '',
    slides: '',
    url: '',
  };
}

/**
 * Day-page rows with the API's details on top. The pages are the full
 * programme, so API sessions missing from them are only used when no page
 * could be read.
 */
export function mergeApi(rows: SessionRow[], api: ApiSession[]): SessionRow[] {
  const byCode = new Map(rows.map((r) => [r.code, r]));
  for (const s of api) {
    if (!s.slot_start) continue;
    const code = String(s.sourceId || s.id);
    let r = byCode.get(code);
    if (!r) {
      if (rows.length) continue;
      r = fromApi(s);
      byCode.set(code, r);
    }
    const desc = String(s.description ?? '').trim();
    if (desc) r.description = clip(desc, 4000);
    if (!r.summary && desc) r.summary = clip(desc, 400);
    if (Array.isArray(s.speakers) && s.speakers.length) {
      r.speakers = s.speakers.map((p: ApiSession) => ({
        name: String(p.name ?? '').trim(),
        ...(p.avatar ? { avatar: String(p.avatar) } : {}),
        ...(p.twitter ? { x: String(p.twitter).replace(/^@/, '') } : {}),
      })).filter((p: Speaker) => p.name);
    }
    if (typeof s.resources_presentation === 'string' && /^https:\/\//.test(s.resources_presentation)) r.slides = s.resources_presentation;
    // Only the API's sessions have a page in Devcon's app.
    r.url = `https://app.devcon.org/schedule/${encodeURIComponent(code)}`;
  }
  return [...byCode.values()].filter((r) => DAYS.includes(r.day));
}
