import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Loader2, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePeopleStore } from '../../lib/usePeopleStore';
import { AdminHeading, EmptyState, ErrorLine, Segments, btn, notifyAdmins, timeAgo, type AdminEventKind } from './shared';

type Status = 'pending' | 'approved' | 'rejected';

interface Row {
  id: string;
  community_name: string;
  community_logo_url: string;
  community_description: string;
  lead_name: string;
  email: string;
  phone: string;
  website_url: string | null;
  x_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  telegram_url: string | null;
  discord_url: string | null;
  status: Status;
  created_at: string;
}

const TABS: { id: Status; label: string }[] = [
  { id: 'pending', label: 'Waiting' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const LINKS: { key: keyof Row; label: string }[] = [
  { key: 'website_url', label: 'Website' },
  { key: 'x_url', label: 'X' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'linkedin_url', label: 'LinkedIn' },
  { key: 'telegram_url', label: 'Telegram' },
  { key: 'discord_url', label: 'Discord' },
];

// Applicants type these, so only real web links become links.
const webUrl = (u: string | null) => (u && /^https?:\/\//i.test(u.trim()) ? u.trim() : null);

/** Community partner applications from the website: approve, reject, or delete. */
export function AdminPartners({ onChanged }: { onChanged: () => void }) {
  const { authUser } = usePeopleStore();
  const [tab, setTab] = useState<Status>('pending');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(null);
    supabase
      .from('community_partner_applications')
      .select(
        'id, community_name, community_logo_url, community_description, lead_name, email, phone, website_url, x_url, instagram_url, linkedin_url, telegram_url, discord_url, status, created_at'
      )
      .eq('status', tab)
      .order('created_at', { ascending: tab === 'pending' })
      .limit(200)
      .then(({ data, error: e }) => {
        if (e) {
          setError('Couldn’t load applications. Check your connection, then switch tabs to try again.');
          setRows([]);
        } else {
          setError('');
          setRows(data as Row[]);
        }
      });
  }, [tab]);
  useEffect(load, [load]);

  async function setStatus(row: Row, status: Status, event: AdminEventKind) {
    if (!authUser) return;
    setBusyId(row.id);
    setError('');
    const now = new Date().toISOString();
    const { error: e } = await supabase
      .from('community_partner_applications')
      .update({ status, reviewed_by: authUser.id, reviewed_at: now, updated_at: now })
      .eq('id', row.id);
    setBusyId(null);
    if (e) return setError(`Couldn’t update ${row.community_name}. Try again.`);
    notifyAdmins(event, row.community_name);
    setRows((r) => r?.filter((x) => x.id !== row.id) ?? null);
    onChanged();
  }

  async function remove(row: Row) {
    setBusyId(row.id);
    const { error: e } = await supabase.from('community_partner_applications').delete().eq('id', row.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (e) return setError(`Couldn’t delete ${row.community_name}. Try again.`);
    // The logo too, when it's in our bucket.
    const logo = row.community_logo_url.split('/community-logos/')[1];
    if (logo) void supabase.storage.from('community-logos').remove([decodeURIComponent(logo.split('?')[0])]);
    notifyAdmins('partner_deleted', row.community_name);
    setRows((r) => r?.filter((x) => x.id !== row.id) ?? null);
    onChanged();
  }

  return (
    <div>
      <AdminHeading title="Partners" detail="Communities that applied on the website. Approved ones show in its partners section." />
      <Segments label="Application status" value={tab} options={TABS} onChange={setTab} />
      <ErrorLine text={error} />

      {rows === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading applications" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'Nothing waiting' : tab === 'approved' ? 'No partners yet' : 'Nothing rejected'}
          body={tab === 'pending' ? 'New applications show up here, and you get a notification.' : 'Applications move here when you change their status.'}
        />
      ) : (
        <ul className="mx-4 space-y-3">
          {rows.map((p) => {
            const busy = busyId === p.id;
            const links = LINKS.map((l) => ({ label: l.label, href: webUrl(p[l.key] as string | null) })).filter((l) => l.href);
            return (
              <li key={p.id} className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
                <div className="flex items-start gap-3">
                  {webUrl(p.community_logo_url) ? (
                    <img src={p.community_logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover bg-white shrink-0" />
                  ) : (
                    <span className="w-14 h-14 rounded-2xl bg-[var(--app-pressed)] shrink-0" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[17px] font-extrabold leading-snug">{p.community_name}</h3>
                    <p className="text-[13px] text-[var(--app-muted)]">
                      {p.lead_name} · {timeAgo(p.created_at)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[15px] leading-snug whitespace-pre-line">{p.community_description}</p>

                {/* Contact, then links, then a clear gap before the decision
                    buttons, so tapping a link never lands on Approve. */}
                <div className="mt-4 rounded-2xl bg-[var(--app-pressed)] divide-y divide-[var(--app-line)] overflow-hidden">
                  <a href={`mailto:${p.email}`} className="app-press flex items-center gap-3 px-3.5 h-12 text-[15px] font-semibold">
                    <Mail className="w-[18px] h-[18px] shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
                    <span className="truncate">{p.email}</span>
                  </a>
                  <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`} className="app-press flex items-center gap-3 px-3.5 h-12 text-[15px] font-semibold">
                    <Phone className="w-[18px] h-[18px] shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
                    <span className="truncate">{p.phone}</span>
                  </a>
                </div>
                {links.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {links.map((l) => (
                      <a
                        key={l.label}
                        href={l.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-press h-10 px-2 rounded-xl border border-[var(--app-line)] text-[13px] font-bold inline-flex items-center justify-center gap-1"
                      >
                        <span className="truncate">{l.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[var(--app-muted)]" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}

                {confirmDelete === p.id ? (
                  <div className="mt-5 pt-4 border-t border-[var(--app-line)]">
                    <p className="text-[14px] text-[var(--app-muted)]">Delete {p.community_name}’s application and logo for good?</p>
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
                  <div className="mt-5 pt-4 border-t border-[var(--app-line)] flex flex-wrap gap-2">
                    {p.status === 'pending' && (
                      <>
                        <button type="button" className={`${btn.good} flex-1`} disabled={busy} onClick={() => setStatus(p, 'approved', 'partner_approved')}>
                          Approve
                        </button>
                        <button type="button" className={`${btn.plain} flex-1`} disabled={busy} onClick={() => setStatus(p, 'rejected', 'partner_rejected')}>
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'approved' && (
                      <button type="button" className={`${btn.plain} flex-1`} disabled={busy} onClick={() => setStatus(p, 'pending', 'partner_reopened')}>
                        Take off the website
                      </button>
                    )}
                    {p.status === 'rejected' && (
                      <>
                        <button type="button" className={`${btn.plain} flex-1`} disabled={busy} onClick={() => setStatus(p, 'pending', 'partner_reopened')}>
                          Move to waiting
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
