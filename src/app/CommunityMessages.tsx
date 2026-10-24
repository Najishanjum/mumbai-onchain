import { useState } from 'react';
import { BellOff, Bell, Loader2, Megaphone, Send } from 'lucide-react';
import { dailyLimit, LINK, sendCommunityMessage, shortAgo, useBroadcasts, type Broadcast } from '../lib/useBroadcasts';
import { useCommunityLevels } from '../lib/useCommunities';

const field =
  'w-full px-4 rounded-2xl bg-[var(--app-bg)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]';
const DAY_MS = 24 * 60 * 60 * 1000;

function StatusChip({ b }: { b: Broadcast }) {
  if (b.status === 'pending') return <span className="h-6 px-2.5 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] text-[12px] font-bold inline-flex items-center">Waiting for admins</span>;
  if (b.status === 'rejected') return <span className="h-6 px-2.5 rounded-full bg-[var(--app-live-soft)] text-[var(--app-live)] text-[12px] font-bold inline-flex items-center">Not sent</span>;
  return null;
}

/** Leads and admins: write to the community's members, or ask to reach everyone. */
function Composer({
  communityId,
  communityName,
  sentToday,
  level,
  championFree,
  onSent,
}: {
  communityId: string;
  communityName: string;
  sentToday: number;
  level: number;
  /** A Champion that hasn't used its one message to everyone without approval. */
  championFree: boolean;
  onSent: () => void;
}) {
  const limit = dailyLimit(level);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [everyone, setEveryone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const hasLink = LINK.test(`${title} ${body}`);
  const left = Math.max(0, limit - sentToday);
  const blocked = !everyone && left === 0;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || hasLink || blocked) return;
    setBusy(true);
    setError('');
    setDone('');
    const res = await sendCommunityMessage(communityId, title, body, everyone ? 'everyone' : 'members');
    setBusy(false);
    if ('error' in res) return setError(res.error);
    setTitle('');
    setBody('');
    setDone(
      res.status === 'pending'
        ? 'Sent to the admins. You’ll get a notification when they approve or decline it.'
        : everyone
          ? `Sent to everyone: ${res.recipients} phone${res.recipients === 1 ? '' : 's'}.`
          : `Sent to ${res.members} member${res.members === 1 ? '' : 's'}${res.members ? ` (${res.recipients} with notifications on)` : ''}.`
    );
    onSent();
  }

  return (
    <form onSubmit={send} className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-[var(--app-primary)]" aria-hidden="true" />
        <p className="flex-1 text-[17px] font-bold">Message {everyone ? 'everyone' : 'your members'}</p>
      </div>
      <div role="radiogroup" aria-label="Who gets it" className="grid grid-cols-2 p-1 rounded-full bg-[var(--app-segment)]">
        {[
          { v: false, label: 'Members' },
          { v: true, label: 'Everyone' },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={everyone === o.v}
            onClick={() => setEveryone(o.v)}
            className={`h-9 rounded-full text-[14px] font-bold ${everyone === o.v ? 'bg-[var(--app-primary)] text-[var(--app-on-primary)]' : 'text-[var(--app-muted)]'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-[13px] text-[var(--app-muted)]">
        {everyone
          ? championFree
            ? 'Your Champion message: goes to everyone in the app now, no approval needed. Once only.'
            : 'Goes to everyone in the app once an admin approves it. One request at a time.'
          : `Goes out now as “${communityName}: …”. ${left} of ${limit} left in the next 24 hours.`}
      </p>
      <label htmlFor="cm-title" className="sr-only">
        Title
      </label>
      <input id="cm-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Meetup at Jio World tonight 🎉" className={`${field} h-12`} />
      <label htmlFor="cm-body" className="sr-only">
        Message
      </label>
      <textarea id="cm-body" value={body} maxLength={240} rows={3} onChange={(e) => setBody(e.target.value)} placeholder="Meet us at Hall 2, 7 pm. Look for the orange flag." className={`${field} py-3`} />
      <div className="flex items-center justify-between text-[13px] text-[var(--app-muted)]">
        <span>No links: tell people where to find it, like “on our Telegram”.</span>
        <span className="tabular-nums shrink-0 pl-2">{body.length}/240</span>
      </div>
      {hasLink && <p className="text-[14px] text-[var(--app-live)]">Take the link out to send. Messages can’t have links.</p>}
      {error && <p className="text-[14px] text-[var(--app-live)]">{error}</p>}
      {done && <p role="status" className="text-[14px] font-semibold">{done}</p>}
      <button
        type="submit"
        disabled={busy || !title.trim() || hasLink || blocked}
        className="app-press w-full h-12 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
        {blocked ? 'Back tomorrow' : everyone ? (championFree ? 'Send to everyone' : 'Ask the admins') : 'Send to members'}
      </button>
    </form>
  );
}

/** Messages on a community's page, the composer for its leads, and mute for members. */
export function CommunityMessages({
  communityId,
  communityName,
  canManage,
  isMember,
  muted,
  onToggleMute,
}: {
  communityId: string;
  communityName: string;
  canManage: boolean;
  isMember: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const { items, reload } = useBroadcasts(communityId);
  const { level } = useCommunityLevels().levelOf(communityId);
  const championFree = level >= 3 && !(items ?? []).some((b) => b.audience === 'everyone' && b.status === 'sent' && !b.reviewedAt);
  const sentToday = (items ?? []).filter((b) => b.audience === 'members' && b.status === 'sent' && b.sentAt && Date.now() - new Date(b.sentAt).getTime() < DAY_MS).length;
  // Members only see what was sent; leads see their waiting and declined ones too.
  const shown = (items ?? []).filter((b) => canManage || b.status === 'sent');

  return (
    <div className="space-y-3">
      {canManage && <Composer communityId={communityId} communityName={communityName} sentToday={sentToday} level={level} championFree={championFree} onSent={reload} />}
      {(shown.length > 0 || isMember) && (
        <section>
          <div className="px-1 flex items-center justify-between">
            <h3 className="app-label">Messages</h3>
            {isMember && (
              <button type="button" onClick={onToggleMute} aria-pressed={muted} className="h-9 px-2 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--app-muted)]">
                {muted ? <BellOff className="w-4 h-4" aria-hidden="true" /> : <Bell className="w-4 h-4" aria-hidden="true" />}
                {muted ? 'Muted' : 'Mute'}
              </button>
            )}
          </div>
          {items === null ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--app-muted)]" aria-label="Loading messages" />
            </div>
          ) : shown.length === 0 ? (
            <p className="px-1 mt-2 text-[15px] text-[var(--app-muted)]">No messages yet. You’ll get a notification when {communityName} sends one.</p>
          ) : (
            <ul className="mt-2 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] divide-y divide-[var(--app-line)] overflow-hidden">
              {shown.slice(0, 10).map((b) => (
                <li key={b.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-[15px] font-bold leading-snug">{b.title}</p>
                    <span className="shrink-0 text-[13px] text-[var(--app-muted)]">{shortAgo(b.sentAt ?? b.createdAt)}</span>
                  </div>
                  {b.body && <p className="mt-0.5 text-[15px] leading-snug whitespace-pre-line">{b.body}</p>}
                  {canManage && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-[var(--app-muted)]">
                      <StatusChip b={b} />
                      {b.status === 'sent' && <span>{b.audience === 'everyone' ? 'To everyone' : 'To members'} · reached {b.recipients} {b.recipients === 1 ? 'phone' : 'phones'}</span>}
                      {b.status === 'rejected' && b.reviewNote && <span>“{b.reviewNote}”</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
