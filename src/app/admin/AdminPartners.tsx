import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Loader2, Mail, Phone, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePeopleStore } from '../../lib/usePeopleStore';
import { CoLeadCard } from '../CommunitySheet';
import { LEVELS, useCommunityLevels } from '../../lib/useCommunities';
import { uploadCommunityLogo } from '../../lib/communityPartner';
import { AdminHeading, EmptyState, ErrorLine, Segments, btn, logAdmin, notifyAdmins, timeAgo, type AdminEventKind } from './shared';

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
  whatsapp_url: string | null;
  /** Set by hand, wins over the count; null: from the count. */
  level_override: number | null;
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
  { key: 'whatsapp_url', label: 'WhatsApp' },
];

const WHATSAPP_GROUP = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;

// Applicants type these, so only real web links become links.
const webUrl = (u: string | null) => (u && /^https?:\/\//i.test(u.trim()) ? u.trim() : null);

/** Community partner applications from the website: approve, reject, or delete. */
export function AdminPartners({ onChanged }: { onChanged: () => void }) {
  const { authUser, people } = usePeopleStore();
  const [tab, setTab] = useState<Status>('pending');
  // Approved partners: who leads them and how many joined.
  const [members, setMembers] = useState<{ community_id: string; user_id: string; profile_id: string; role: string; credited: boolean }[]>([]);
  const [leaderCodeFor, setLeaderCodeFor] = useState<string | null>(null);
  const loadMembers = useCallback(() => {
    supabase
      .from('community_members')
      .select('community_id, user_id, profile_id, role, credited')
      .then(({ data }) => setMembers(data ?? []));
  }, []);
  useEffect(() => {
    if (tab === 'approved') loadMembers();
  }, [tab, loadMembers]);

  async function removeLeader(row: Row, userId: string, name: string) {
    setBusyId(row.id);
    const { error: e } = await supabase.from('community_members').delete().eq('community_id', row.id).eq('user_id', userId);
    setBusyId(null);
    if (e) return setError(`Couldn’t remove ${name}. Try again.`);
    logAdmin('partner_leader_removed', `${name}, ${row.community_name}`);
    loadMembers();
  }
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [waEdit, setWaEdit] = useState<{ id: string; value: string } | null>(null);
  const { levelOf, refresh: refreshLevels } = useCommunityLevels();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = (rows ?? []).filter((p) => !q || [p.community_name, p.lead_name, p.email].some((f) => f?.toLowerCase().includes(q)));

  const load = useCallback(() => {
    setRows(null);
    supabase
      .from('community_partner_applications')
      .select(
        'id, community_name, community_logo_url, community_description, lead_name, email, phone, website_url, x_url, instagram_url, linkedin_url, telegram_url, discord_url, whatsapp_url, level_override, status, created_at'
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

  /** Partners send their group link in the partners chat; an admin pastes it here. */
  /** A new logo from an admin (e.g. the partner sent a better one in the chat). */
  async function changeLogo(row: Row, file: File) {
    setBusyId(row.id);
    setError('');
    const up = await uploadCommunityLogo(file);
    if (!up.success || !up.url) {
      setBusyId(null);
      return setError(up.error ?? `Couldn’t upload ${row.community_name}’s logo. Try again.`);
    }
    const { error: e } = await supabase
      .from('community_partner_applications')
      .update({ community_logo_url: up.url, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusyId(null);
    if (e) return setError(`Couldn’t save ${row.community_name}’s logo. Try again.`);
    logAdmin('partner_logo', row.community_name);
    // The old file, when it's in our bucket.
    const old = row.community_logo_url.split('/community-logos/')[1];
    if (old) void supabase.storage.from('community-logos').remove([decodeURIComponent(old.split('?')[0])]);
    setRows((r) => r?.map((x) => (x.id === row.id ? { ...x, community_logo_url: up.url! } : x)) ?? null);
  }

  async function saveWhatsapp(row: Row, value: string) {
    const url = value.trim().split('?')[0].replace(/^(?!https:\/\/)/, value.trim() ? 'https://' : '').replace(/\/+$/, '');
    if (url && !WHATSAPP_GROUP.test(url)) return setError('Paste a WhatsApp group invite link, like chat.whatsapp.com/AbC123…');
    setBusyId(row.id);
    setError('');
    const { error: e } = await supabase
      .from('community_partner_applications')
      .update({ whatsapp_url: url, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusyId(null);
    if (e) return setError(`Couldn’t save ${row.community_name}’s WhatsApp group. Try again.`);
    logAdmin('partner_whatsapp', url ? row.community_name : `${row.community_name} (removed)`);
    setWaEdit(null);
    setRows((r) => r?.map((x) => (x.id === row.id ? { ...x, whatsapp_url: url } : x)) ?? null);
  }

  /** A level by hand for special cases, or back to the count (null). */
  async function saveLevel(row: Row, level: number | null) {
    setBusyId(row.id);
    setError('');
    const { error: e } = await supabase
      .from('community_partner_applications')
      .update({ level_override: level, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusyId(null);
    if (e) return setError(`Couldn’t change ${row.community_name}’s level. Try again.`);
    logAdmin('partner_level', `${row.community_name}: ${level === null ? 'by count' : LEVELS[level].name}`);
    setRows((r) => r?.map((x) => (x.id === row.id ? { ...x, level_override: level } : x)) ?? null);
    void refreshLevels();
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
      <AdminHeading page="partners" title="Partners" detail="Communities that applied on the website. Approved ones show in its partners section." />
      <Segments label="Application status" value={tab} options={TABS} onChange={setTab} />
      {rows !== null && rows.length > 0 && (
        <div className="mx-4 mb-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-muted)]" aria-hidden="true" />
          <label htmlFor="partner-search" className="sr-only">
            Search partners
          </label>
          <input
            id="partner-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by community, lead or email"
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]"
          />
        </div>
      )}
      <ErrorLine text={error} />

      {rows === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading applications" />
        </div>
      ) : rows.length > 0 && shown.length === 0 ? (
        <EmptyState title="No partners match" body="Try part of the community’s name, the lead’s name or their email." />
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'Nothing waiting' : tab === 'approved' ? 'No partners yet' : 'Nothing rejected'}
          body={tab === 'pending' ? 'New applications show up here, and you get a notification.' : 'Applications move here when you change their status.'}
        />
      ) : (
        <ul className="mx-4 space-y-3">
          {shown.map((p) => {
            const busy = busyId === p.id;
            const links = LINKS.map((l) => ({ label: l.label, href: webUrl(p[l.key] as string | null) })).filter((l) => l.href);
            return (
              <li key={p.id} className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
                <div className="flex items-start gap-3">
                  {webUrl(p.community_logo_url) ? (
                    <img src={p.community_logo_url} alt="" className="w-14 h-14 p-1 rounded-2xl object-contain bg-white shrink-0" />
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

                {p.status === 'approved' &&
                  (() => {
                    const here = members.filter((m) => m.community_id === p.id);
                    const leaders = here.filter((m) => m.role === 'lead');
                    const counted = here.filter((m) => m.role === 'member' && m.credited).length;
                    return (
                      <div className="mt-3 rounded-2xl border border-[var(--app-line)] p-3">
                        <p className="text-[13px] text-[var(--app-muted)]">
                          {here.length - leaders.length} member{here.length - leaders.length === 1 ? '' : 's'} · {counted} counted for them
                        </p>
                        <p className="mt-2 text-[13px] font-bold">Leaders</p>
                        {leaders.length === 0 ? (
                          <p className="text-[14px] text-[var(--app-muted)]">None linked yet. They link by signing in with {p.email}, or with a leader code.</p>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {leaders.map((l) => {
                              const name = people.find((x) => x.id === l.profile_id)?.name ?? 'Someone';
                              return (
                                <li key={l.user_id} className="flex items-center gap-2 text-[15px]">
                                  <span className="flex-1 truncate">{name}</span>
                                  <button type="button" className="h-8 px-3 rounded-full text-[13px] font-semibold text-[var(--app-muted)]" disabled={busy} onClick={() => removeLeader(p, l.user_id, name)}>
                                    Remove
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <p className="mt-3 text-[13px] font-bold">
                          Level: {LEVELS[levelOf(p.id).level].name} · {levelOf(p.id).counted} with a photo or headline
                        </p>
                        <div role="radiogroup" aria-label={`${p.community_name} level`} className="mt-1.5 flex flex-wrap gap-1.5">
                          {[null, 0, 1, 2, 3].map((lv) => (
                            <button
                              key={String(lv)}
                              type="button"
                              role="radio"
                              aria-checked={p.level_override === lv}
                              disabled={busy}
                              onClick={() => saveLevel(p, lv)}
                              className={`h-8 px-3 rounded-full text-[13px] font-semibold border ${
                                p.level_override === lv ? 'bg-[var(--app-ink)] text-[var(--app-bg)] border-[var(--app-ink)]' : 'border-[var(--app-line)]'
                              }`}
                            >
                              {lv === null ? 'By count' : LEVELS[lv].name}
                            </button>
                          ))}
                        </div>
                        {leaderCodeFor === p.id ? (
                          <div className="mt-2">
                            <CoLeadCard c={{ id: p.id, community_name: p.community_name }} />
                          </div>
                        ) : (
                          <button type="button" className="app-press mt-1 h-9 text-[13px] font-bold text-[var(--app-primary)]" onClick={() => setLeaderCodeFor(p.id)}>
                            + Add a leader with a code
                          </button>
                        )}
                      </div>
                    );
                  })()}

                {waEdit?.id === p.id ? (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveWhatsapp(p, waEdit.value);
                    }}
                  >
                    <input
                      autoFocus
                      type="url"
                      inputMode="url"
                      aria-label={`${p.community_name} WhatsApp group link`}
                      value={waEdit.value}
                      onChange={(e) => setWaEdit({ id: p.id, value: e.target.value })}
                      placeholder="chat.whatsapp.com/…"
                      className="min-w-0 flex-1 h-10 px-3 rounded-xl bg-[var(--app-pressed)] border border-[var(--app-line)] text-[15px]"
                    />
                    <button type="submit" className={btn.good} disabled={busy}>
                      Save
                    </button>
                    <button type="button" className={btn.plain} onClick={() => setWaEdit(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="app-press mt-2 h-10 px-3 rounded-xl text-[13px] font-bold text-[var(--app-muted)]"
                    onClick={() => setWaEdit({ id: p.id, value: p.whatsapp_url ?? '' })}
                  >
                    {p.whatsapp_url ? 'Change WhatsApp group' : '+ Add WhatsApp group'}
                  </button>
                )}
                {/* A label around a hidden file input: opens the photo picker on iPhone too. */}
                <label className={`app-press mt-1 h-10 px-3 rounded-xl text-[13px] font-bold text-[var(--app-muted)] inline-flex items-center cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
                  {busy && busyId === p.id ? 'Uploading…' : 'Change logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) void changeLogo(p, file);
                    }}
                  />
                </label>

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
