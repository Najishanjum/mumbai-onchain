import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { History, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Sheet } from '../ui';

// Small pieces shared by the admin tabs.

export interface Overview {
  people: number;
  accounts: number;
  stories_24h: number;
  replies_24h: number;
  places_pending: number;
  places_live: number;
  // Missing until 20261021000000_admin_partners.sql has run.
  partners_pending?: number;
  partners_approved?: number;
  push_people: number;
  push_devices: number;
}

export type AdminEventKind =
  | 'place_approved'
  | 'place_rejected'
  | 'place_hidden'
  | 'place_restored'
  | 'place_deleted'
  | 'story_removed'
  | 'partner_approved'
  | 'partner_rejected'
  | 'partner_reopened'
  | 'partner_deleted'
  | 'broadcast_sent'
  | 'admin_added'
  | 'admin_removed'
  | 'event_added'
  | 'event_updated'
  | 'event_hidden';

/** Smaller actions: kept in the page's history, without a push to the other admins. */
export type AdminLogKind = 'partner_logo' | 'partner_whatsapp' | 'partner_level' | 'partner_leader_removed' | 'request_declined';

export type AdminPage = 'events' | 'places' | 'stories' | 'partners' | 'notify' | 'team';

// "<name> <what>" in the history.
const ACTIONS: Record<AdminEventKind | AdminLogKind | 'request_approved', string> = {
  place_approved: 'approved a place',
  place_rejected: 'rejected a place',
  place_hidden: 'hid a place from the map',
  place_restored: 'put a place back on the map',
  place_deleted: 'deleted a place',
  story_removed: 'took down a story',
  partner_approved: 'approved a community partner',
  partner_rejected: 'rejected a partner application',
  partner_reopened: 'moved a partner back to waiting',
  partner_deleted: 'deleted a partner application',
  partner_logo: 'changed a partner’s logo',
  partner_whatsapp: 'changed a WhatsApp group',
  partner_level: 'set a community’s level',
  partner_leader_removed: 'removed a community leader',
  broadcast_sent: 'sent a notification',
  request_approved: 'approved a message to everyone',
  request_declined: 'declined a message to everyone',
  admin_added: 'added an admin',
  admin_removed: 'removed an admin',
  event_added: 'added an event',
  event_updated: 'changed an event',
  event_hidden: 'hid an event',
};

const pageOf = (kind: string): AdminPage =>
  kind.startsWith('place')
    ? 'places'
    : kind.startsWith('story')
      ? 'stories'
      : kind.startsWith('partner')
        ? 'partners'
        : kind.startsWith('admin')
          ? 'team'
          : kind.startsWith('event')
            ? 'events'
            : 'notify';

/** Keeps the action in its page's history. Best effort. */
export function logAdmin(kind: AdminEventKind | AdminLogKind, detail: string) {
  void supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user;
    if (user) void supabase.from('admin_activity').insert({ actor_id: user.id, page: pageOf(kind), kind, detail: detail.slice(0, 300) });
  });
}

/** Tells the other admins what you just did ("Najish approved a place"), and keeps it in the history. Best effort. */
export function notifyAdmins(kind: AdminEventKind, detail: string) {
  void supabase.functions.invoke('notify-connection', { body: { adminEvent: { kind, detail } } });
  logAdmin(kind, detail);
}

interface ActivityRow {
  id: string;
  actor_name: string;
  kind: string;
  detail: string;
  created_at: string;
}

/** One page's history (or everything, on Overview), newest first. */
function HistorySheet({ page, title, onClose, children }: { page?: AdminPage; title: string; onClose: () => void; children?: ReactNode }) {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (children) return;
    let live = true;
    let q = supabase.from('admin_activity').select('id, actor_name, kind, detail, created_at').order('created_at', { ascending: false }).limit(100);
    if (page) q = q.eq('page', page);
    q.then(({ data, error: e }) => {
      if (!live) return;
      if (e) setError('Couldn’t load the history. Check your connection, or that the admin history migration has run.');
      setRows((data ?? []) as ActivityRow[]);
    });
    return () => {
      live = false;
    };
  }, [page, children]);

  // A page with its own, fuller history (Notify: everything sent).
  if (children) {
    return (
      <Sheet open onClose={onClose} label={`${title} history`}>
        <div className="pt-3 pb-2">
          <h2 className="px-5 mb-4 app-title text-[26px]">{title} history</h2>
          {children}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} label={`${title} history`}>
      <div className="pt-3 pb-2">
        <h2 className="px-5 app-title text-[26px]">{title} history</h2>
        <p className="px-5 mt-1 text-[15px] text-[var(--app-muted)]">{page ? 'What admins did here, newest first.' : 'Everything admins did, newest first.'}</p>
        <ErrorLine text={error} />
        {rows === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-[15px] text-[var(--app-muted)]">Nothing yet. Actions on this page show up here.</p>
        ) : (
          <ul className="mt-3 mx-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
            {rows.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <p className="text-[15px] leading-snug">
                  <b>{r.actor_name || 'An admin'}</b> {ACTIONS[r.kind as keyof typeof ACTIONS] ?? r.kind.replace(/_/g, ' ')}
                </p>
                {r.detail && <p className="mt-0.5 text-[14px] leading-snug text-[var(--app-muted)] line-clamp-2">{r.detail}</p>}
                <p className="mt-1 text-[12px] font-semibold text-[var(--app-faint)]">
                  {timeAgo(r.created_at)} ·{' '}
                  {new Date(r.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}

/** The numbers on Overview (and the waiting count on the Places tab). */
export function useOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let live = true;
    supabase.rpc('admin_overview').then(({ data: d, error: e }) => {
      if (!live) return;
      if (e) setError('Couldn’t load the numbers. Check your connection, or that the admin migration has run.');
      else {
        setError('');
        setData(d as Overview);
      }
    });
    return () => {
      live = false;
    };
  }, [nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, refresh };
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** A page's title, with its history behind the clock icon (Overview: everything). */
export function AdminHeading({ title, detail, page, history }: { title: string; detail?: string; page?: AdminPage; history?: ReactNode }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  return (
    <header className="px-5 pt-2 pb-4">
      <div className="flex items-center gap-3">
        <h2 className="app-title flex-1 text-[28px] font-bold">{title}</h2>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          aria-label={`${title} history`}
          className="app-press shrink-0 w-11 h-11 rounded-full bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center"
        >
          <History className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      {detail && <p className="mt-1 text-[15px] text-[var(--app-muted)]">{detail}</p>}
      {historyOpen && (
        <HistorySheet page={page} title={title} onClose={() => setHistoryOpen(false)}>
          {history}
        </HistorySheet>
      )}
    </header>
  );
}

export function Segments<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="mx-4 mb-4 grid p-1 rounded-full bg-[var(--app-segment)]" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-9 rounded-full text-[14px] font-bold ${value === o.id ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : 'text-[var(--app-muted)]'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-4 rounded-3xl border border-dashed border-[var(--app-line)] px-6 py-10 text-center">
      <p className="text-[17px] font-bold">{title}</p>
      <p className="mt-1 text-[14px] text-[var(--app-muted)]">{body}</p>
    </div>
  );
}

export function ErrorLine({ text }: { text: string }) {
  if (!text) return null;
  return <p className="mx-4 mb-3 text-[14px] text-[var(--app-live)]">{text}</p>;
}

export const btn = {
  primary: 'app-press h-10 px-4 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[14px] font-bold disabled:opacity-50',
  plain: 'app-press h-10 px-4 rounded-full bg-[var(--app-pressed)] text-[14px] font-bold disabled:opacity-50',
  danger: 'app-press h-10 px-4 rounded-full bg-[var(--app-live)] text-white text-[14px] font-bold disabled:opacity-50',
  good: 'app-press h-10 px-4 rounded-full bg-[#3CC48C] text-[#06130D] text-[14px] font-bold disabled:opacity-50',
};
