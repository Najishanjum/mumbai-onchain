import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePeopleStore } from '../../lib/usePeopleStore';
import { PLACE_CATEGORIES } from '../../data/places';
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

/** Review places people added: approve, reject, hide, restore or delete. */
export function AdminPlaces({ onChanged }: { onChanged: () => void }) {
  const { authUser } = usePeopleStore();
  const [tab, setTab] = useState<Status>('pending');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(null);
    supabase
      .from('community_places')
      .select('id, name, category, lat, lng, area, tip, price, added_by_name, status, created_at, reviewed_at')
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
    setConfirmDelete(null);
    if (e) return setError(`Couldn’t delete ${row.name}. Try again.`);
    notifyAdmins('place_deleted', row.name);
    setRows((r) => r?.filter((x) => x.id !== row.id) ?? null);
    onChanged();
  }

  return (
    <div>
      <AdminHeading page="places" title="Places" detail="New places stay off the map until one of you approves them." />
      <Segments label="Place status" value={tab} options={TABS} onChange={setTab} />
      <ErrorLine text={error} />

      {rows === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading places" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'Nothing waiting' : tab === 'live' ? 'No added places yet' : 'Nothing hidden'}
          body={tab === 'pending' ? 'New places show up here as soon as someone adds one.' : 'Places move here when you change their status.'}
        />
      ) : (
        <ul className="mx-4 space-y-3">
          {rows.map((p) => {
            const cat = PLACE_CATEGORIES.find((c) => c.id === p.category);
            const busy = busyId === p.id;
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
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[14px] font-bold text-[var(--app-primary)]"
                    >
                      Check the pin in Google Maps <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                {confirmDelete === p.id ? (
                  <div className="mt-3 pt-3 border-t border-[var(--app-line)]">
                    <p className="text-[14px] text-[var(--app-muted)]">Delete {p.name} for good? Its ratings stay but nobody can see them.</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" className={btn.plain} onClick={() => setConfirmDelete(null)}>
                        Keep it
                      </button>
                      <button type="button" className={btn.danger} disabled={busy} onClick={() => remove(p)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.status === 'pending' && (
                      <>
                        <button type="button" className={`${btn.good} flex-1`} disabled={busy} onClick={() => setStatus(p, 'live')}>
                          Approve
                        </button>
                        <button type="button" className={`${btn.plain} flex-1`} disabled={busy} onClick={() => setStatus(p, 'hidden')}>
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'live' && (
                      <button type="button" className={`${btn.plain} flex-1`} disabled={busy} onClick={() => setStatus(p, 'hidden')}>
                        Hide from the map
                      </button>
                    )}
                    {p.status === 'hidden' && (
                      <>
                        <button type="button" className={`${btn.good} flex-1`} disabled={busy} onClick={() => setStatus(p, 'live')}>
                          Put on the map
                        </button>
                        <button type="button" className={btn.plain} disabled={busy} onClick={() => setConfirmDelete(p.id)}>
                          Delete
                        </button>
                      </>
                    )}
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
