import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, Loader2, Pencil, Search } from 'lucide-react';
import type { EventItem } from '../../types/event';
import { INITIAL_EVENTS } from '../../data/events';
import { supabase } from '../../lib/supabase';
import {
  APP_EVENT_COLUMNS,
  EVENTS_CHANGED,
  EVENT_CATEGORIES,
  eventToRow,
  mergeEvents,
  newEventId,
  rowToEvent,
  type AppEventRow,
} from '../../lib/appEvents';
import { dayLabel, sortByStart } from '../time';
import { AdminHeading, EmptyState, ErrorLine, Segments, btn, notifyAdmins } from './shared';

const field =
  'w-full px-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]';
const label = 'block text-[13px] font-bold text-[var(--app-muted)] mb-1';

type Draft = Omit<AppEventRow, 'priority' | 'updated_at'> & { priority: AppEventRow['priority'] };

const blank = (): Draft => ({
  id: '',
  title: '',
  description: '',
  organizer: '',
  category: 'Ecosystem',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  location: '',
  address: '',
  latitude: null,
  longitude: null,
  official_url: '',
  image_url: '',
  source_url: null,
  priority: 'NORMAL',
  hidden: false,
});

/** Same link, give or take a trailing slash, lu.ma vs luma.com, or tracking bits. */
const sameLink = (a: string, b: string) => {
  const norm = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/^lu\.ma\//, 'luma.com/').replace(/[?#].*$/, '').replace(/\/+$/, '');
  return Boolean(a && b) && norm(a) === norm(b);
};

function EventForm({
  initial,
  partial,
  builtIn,
  onSaved,
  onCancel,
}: {
  initial: Draft;
  partial: boolean;
  /** Editing one of the events built into the app: saved as a change on top of it. */
  builtIn: boolean;
  onSaved: (title: string, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const isNew = !initial.id;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const title = d.title.trim();
    const endDate = d.end_date || d.start_date;
    const startTime = d.start_time || 'TBA';
    const endTime = d.end_time || 'TBA';
    if (!title) return setError('Add a title.');
    if (!d.start_date) return setError('Add the date it starts.');
    if (endDate < d.start_date) return setError('It ends before it starts. Check the dates.');
    if (endDate === d.start_date && startTime !== 'TBA' && endTime !== 'TBA' && endTime < startTime) return setError('It ends before it starts. Check the times.');
    if (!d.official_url.trim()) return setError('Add the event’s link, where people register.');
    setBusy(true);
    setError('');
    const row = {
      ...d,
      id: d.id || newEventId(title),
      title,
      organizer: d.organizer.trim(),
      description: d.description.trim(),
      location: d.location.trim() || 'Mumbai, India',
      address: d.address.trim(),
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      official_url: d.official_url.trim(),
      image_url: d.image_url.trim(),
      updated_at: new Date().toISOString(),
    };
    const { error: err } = await supabase.from('app_events').upsert(row);
    setBusy(false);
    if (err) return setError(err.message.includes('source') ? 'That link was added already.' : `Couldn’t save: ${err.message}`);
    onSaved(title, isNew && !builtIn);
  }

  const time = (k: 'start_time' | 'end_time') => (
    <input
      type="time"
      value={d[k] === 'TBA' ? '' : d[k]}
      onChange={(e) => set(k, e.target.value)}
      aria-label={k === 'start_time' ? 'Start time' : 'End time'}
      className={`${field} h-12`}
    />
  );

  return (
    <form onSubmit={save} className="mx-4 space-y-4">
      {partial && (
        <p className="rounded-2xl bg-[var(--app-primary-soft)] px-4 py-3 text-[14px]">The page didn’t have every detail. Check the date, time and venue before publishing.</p>
      )}
      {builtIn && <p className="rounded-2xl bg-[var(--app-pressed)] px-4 py-3 text-[14px]">This event is built into the app. Your changes show on top of it.</p>}
      {d.image_url && <img src={d.image_url} alt="" className="w-full aspect-[2/1] object-cover rounded-2xl border border-[var(--app-line)]" />}
      <div>
        <label htmlFor="ev-title" className={label}>Title</label>
        <input id="ev-title" value={d.title} maxLength={200} onChange={(e) => set('title', e.target.value)} className={`${field} h-12`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ev-org" className={label}>Hosted by</label>
          <input id="ev-org" value={d.organizer} maxLength={200} onChange={(e) => set('organizer', e.target.value)} className={`${field} h-12`} />
        </div>
        <div>
          <label htmlFor="ev-cat" className={label}>Category</label>
          <select id="ev-cat" value={d.category} onChange={(e) => set('category', e.target.value)} className={`${field} h-12`}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className={label}>Starts (IST)</legend>
        <input type="date" value={d.start_date} onChange={(e) => set('start_date', e.target.value)} aria-label="Start date" className={`${field} h-12`} />
        {time('start_time')}
      </fieldset>
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className={label}>Ends (IST)</legend>
        <input type="date" value={d.end_date} onChange={(e) => set('end_date', e.target.value)} aria-label="End date" className={`${field} h-12`} />
        {time('end_time')}
      </fieldset>
      <p className="-mt-2 text-[13px] text-[var(--app-muted)]">No time yet? Leave it empty and it shows as “Time TBA”.</p>
      <div>
        <label htmlFor="ev-venue" className={label}>Venue</label>
        <input id="ev-venue" value={d.location} onChange={(e) => set('location', e.target.value)} placeholder="Jio World Convention Centre" className={`${field} h-12`} />
      </div>
      <div>
        <label htmlFor="ev-address" className={label}>Address</label>
        <input id="ev-address" value={d.address} onChange={(e) => set('address', e.target.value)} className={`${field} h-12`} />
        <p className="mt-1 text-[13px] text-[var(--app-muted)]">
          {d.latitude != null && d.longitude != null ? 'Map pin set from the link. ' : 'No map pin: directions use the address. '}
          {d.latitude != null && (
            <button type="button" className="underline" onClick={() => setD((x) => ({ ...x, latitude: null, longitude: null }))}>
              Remove pin
            </button>
          )}
        </p>
      </div>
      <div>
        <label htmlFor="ev-url" className={label}>Event link (register)</label>
        <input id="ev-url" type="url" inputMode="url" value={d.official_url} onChange={(e) => set('official_url', e.target.value)} placeholder="https://luma.com/…" className={`${field} h-12`} />
      </div>
      <div>
        <label htmlFor="ev-image" className={label}>Cover image link</label>
        <input id="ev-image" type="url" inputMode="url" value={d.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="Optional" className={`${field} h-12`} />
      </div>
      <div>
        <label htmlFor="ev-desc" className={label}>About</label>
        <textarea id="ev-desc" rows={5} value={d.description} maxLength={5000} onChange={(e) => set('description', e.target.value)} className={`${field} py-3`} />
      </div>
      {error && <p className="text-[14px] text-[var(--app-live)]">{error}</p>}
      <div className="flex gap-2 pb-2">
        <button type="button" className={`${btn.plain} flex-1 h-12`} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={`${btn.primary} flex-1 h-12`} disabled={busy}>
          {busy ? 'Saving…' : isNew && !builtIn ? 'Publish' : 'Save'}
        </button>
      </div>
    </form>
  );
}

/** A Luma calendar's upcoming events: tick the ones to add, all with one category. */
function CalendarPicker({
  name,
  events,
  complete,
  inApp,
  onCancel,
  onAdded,
}: {
  name: string;
  events: Draft[];
  complete: boolean;
  /** The title it's in the app under, if it's there already. */
  inApp: (e: Draft) => string | null;
  onCancel: () => void;
  onAdded: (n: number) => void;
}) {
  const sorted = useMemo(() => [...events].sort((a, b) => `${a.start_date} ${a.start_time}`.localeCompare(`${b.start_date} ${b.start_time}`)), [events]);
  const fresh = sorted.filter((e) => !inApp(e));
  const [picked, setPicked] = useState<Set<string>>(() => new Set(fresh.map((e) => e.official_url)));
  const [category, setCategory] = useState('Ecosystem');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toggle = (url: string) => setPicked((s) => (s.has(url) ? new Set([...s].filter((x) => x !== url)) : new Set([...s, url])));

  async function add() {
    const rows = fresh
      .filter((e) => picked.has(e.official_url))
      .map((e) => ({ ...e, id: newEventId(e.title), category, end_date: e.end_date || e.start_date, updated_at: new Date().toISOString() }));
    if (!rows.length) return;
    setBusy(true);
    setError('');
    const { error: err } = await supabase.from('app_events').insert(rows);
    setBusy(false);
    if (err) return setError(err.message.includes('source') ? 'Some of these were just added by someone else. Go back and read the calendar again.' : `Couldn’t add them: ${err.message}`);
    onAdded(rows.length);
  }

  return (
    <div>
      <AdminHeading title={name || 'Luma calendar'} detail={`${sorted.length} upcoming · ${fresh.length} not in the app yet`} />
      <div className="mx-4 space-y-3">
        {!complete && (
          <p className="rounded-2xl bg-[var(--app-primary-soft)] px-4 py-3 text-[14px]">Luma only sent the first {sorted.length} events this time. Add these, then read the calendar again in a minute for the rest.</p>
        )}
        <div className="flex items-center gap-3">
          <label htmlFor="cal-cat" className="text-[14px] font-bold text-[var(--app-muted)]">
            Category
          </label>
          <select id="cal-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} h-11 flex-1`}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between text-[14px]">
          <span className="text-[var(--app-muted)]">{picked.size} picked</span>
          <button type="button" className="font-bold text-[var(--app-primary)]" onClick={() => setPicked(picked.size === fresh.length ? new Set() : new Set(fresh.map((e) => e.official_url)))}>
            {picked.size === fresh.length ? 'Pick none' : 'Pick all new'}
          </button>
        </div>
        <ul className="rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
          {sorted.map((e) => {
            const already = inApp(e);
            const id = `cal-${e.official_url}`;
            return (
              <li key={e.official_url} className={already ? 'opacity-55' : ''}>
                <label htmlFor={id} className="flex items-start gap-3 px-4 py-3">
                  <input id={id} type="checkbox" className="mt-1 w-5 h-5 accent-[var(--app-primary)]" disabled={Boolean(already)} checked={!already && picked.has(e.official_url)} onChange={() => toggle(e.official_url)} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold leading-snug">{e.title}</span>
                    <span className="block text-[13px] text-[var(--app-muted)]">
                      {dayLabel(e.start_date)} · {e.start_time} · {e.location}
                    </span>
                    {already && <span className="block text-[12px] font-bold text-[var(--app-muted)]">In the app{already !== e.title ? ` as “${already}”` : ''}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {error && <p className="text-[14px] text-[var(--app-live)]">{error}</p>}
        <div className="sticky bottom-0 flex gap-2 py-3 bg-[var(--app-bg)]">
          <button type="button" className={`${btn.plain} flex-1 h-12`} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`${btn.primary} flex-1 h-12`} disabled={busy || picked.size === 0} onClick={add}>
            {busy ? 'Adding…' : `Add ${picked.size} event${picked.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Admin → Events: add from a Luma link or by hand, edit and hide. */
export function AdminEvents() {
  const [tab, setTab] = useState<'add' | 'all'>('add');
  const [rows, setRows] = useState<AppEventRow[] | null>(null);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [reading, setReading] = useState(false);
  const [editing, setEditing] = useState<{ draft: Draft; partial: boolean; builtIn: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const [done, setDone] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  // A Luma calendar that was read: its events to pick from.
  const [picking, setPicking] = useState<{ name: string; events: Draft[]; complete: boolean } | null>(null);

  const load = useCallback(() => {
    supabase
      .from('app_events')
      .select(APP_EVENT_COLUMNS)
      .then(({ data, error: e }) => {
        if (e) setError('Couldn’t load events. Check that the events migration has run.');
        setRows((data ?? []) as AppEventRow[]);
      });
  }, []);
  useEffect(load, [load]);

  const byId = useMemo(() => new Map((rows ?? []).map((r) => [r.id, r])), [rows]);
  const builtInIds = useMemo(() => new Set(INITIAL_EVENTS.map((e) => e.id)), []);
  // Everything, hidden ones included, so they can be shown again.
  const all = useMemo(() => {
    const visible = mergeEvents(INITIAL_EVENTS, rows ?? []);
    const hidden = (rows ?? []).filter((r) => r.hidden).map((r) => rowToEvent(r, INITIAL_EVENTS.find((e) => e.id === r.id)));
    return [...visible, ...hidden].sort(sortByStart);
  }, [rows]);

  function changed(message: string) {
    setDone(message);
    load();
    window.dispatchEvent(new Event(EVENTS_CHANGED));
  }

  async function readLink(e: React.FormEvent) {
    e.preventDefault();
    const url = link.trim();
    if (!url) return;
    setDone('');
    setError('');
    // Already in the app?
    const dup = all.find((ev) => sameLink(ev.officialUrl, url) || sameLink(byId.get(ev.id)?.source_url ?? '', url));
    if (dup) return setError(`Already in the app: ${dup.title}. Find it under All events to change it.`);
    setReading(true);
    const { data, error: err } = await supabase.functions.invoke('event-import', { body: { url } });
    setReading(false);
    if (err || !data) return setError('Couldn’t read that link. Try again, or add the event by hand.');
    if (data.error) return setError(data.error);
    if (data.calendar) {
      return setPicking({ name: data.calendar.name, complete: Boolean(data.calendar.complete), events: (data.calendar.events as Partial<Draft>[]).map((e) => ({ ...blank(), ...e })) });
    }
    setEditing({ draft: { ...blank(), ...data.event, category: 'Ecosystem' }, partial: Boolean(data.partial), builtIn: false });
  }

  async function setHidden(ev: EventItem, hidden: boolean) {
    setBusyId(ev.id);
    const existing = byId.get(ev.id);
    const { error: err } = existing
      ? await supabase.from('app_events').update({ hidden, updated_at: new Date().toISOString() }).eq('id', ev.id)
      : await supabase.from('app_events').upsert({ ...eventToRow(ev), source_url: null, hidden });
    setBusyId(null);
    if (err) return setError(`Couldn’t ${hidden ? 'hide' : 'show'} ${ev.title}.`);
    if (hidden) notifyAdmins('event_hidden', ev.title);
    changed(hidden ? `${ev.title} is hidden from the app.` : `${ev.title} is back in the app.`);
  }

  if (picking) {
    return (
      <CalendarPicker
        name={picking.name}
        events={picking.events}
        complete={picking.complete}
        inApp={(e) => all.find((ev) => sameLink(ev.officialUrl, e.official_url) || sameLink(byId.get(ev.id)?.source_url ?? '', e.official_url))?.title ?? null}
        onCancel={() => setPicking(null)}
        onAdded={(n) => {
          notifyAdmins('event_added', `${n} event${n === 1 ? '' : 's'} from ${picking.name}`);
          setPicking(null);
          setLink('');
          changed(`${n} event${n === 1 ? '' : 's'} from ${picking.name} ${n === 1 ? 'is' : 'are'} live in the app.`);
          setTab('all');
        }}
      />
    );
  }

  if (editing) {
    return (
      <div>
        <AdminHeading title={editing.draft.id ? 'Edit event' : 'New event'} />
        <EventForm
          initial={editing.draft}
          partial={editing.partial}
          builtIn={editing.builtIn}
          onCancel={() => setEditing(null)}
          onSaved={(title, isNew) => {
            setEditing(null);
            setLink('');
            notifyAdmins(isNew ? 'event_added' : 'event_updated', title);
            changed(isNew ? `${title} is live in the app.` : `${title} is updated.`);
            if (isNew) setTab('all');
          }}
        />
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const list = all.filter((e) => !q || [e.title, e.organizer, e.location].some((f) => f?.toLowerCase().includes(q)));

  return (
    <div>
      <AdminHeading title="Events" detail="Add events from a Luma link or by hand. They show in the app straight away." />
      <Segments
        label="Events"
        value={tab}
        onChange={setTab}
        options={[
          { id: 'add', label: 'Add' },
          { id: 'all', label: `All events · ${all.filter((e) => !byId.get(e.id)?.hidden).length}` },
        ]}
      />
      {done && (
        <p role="status" className="mx-4 mb-3 rounded-2xl bg-[var(--app-primary-soft)] px-4 py-3 text-[14px] font-semibold">
          {done}
        </p>
      )}
      <ErrorLine text={error} />

      {tab === 'add' ? (
        <div className="mx-4 space-y-3">
          <form onSubmit={readLink} className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4 space-y-3">
            <label htmlFor="ev-link" className="block text-[17px] font-bold">
              From a link
            </label>
            <p className="-mt-2 text-[14px] text-[var(--app-muted)]">Paste a Luma event link to fill in one event, or a Luma calendar link (like luma.com/ibw) to pick from all its events.</p>
            <input id="ev-link" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="luma.com/abc123 or luma.com/ibw" className={`${field} h-12`} />
            <button type="submit" className={`${btn.primary} w-full h-12 inline-flex items-center justify-center gap-2`} disabled={reading || !link.trim()}>
              {reading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
              {reading ? 'Reading the page…' : 'Read event'}
            </button>
          </form>
          <button type="button" className={`${btn.plain} w-full h-12`} onClick={() => setEditing({ draft: blank(), partial: false, builtIn: false })}>
            Add by hand instead
          </button>
        </div>
      ) : rows === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading events" />
        </div>
      ) : (
        <>
          <div className="mx-4 mb-3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-muted)]" aria-hidden="true" />
            <label htmlFor="ev-search" className="sr-only">Search events</label>
            <input id="ev-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events" className={`${field} h-11 pl-10`} />
          </div>
          {list.length === 0 ? (
            <EmptyState title="No events match" body="Try another word, or add the event from the Add tab." />
          ) : (
            <ul className="mx-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
              {list.map((ev) => {
                const row = byId.get(ev.id);
                const hidden = Boolean(row?.hidden);
                const tag = hidden ? 'Hidden' : !builtInIds.has(ev.id) ? 'Added' : row ? 'Edited' : null;
                return (
                  <li key={ev.id} className={`px-4 py-3 flex items-center gap-3 ${hidden ? 'opacity-60' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold leading-snug truncate">{ev.title}</p>
                      <p className="text-[13px] text-[var(--app-muted)] truncate">
                        {dayLabel(ev.startDate)} · {ev.startTime === 'TBA' ? 'Time TBA' : ev.startTime} · {ev.location}
                      </p>
                      {tag && <span className="mt-1 inline-flex h-5 px-2 rounded-full bg-[var(--app-pressed)] text-[11px] font-bold">{tag}</span>}
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit ${ev.title}`}
                      className="app-press w-9 h-9 rounded-full bg-[var(--app-pressed)] flex items-center justify-center"
                      onClick={() => {
                        setDone('');
                        setEditing({ draft: { ...blank(), ...eventToRow(ev), source_url: row?.source_url ?? null, hidden }, partial: false, builtIn: builtInIds.has(ev.id) });
                      }}
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button type="button" className={`${btn.plain} h-9 px-3`} disabled={busyId === ev.id} onClick={() => setHidden(ev, !hidden)}>
                      {hidden ? 'Show' : 'Hide'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
