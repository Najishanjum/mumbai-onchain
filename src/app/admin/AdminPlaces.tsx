import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ExternalLink, Loader2, MapPin, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePeopleStore } from '../../lib/usePeopleStore';
import { PLACE_CATEGORIES } from '../../data/places';
import { diff, isShortMapLink, parseLocation, proposeEdit, resolveMapLink, reviewEdit, useWaitingEdits, type ContentEdit } from '../../lib/contentEdits';
import { AdminHeading, EmptyState, ErrorLine, Segments, btn, notifyAdmins, timeAgo } from './shared';

type Status = 'pending' | 'live' | 'hidden';

interface Row {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  area: string | null;
  tip: string | null;
  price: string | null;
  added_by_name: string | null;
  status: Status;
  created_at: string;
  reviewed_at: string | null;
}

const TABS: { id: Status; label: string }[] = [
  { id: 'pending', label: 'Waiting' },
  { id: 'live', label: 'Live' },
  { id: 'hidden', label: 'Hidden' },
];

const COLUMNS = 'id, name, category, lat, lng, area, tip, price, added_by_name, status, created_at, reviewed_at';
const field =
  'w-full h-11 px-3.5 rounded-xl bg-[var(--app-bg)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]';
const label = 'block text-[13px] font-bold text-[var(--app-muted)] mb-1';
const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

// How each field reads in a change waiting for review.
const FIELD_NAMES: Record<string, string> = { name: 'Name', category: 'Type', area: 'Area', tip: 'Tip', price: 'Price', lat: 'Location', lng: 'Location' };

/** The pin, on its own row: checking it never lands on Approve or Reject. */
function LocationRow({ lat, lng }: { lat: number; lng: number }) {
  return (
    <a
      href={mapsLink(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      className="app-press mt-3 flex items-center gap-2.5 rounded-2xl bg-[var(--app-pressed)] px-3.5 py-3"
    >
      <MapPin className="w-4 h-4 shrink-0 text-[var(--app-primary)]" aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-bold">Check the pin in Google Maps</span>
        <span className="block text-[12px] text-[var(--app-muted)] tabular-nums">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
      </span>
      <ExternalLink className="w-4 h-4 shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
    </a>
  );
}

/** Change a place's details or pin. Nothing changes on the map until an admin approves it. */
function PlaceEditForm({ p, onCancel, onSent }: { p: Row; onCancel: () => void; onSent: () => void }) {
  const [name, setName] = useState(p.name);
  const [category, setCategory] = useState(p.category);
  const [area, setArea] = useState(p.area ?? '');
  const [tip, setTip] = useState(p.tip ?? '');
  const [price, setPrice] = useState(p.price ?? '');
  const [where, setWhere] = useState(`${p.lat}, ${p.lng}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const loc = parseLocation(where);
  // A short link from the Google Maps app: the server opens it and the field
  // becomes its coordinates.
  const [resolving, setResolving] = useState(false);
  useEffect(() => {
    if (!isShortMapLink(where)) return;
    let live = true;
    setResolving(true);
    void resolveMapLink(where).then((r) => {
      if (!live) return;
      setResolving(false);
      if ('error' in r) setError(r.error);
      else {
        setError('');
        setWhere(`${r.lat}, ${r.lng}`);
      }
    });
    return () => {
      live = false;
    };
  }, [where]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (resolving) return;
    if ('error' in loc) return setError(loc.error);
    if (name.trim().length < 2) return setError('Add a name.');
    const changes = diff(p as unknown as Record<string, unknown>, { name, category, area, tip, price, lat: loc.lat, lng: loc.lng });
    // Moving the pin always sends both halves of it.
    if ('lat' in changes || 'lng' in changes) Object.assign(changes, { lat: loc.lat, lng: loc.lng });
    if (!Object.keys(changes).length) return setError('Nothing changed yet.');
    setBusy(true);
    setError('');
    const err = await proposeEdit('place', p.id, changes);
    setBusy(false);
    if (err) return setError(err);
    notifyAdmins('place_changed', p.name);
    onSent();
  }

  return (
    <form onSubmit={send} className="mt-3 pt-3 border-t border-[var(--app-line)] space-y-3">
      <div>
        <label htmlFor={`pn-${p.id}`} className={label}>
          Name
        </label>
        <input id={`pn-${p.id}`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={field} />
      </div>
      <div>
        <span className={label}>Type</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Type">
          {PLACE_CATEGORIES.filter((c) => c.id !== 'stay').map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`h-8 px-3 rounded-full text-[13px] font-semibold border ${category === c.id ? 'bg-[var(--app-ink)] text-[var(--app-bg)] border-[var(--app-ink)]' : 'border-[var(--app-line)]'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor={`pw-${p.id}`} className={label}>
          Location
        </label>
        <input
          id={`pw-${p.id}`}
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="Google Maps link, or 18.9227, 72.8317"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={field}
        />
        <p className="mt-1 text-[13px] text-[var(--app-muted)]">
          {resolving ? (
            'Reading the short link…'
          ) : 'error' in loc ? (
            loc.error
          ) : (
            <>
              Pin at {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} ·{' '}
              <a href={mapsLink(loc.lat, loc.lng)} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--app-primary)]">
                check it
              </a>
            </>
          )}
        </p>
        <p className="mt-0.5 text-[12px] text-[var(--app-faint)]">In Google Maps, open the place → Share → Copy link, and paste it here. Coordinates work too.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`pa-${p.id}`} className={label}>
            Area
          </label>
          <input id={`pa-${p.id}`} value={area} maxLength={60} onChange={(e) => setArea(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor={`pp-${p.id}`} className={label}>
            Price
          </label>
          <input id={`pp-${p.id}`} value={price} maxLength={40} onChange={(e) => setPrice(e.target.value)} placeholder="₹₹" className={field} />
        </div>
      </div>
      <div>
        <label htmlFor={`pt-${p.id}`} className={label}>
          Tip
        </label>
        <textarea id={`pt-${p.id}`} value={tip} maxLength={200} rows={3} onChange={(e) => setTip(e.target.value)} className={`${field} h-auto py-2.5 resize-none`} />
      </div>
      <ErrorLine text={error} />
      <p className="text-[13px] text-[var(--app-muted)]">The map keeps showing the current version until another admin approves your change in Waiting.</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={btn.plain} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={`${btn.primary} inline-flex items-center justify-center gap-2`} disabled={busy}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Send for review
        </button>
      </div>
    </form>
  );
}

/** A change waiting for review: what it was, what it becomes. */
function ChangeCard({ edit, place, mine, onDone }: { edit: ContentEdit; place: Row | undefined; mine: boolean; onDone: () => void }) {
  const [confirming, setConfirming] = useState<null | 'approve' | 'reject'>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const c = edit.changes;
  const fields = Object.keys(c).filter((k) => k !== 'lng' || !('lat' in c));

  async function answer(approve: boolean) {
    setBusy(true);
    setError('');
    const err = await reviewEdit(edit.id, approve);
    setBusy(false);
    if (err) return setError(err);
    notifyAdmins(approve ? 'place_change_approved' : 'place_change_rejected', place?.name ?? String(c.name ?? 'A place'));
    onDone();
  }

  const show = (k: string, v: unknown) => (k === 'category' ? (PLACE_CATEGORIES.find((x) => x.id === v)?.label ?? String(v)) : String(v ?? '') || '(empty)');
  return (
    <li className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-primary)]/40 p-4">
      <div className="flex items-center gap-2">
        <Pencil className="w-4 h-4 text-[var(--app-primary)]" aria-hidden="true" />
        <h3 className="flex-1 min-w-0 text-[16px] font-extrabold truncate">{place?.name ?? 'A place'}</h3>
      </div>
      <p className="mt-0.5 text-[13px] text-[var(--app-muted)]">
        Change by {mine ? 'you' : edit.proposerName} · {timeAgo(edit.createdAt)}
      </p>
      <ul className="mt-3 space-y-2">
        {fields.map((k) => (
          <li key={k} className="text-[14px] leading-snug">
            <span className="block text-[12px] font-bold text-[var(--app-muted)]">{FIELD_NAMES[k] ?? k}</span>
            {k === 'lat' || k === 'lng' ? (
              <span className="flex flex-wrap items-center gap-1.5">
                {place && (
                  <a href={mapsLink(place.lat, place.lng)} target="_blank" rel="noopener noreferrer" className="text-[var(--app-muted)] line-through tabular-nums">
                    {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                  </a>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-[var(--app-muted)]" aria-hidden="true" />
                <a href={mapsLink(Number(c.lat), Number(c.lng))} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--app-primary)] tabular-nums">
                  {Number(c.lat).toFixed(5)}, {Number(c.lng).toFixed(5)} ↗
                </a>
              </span>
            ) : (
              <span className="block">
                {place && <span className="text-[var(--app-muted)] line-through">{show(k, place[k as keyof Row])}</span>}
                {place && ' → '}
                <b>{show(k, c[k])}</b>
              </span>
            )}
          </li>
        ))}
      </ul>
      <ErrorLine text={error} />
      <div className="mt-4 pt-3 border-t border-[var(--app-line)]">
        {confirming ? (
          <div className="space-y-2">
            <p className="text-[14px]">{confirming === 'approve' ? 'Apply this change to the map now?' : 'Drop this change? The place stays as it is.'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={btn.plain} onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button type="button" className={confirming === 'approve' ? btn.good : btn.danger} disabled={busy} onClick={() => answer(confirming === 'approve')}>
                {confirming === 'approve' ? 'Yes, apply' : 'Yes, drop'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={btn.plain} onClick={() => setConfirming('reject')}>
              Reject
            </button>
            <button type="button" className={btn.good} onClick={() => setConfirming('approve')}>
              Approve
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

/** Review places people added (approve, reject, hide, restore, delete) and changes to them. */
export function AdminPlaces({ onChanged }: { onChanged: () => void }) {
  const { authUser } = usePeopleStore();
  const [tab, setTab] = useState<Status>('pending');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  // One confirm at a time: approve, reject, hide or delete, on one place.
  const [confirm, setConfirm] = useState<{ id: string; action: 'live' | 'hidden' | 'delete' } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [sentFor, setSentFor] = useState<string | null>(null);
  const { items: edits, reload: reloadEdits } = useWaitingEdits('place');
  // The places those changes are for, wherever they are (live, hidden…).
  const [editPlaces, setEditPlaces] = useState<Row[]>([]);
  const editIds = (edits ?? []).map((e) => e.targetId).join(',');
  useEffect(() => {
    if (!editIds) return;
    supabase
      .from('community_places')
      .select(COLUMNS)
      .in('id', editIds.split(','))
      .then(({ data }) => setEditPlaces((data ?? []) as Row[]));
  }, [editIds]);

  const load = useCallback(() => {
    setRows(null);
    supabase
      .from('community_places')
      .select(COLUMNS)
      .eq('status', tab)
      .order('created_at', { ascending: tab === 'pending' })
      .limit(200)
      .then(({ data, error: e }) => {
        if (e) {
          setError('Couldn’t load places. Check your connection, then switch tabs to try again.');
          setRows([]);
        } else {
          setError('');
          setRows(data as Row[]);
        }
      });
  }, [tab]);
  useEffect(load, [load]);

  async function setStatus(row: Row, status: Status) {
    if (!authUser) return;
    setBusyId(row.id);
    setError('');
    const { error: e } = await supabase
      .from('community_places')
      .update({ status, reviewed_by: authUser.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusyId(null);
    setConfirm(null);
    if (e) return setError(`Couldn’t update ${row.name}. Try again.`);
    // First approval: let whoever added it know it's live.
    if (status === 'live' && row.status === 'pending') {
      void supabase.functions.invoke('notify-connection', { body: { approvedPlaceId: row.id } });
    }
    notifyAdmins(
      status === 'live' ? (row.status === 'pending' ? 'place_approved' : 'place_restored') : row.status === 'pending' ? 'place_rejected' : 'place_hidden',
      row.name
    );
    setRows((r) => r?.filter((x) => x.id !== row.id) ?? null);
    onChanged();
  }

  async function remove(row: Row) {
    setBusyId(row.id);
    const { error: e } = await supabase.from('community_places').delete().eq('id', row.id);
    setBusyId(null);
    setConfirm(null);
    if (e) return setError(`Couldn’t delete ${row.name}. Try again.`);
    notifyAdmins('place_deleted', row.name);
    setRows((r) => r?.filter((x) => x.id !== row.id) ?? null);
    onChanged();
  }

  const CONFIRM_TEXT = {
    live: (p: Row) => (p.status === 'pending' ? `Approve ${p.name}? It goes on the map for everyone.` : `Put ${p.name} back on the map?`),
    hidden: (p: Row) => (p.status === 'pending' ? `Reject ${p.name}? It stays off the map.` : `Hide ${p.name} from the map?`),
    delete: (p: Row) => `Delete ${p.name} for good? Its ratings stay but nobody can see them.`,
  };

  return (
    <div>
      <AdminHeading page="places" title="Places" detail="New places and changes stay off the map until one of you approves them." />
      <Segments
        label="Place status"
        value={tab}
        options={TABS}
        onChange={(t) => {
          setTab(t);
          setEditing(null);
          setConfirm(null);
        }}
      />
      <ErrorLine text={error} />

      {tab === 'pending' && edits && edits.length > 0 && (
        <section className="mb-5">
          <h3 className="px-5 mb-2 text-[15px] font-bold">Changes waiting · {edits.length}</h3>
          <ul className="mx-4 space-y-3">
            {edits.map((e) => (
              <ChangeCard
                key={e.id}
                edit={e}
                place={editPlaces.find((p) => p.id === e.targetId)}
                mine={e.proposedBy === authUser?.id}
                onDone={() => {
                  reloadEdits();
                  onChanged();
                }}
              />
            ))}
          </ul>
          {rows && rows.length > 0 && <h3 className="px-5 mt-6 mb-2 text-[15px] font-bold">New places · {rows.length}</h3>}
        </section>
      )}

      {rows === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading places" />
        </div>
      ) : rows.length === 0 ? (
        tab === 'pending' && edits?.length ? null : (
          <EmptyState
            title={tab === 'pending' ? 'Nothing waiting' : tab === 'live' ? 'No added places yet' : 'Nothing hidden'}
            body={tab === 'pending' ? 'New places and changes show up here as soon as someone adds one.' : 'Places move here when you change their status.'}
          />
        )
      ) : (
        <ul className="mx-4 space-y-3">
          {rows.map((p) => {
            const cat = PLACE_CATEGORIES.find((c) => c.id === p.category);
            const busy = busyId === p.id;
            const asking = confirm?.id === p.id ? confirm.action : null;
            const changeWaiting = (edits ?? []).some((e) => e.targetId === p.id);
            return (
              <li key={p.id} className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 w-3 h-3 rounded-full shrink-0" style={{ background: cat?.color ?? 'var(--app-muted)' }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[17px] font-extrabold leading-snug">{p.name}</h3>
                    <p className="text-[14px] text-[var(--app-muted)]">
                      {cat?.label ?? p.category}
                      {p.area ? ` · ${p.area}` : ''}
                      {p.price ? ` · ${p.price}` : ''}
                    </p>
                    {p.tip && <p className="mt-2 text-[15px] leading-snug">“{p.tip}”</p>}
                    <p className="mt-2 text-[13px] text-[var(--app-muted)]">
                      Added by {p.added_by_name ?? 'someone'} · {timeAgo(p.created_at)}
                    </p>
                  </div>
                </div>
                <LocationRow lat={p.lat} lng={p.lng} />
                {(changeWaiting || sentFor === p.id) && (
                  <p className="mt-2 text-[13px] font-bold text-[var(--app-primary)]">A change to this place is waiting for review.</p>
                )}

                {editing === p.id ? (
                  <PlaceEditForm
                    p={p}
                    onCancel={() => setEditing(null)}
                    onSent={() => {
                      setEditing(null);
                      setSentFor(p.id);
                      reloadEdits();
                    }}
                  />
                ) : asking ? (
                  <div className="mt-4 pt-3 border-t border-[var(--app-line)] space-y-2">
                    <p className="text-[14px]">{CONFIRM_TEXT[asking](p)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className={btn.plain} onClick={() => setConfirm(null)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={asking === 'live' ? btn.good : btn.danger}
                        disabled={busy}
                        onClick={() => (asking === 'delete' ? remove(p) : setStatus(p, asking))}
                      >
                        {asking === 'live' ? (p.status === 'pending' ? 'Yes, approve' : 'Yes, put back') : asking === 'delete' ? 'Delete' : p.status === 'pending' ? 'Yes, reject' : 'Yes, hide'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-[var(--app-line)] flex flex-wrap gap-2">
                    {p.status === 'pending' && (
                      <>
                        <button type="button" className={`${btn.good} flex-1`} disabled={busy} onClick={() => setConfirm({ id: p.id, action: 'live' })}>
                          Approve
                        </button>
                        <button type="button" className={`${btn.plain} flex-1`} disabled={busy} onClick={() => setConfirm({ id: p.id, action: 'hidden' })}>
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'live' && (
                      <button type="button" className={`${btn.plain} flex-1`} disabled={busy} onClick={() => setConfirm({ id: p.id, action: 'hidden' })}>
                        Hide from the map
                      </button>
                    )}
                    {p.status === 'hidden' && (
                      <>
                        <button type="button" className={`${btn.good} flex-1`} disabled={busy} onClick={() => setConfirm({ id: p.id, action: 'live' })}>
                          Put on the map
                        </button>
                        <button type="button" className={btn.plain} disabled={busy} onClick={() => setConfirm({ id: p.id, action: 'delete' })}>
                          Delete
                        </button>
                      </>
                    )}
                    <button type="button" className={`${btn.plain} inline-flex items-center gap-1.5`} disabled={busy} onClick={() => setEditing(p.id)}>
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                      Edit
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
