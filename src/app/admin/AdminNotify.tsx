import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePeopleStore } from '../../lib/usePeopleStore';
import { AdminHeading, btn, notifyAdmins } from './shared';

// Where tapping the notification opens.
const DESTINATIONS = [
  { id: '/?open=map', label: 'Map' },
  { id: '/', label: 'Today' },
  { id: '/?tab=events', label: 'Schedule' },
  { id: '/?tab=people', label: 'People' },
] as const;

const field =
  'w-full px-4 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] text-[16px] outline-none focus:border-[var(--app-primary)] placeholder:text-[var(--app-faint)]';

/** Send a push notification to everyone with notifications on (or a test to yourself). */
export function AdminNotify({ reach }: { reach: number | null }) {
  const { authUser } = usePeopleStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState<string>(DESTINATIONS[0].id);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<'test' | 'all' | null>(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const ready = title.trim().length > 0;

  async function send(toAll: boolean) {
    if (!ready || !authUser) return;
    setBusy(toAll ? 'all' : 'test');
    setError('');
    setResult('');
    const { data, error: e } = await supabase.functions.invoke('send-push', {
      body: { title: title.trim(), body: body.trim(), url, tag: toAll ? `broadcast-${Date.now()}` : undefined, ...(toAll ? {} : { userIds: [authUser.id] }) },
    });
    setBusy(null);
    setConfirming(false);
    if (e || !data) return setError('Couldn’t send. Check your connection, and that send-push is deployed with the admin check.');
    const sent = (data as { sent: number }).sent;
    if (toAll) {
      setResult(`Sent to ${sent} ${sent === 1 ? 'phone' : 'phones'}.`);
      notifyAdmins('broadcast_sent', `“${title.trim()}”, to ${sent} ${sent === 1 ? 'phone' : 'phones'}`);
      setTitle('');
      setBody('');
    } else {
      setResult(sent ? 'Test sent to your phone. Lock it to see how it looks.' : 'This phone has notifications off. Allow them in the app first.');
    }
  }

  return (
    <div>
      <AdminHeading title="Notify" detail="A notification on everyone’s phone, even with the app closed." />

      <div className="mx-4 space-y-3">
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
        {error && <p className="text-[14px] text-[var(--app-live)]">{error}</p>}
        {confirming ? (
          <div className="rounded-3xl bg-[var(--app-surface)] border border-[var(--app-line)] p-4">
            <p className="text-[15px]">
              Send this to {reach === null ? 'everyone with notifications on' : `${reach} ${reach === 1 ? 'person' : 'people'}`}? It can’t be taken back.
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
              Send to everyone
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
