import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
  | 'admin_removed';

/** Tells the other admins what you just did ("Najish approved a place"). Best effort. */
export function notifyAdmins(kind: AdminEventKind, detail: string) {
  void supabase.functions.invoke('notify-connection', { body: { adminEvent: { kind, detail } } });
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

export function AdminHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <header className="px-5 pt-2 pb-4">
      <h2 className="app-title text-[28px] font-bold">{title}</h2>
      {detail && <p className="mt-1 text-[15px] text-[var(--app-muted)]">{detail}</p>}
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
