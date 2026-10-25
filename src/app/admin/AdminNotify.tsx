import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePeopleStore } from '../../lib/usePeopleStore';
import { useCommunities } from '../../lib/useCommunities';
import { reviewMessage, shortAgo, useAnnouncementReads, useBroadcasts, whatsAppText, type Broadcast } from '../../lib/useBroadcasts';
import { CommunityLogo } from '../CommunitySheet';
import { AdminHeading, EmptyState, ErrorLine, Segments, btn, logAdmin, notifyAdmins } from './shared';

// Where tapping the notification opens.
const DESTINATIONS = [
  { id: '/?open=map', label: 'Map' },
  { id: '/', label: 'Today' },
  { id: '/?tab=events', label: 'Schedule' },
  { id: '/?tab=people', label: 'People' },
] as const;

const field =
  'w-full px-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]';

interface Lead {
  userId: string;
  name: string;
}

/** Every community lead (once each, even when leading two), with their name. */
function useLeads(enabled: boolean): Lead[] | null {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  useEffect(() => {
    if (!enabled || leads) return;
    void (async () => {
      const { data } = await supabase.from('community_members').select('user_id, profile_id').eq('role', 'lead');
      const rows = [...new Map((data ?? []).map((r) => [r.user_id as string, r.profile_id as string])).entries()];
      const { data: profiles } = rows.length ? await supabase.from('profiles').select('id, name').in('id', rows.map(([, p]) => p)) : { data: [] };
      const nameOf = new Map((profiles ?? []).map((p) => [p.id as string, p.name as string]));
      setLeads(rows.map(([userId, profileId]) => ({ userId, name: nameOf.get(profileId) || 'A lead' })));
    })();
  }, [enabled, leads]);
  return leads;
}

/** Puts the message on the clipboard for the leads' WhatsApp group. */
function CopyForWhatsApp({ b }: { b: Pick<Broadcast, 'title' | 'body'> }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard
          .writeText(whatsAppText(b))
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => undefined)
      }
      className="app-press h-9 px-3.5 rounded-full bg-[#25D366]/15 text-[#1DA851] text-[14px] font-bold inline-flex items-center gap-1.5"
    >
      {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
      {copied ? 'Copied' : 'Copy for WhatsApp'}
    </button>
  );
}

/** Send a push notification to everyone with notifications on (or a test to yourself). */
function SendPanel({ reach, onSent }: { reach: number | null; onSent: () => void }) {
  const { authUser, myProfile } = usePeopleStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState<string>(DESTINATIONS[0].id);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<'test' | 'all' | null>(null);
  // Everyone, or only the leads of partner communities (e.g. "send us your side events").
  const [audience, setAudience] = useState<'everyone' | 'leads'>('everyone');
  const leadIds = useLeads(audience === 'leads')?.map((l) => l.userId) ?? null;
  // The last message to leads, to paste into their WhatsApp group too.
  const [sentToLeads, setSentToLeads] = useState<{ title: string; body: string } | null>(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const ready = title.trim().length > 0;

  async function send(toAll: boolean) {
    if (!ready || !authUser) return;
    setBusy(toAll ? 'all' : 'test');
    setError('');
    setResult('');
    setSentToLeads(null);
    const toLeads = toAll && audience === 'leads';
    if (toLeads && !leadIds?.length) {
      setBusy(null);
      setConfirming(false);
      return setError('No community leads yet.');
    }
    const userIds = !toAll ? [authUser.id] : toLeads ? leadIds! : undefined;
    const { data, error: e } = await supabase.functions.invoke('send-push', {
      body: { title: title.trim(), body: body.trim(), url, tag: toAll ? `broadcast-${Date.now()}` : undefined, ...(userIds ? { userIds } : {}) },
    });
    setBusy(null);
    setConfirming(false);
    if (e || !data) return setError('Couldn’t send. Check your connection, and that send-push is deployed with the admin check.');
    const sent = (data as { sent: number }).sent;
    if (toAll) {
      setResult(`Sent to ${sent} ${sent === 1 ? 'phone' : 'phones'}.`);
      notifyAdmins('broadcast_sent', `“${title.trim()}”, to ${toLeads ? 'community leads, ' : ''}${sent} ${sent === 1 ? 'phone' : 'phones'}`);
      // Kept in the history with the communities' messages. Best effort.
      await supabase.from('broadcasts').insert({
        community_id: null,
        sender_id: authUser.id,
        sender_profile_id: myProfile?.id ?? null,
        title: title.trim(),
        body: body.trim(),
        audience: toLeads ? 'leads' : 'everyone',
        status: 'sent',
        recipients: sent,
        sent_at: new Date().toISOString(),
      });
      onSent();
      if (toLeads) setSentToLeads({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
    } else {
      setResult(sent ? 'Test sent to your phone. Lock it to see how it looks.' : 'This phone has notifications off. Allow them in the app first.');
    }
  }

  return (
    <div>
      <div className="mx-4 space-y-3">
        <div>
          <span className="app-label px-1">To</span>
          <div role="radiogroup" aria-label="To" className="mt-1 grid grid-cols-2 p-1 rounded-full bg-[var(--app-segment)]">
            {(
              [
                ['everyone', 'Everyone'],
                ['leads', 'Community leads'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={audience === id}
                onClick={() => setAudience(id)}
                className={`h-9 rounded-full text-[14px] font-bold ${audience === id ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : 'text-[var(--app-muted)]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {audience === 'leads' && (
            <p className="mt-1.5 px-1 text-[13px] text-[var(--app-muted)]">
              {leadIds === null
                ? 'Counting leads…'
                : `${leadIds.length} lead${leadIds.length === 1 ? '' : 's'} of partner communities. It stays in their notifications and lead mode until they tap Got it; History shows who has.`}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="notify-title" className="app-label px-1">
            Title
          </label>
          <input id="notify-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="New on the map 📍" className={`${field} mt-1 h-12`} />
        </div>
        <div>
          <label htmlFor="notify-body" className="app-label px-1">
            Message
          </label>
          <textarea
            id="notify-body"
            value={body}
            maxLength={240}
            rows={3}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add your favourite spots for everyone"
            className={`${field} mt-1 py-3 resize-none`}
          />
        </div>
        <div>
          <span className="app-label px-1">Opens</span>
          <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Opens">
            {DESTINATIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={url === d.id}
                onClick={() => setUrl(d.id)}
                className={`app-press h-9 px-3.5 rounded-full border text-[14px] font-semibold ${
                  url === d.id ? 'bg-[var(--app-ink)] text-[var(--app-bg)] border-[var(--app-ink)]' : 'bg-[var(--app-surface)] border-[var(--app-line)]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* How it looks on a lock screen. */}
      <div className="mx-4 mt-5">
        <span className="app-label px-1">Preview</span>
        <div className="mt-1 rounded-[22px] p-3.5 bg-[var(--app-pressed)] flex gap-3">
          <img src="/icons/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2 text-[13px] text-[var(--app-muted)]">
              <span className="font-semibold">MUMBAI ONCHAIN</span>
              <span>now</span>
            </div>
            <p className="text-[15px] font-bold leading-snug truncate">{title.trim() || 'New on the map 📍'}</p>
            <p className="text-[15px] leading-snug line-clamp-2">{body.trim() || 'Add your favourite spots for everyone'}</p>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-5 space-y-2">
        {result && <p className="text-[14px] font-semibold text-[#3CC48C]">{result}</p>}
        {sentToLeads && (
          <div className="flex items-center gap-3">
            <p className="flex-1 text-[14px] text-[var(--app-muted)]">Post the same in the leads’ WhatsApp group:</p>
            <CopyForWhatsApp b={sentToLeads} />
          </div>
        )}
        {error && <p className="text-[14px] text-[var(--app-live)]">{error}</p>}
        {confirming ? (
          <div className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
            <p className="text-[15px]">
              Send this to{' '}
              {audience === 'leads'
                ? `all ${leadIds?.length ?? ''} community leads`
                : reach === null
                  ? 'everyone with notifications on'
                  : `${reach} ${reach === 1 ? 'person' : 'people'}`}
              ? It can’t be taken back.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className={btn.plain} onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button type="button" className={`${btn.primary} inline-flex items-center justify-center gap-2`} disabled={busy !== null} onClick={() => send(true)}>
                {busy === 'all' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Send now
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={`${btn.plain} inline-flex items-center justify-center gap-2`} disabled={!ready || busy !== null} onClick={() => send(false)}>
              {busy === 'test' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Send test to me
            </button>
            <button type="button" className={btn.primary} disabled={!ready || busy !== null} onClick={() => setConfirming(true)}>
              {audience === 'leads' ? 'Send to leads' : 'Send to everyone'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Who a message is from: a community's logo and name, or the team. */
function From({ b, name, logo }: { b: Broadcast; name: string; logo?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {b.communityId ? (
        <CommunityLogo c={{ community_name: name, community_logo_url: logo ?? '' }} size={32} />
      ) : (
        <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg" />
      )}
      <span className="flex-1 min-w-0 text-[14px] font-bold truncate">{name}</span>
      <span className="text-[13px] text-[var(--app-muted)]">{shortAgo(b.sentAt ?? b.createdAt)}</span>
    </div>
  );
}

/** Communities asking to message everyone: send it, or decline with a note. */
function Requests({ items, nameOf, logoOf, onDone }: { items: Broadcast[]; nameOf: (b: Broadcast) => string; logoOf: (b: Broadcast) => string | undefined; onDone: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declining, setDeclining] = useState<{ id: string; note: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  async function answer(b: Broadcast, decision: 'approve' | 'reject', note = '') {
    setBusyId(b.id);
    setError('');
    const res = await reviewMessage(b.id, decision, note);
    setBusyId(null);
    setConfirming(null);
    setDeclining(null);
    if ('error' in res) return setError(res.error);
    setResult(decision === 'approve' ? `Sent “${b.title}” to ${res.recipients} phones. ${nameOf(b)} got a notification.` : `Declined. ${nameOf(b)} got a notification.`);
    if (decision === 'approve') notifyAdmins('broadcast_sent', `“${b.title}” from ${nameOf(b)}, to ${res.recipients} phones`);
    else logAdmin('request_declined', `“${b.title}” from ${nameOf(b)}${note ? ` · ${note}` : ''}`);
    onDone();
  }

  if (!items.length) return <EmptyState title="No requests" body="When a community lead asks to message everyone, it waits here, and you get a notification." />;
  return (
    <div className="mx-4 space-y-3">
      {result && <p role="status" className="text-[14px] font-semibold text-[#3CC48C]">{result}</p>}
      <ErrorLine text={error} />
      {items.map((b) => (
        <div key={b.id} className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4 space-y-3">
          <From b={b} name={nameOf(b)} logo={logoOf(b)} />
          <div>
            <p className="text-[16px] font-bold leading-snug">{b.title}</p>
            {b.body && <p className="mt-0.5 text-[15px] leading-snug whitespace-pre-line">{b.body}</p>}
          </div>
          {declining?.id === b.id ? (
            <div className="space-y-2">
              <label htmlFor={`note-${b.id}`} className="text-[13px] font-bold text-[var(--app-muted)]">
                Note for the lead (optional)
              </label>
              <input id={`note-${b.id}`} value={declining.note} maxLength={200} onChange={(e) => setDeclining({ id: b.id, note: e.target.value })} placeholder="Send this to your members instead" className={`${field} h-11`} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={btn.plain} onClick={() => setDeclining(null)}>Back</button>
                <button type="button" className={btn.danger} disabled={busyId === b.id} onClick={() => answer(b, 'reject', declining.note)}>Decline</button>
              </div>
            </div>
          ) : confirming === b.id ? (
            <div className="space-y-2">
              <p className="text-[14px]">Send this to everyone with notifications on, as “{nameOf(b)}: {b.title}”? It can’t be taken back.</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={btn.plain} onClick={() => setConfirming(null)}>Cancel</button>
                <button type="button" className={`${btn.good} inline-flex items-center justify-center gap-2`} disabled={busyId === b.id} onClick={() => answer(b, 'approve')}>
                  {busyId === b.id && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  Send now
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--app-line)]">
              <button type="button" className={btn.plain} onClick={() => setDeclining({ id: b.id, note: '' })}>Decline</button>
              <button type="button" className={btn.good} onClick={() => setConfirming(b.id)}>Approve</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** An announcement to leads: how many tapped Got it, and who hasn't. */
function LeadsSeen({ b, leads, seen }: { b: Broadcast; leads: Lead[] | null; seen: Set<string> | undefined }) {
  const [open, setOpen] = useState(false);
  if (!leads) return null;
  const missing = leads.filter((l) => !seen?.has(l.userId));
  const count = leads.length - missing.length;
  return (
    <div className="pt-1 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={!missing.length}
          aria-expanded={open}
          className={`h-9 px-3.5 rounded-full text-[14px] font-bold ${missing.length ? 'app-press bg-[var(--app-pressed)]' : 'bg-[#3CC48C]/15 text-[#3CC48C]'}`}
        >
          {count} of {leads.length} seen{missing.length ? (open ? ' ▴' : ' ▾') : ' ✓'}
        </button>
        <CopyForWhatsApp b={b} />
      </div>
      {open && missing.length > 0 && <p className="text-[14px] text-[var(--app-muted)]">Not yet: {missing.map((l) => l.name).join(', ')}</p>}
    </div>
  );
}

/** Every notification that went to people, newest first. */
function History({ items, nameOf, logoOf }: { items: Broadcast[]; nameOf: (b: Broadcast) => string; logoOf: (b: Broadcast) => string | undefined }) {
  const toLeads = items.filter((b) => b.audience === 'leads' && b.status === 'sent');
  const leads = useLeads(toLeads.length > 0);
  const reads = useAnnouncementReads(toLeads.map((b) => b.id));
  if (!items.length) return <EmptyState title="Nothing sent yet" body="Notifications from Notify and from communities show up here." />;
  return (
    <ul className="mx-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
      {items.map((b) => (
        <li key={b.id} className="px-4 py-3 space-y-1.5">
          <From b={b} name={nameOf(b)} logo={logoOf(b)} />
          <p className="text-[15px] font-semibold leading-snug">{b.title}</p>
          {b.body && <p className="text-[14px] leading-snug text-[var(--app-muted)] line-clamp-2">{b.body}</p>}
          <p className="text-[12px] font-bold text-[var(--app-muted)]">
            {b.status === 'rejected'
              ? `Declined${b.reviewNote ? ` · “${b.reviewNote}”` : ''}`
              : `${b.audience === 'everyone' ? 'Everyone' : b.audience === 'leads' ? 'Community leads' : 'Members'} · reached ${b.recipients} ${b.recipients === 1 ? 'phone' : 'phones'}`}
          </p>
          {b.audience === 'leads' && b.status === 'sent' && <LeadsSeen b={b} leads={leads} seen={reads[b.id]} />}
        </li>
      ))}
    </ul>
  );
}

/** Admin → Notify: send to everyone and answer communities' requests; everything sent is behind the clock icon. */
export function AdminNotify({ reach }: { reach: number | null }) {
  const { items, reload } = useBroadcasts('all', 150);
  const { communities } = useCommunities(null, null);
  const [tab, setTab] = useState<'send' | 'requests'>('send');
  const pending = (items ?? []).filter((b) => b.status === 'pending');
  const done = (items ?? []).filter((b) => b.status !== 'pending');
  const nameOf = (b: Broadcast) => (b.communityId ? communities.find((c) => c.id === b.communityId)?.community_name ?? 'A community' : 'Mumbai Onchain team');
  const logoOf = (b: Broadcast) => communities.find((c) => c.id === b.communityId)?.community_logo_url;
  // Opened with requests waiting (e.g. from the notification): show them first.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || items === null) return;
    opened.current = true;
    if (pending.length) setTab('requests');
  }, [items, pending.length]);

  return (
    <div>
      <AdminHeading
        page="notify"
        title="Notify"
        detail="Notifications on people’s phones, even with the app closed."
        history={
          items === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading" />
            </div>
          ) : (
            <History items={done} nameOf={nameOf} logoOf={logoOf} />
          )
        }
      />
      <Segments
        label="Notify"
        value={tab}
        onChange={setTab}
        options={[
          { id: 'send', label: 'Send' },
          { id: 'requests', label: pending.length ? `Requests · ${pending.length}` : 'Requests' },
        ]}
      />
      {tab === 'send' && <SendPanel reach={reach} onSent={reload} />}
      {tab === 'requests' && items === null && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" aria-label="Loading" />
        </div>
      )}
      {tab === 'requests' && items !== null && <Requests items={pending} nameOf={nameOf} logoOf={logoOf} onDone={reload} />}
    </div>
  );
}
