import { useState } from 'react';
import { Bell, CalendarClock, Loader2, Megaphone, UserPlus } from 'lucide-react';
import { Sheet } from './ui';
import { ensurePushSubscription } from '../lib/push';

const ASKED_KEY = 'mo_notify_asked';

/**
 * Should we ask before this person makes their profile? Only once, only where
 * the phone supports web notifications (an installed app on iPhone), and only
 * if they haven't already answered the system prompt.
 */
export function shouldAskForNotifications(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'default') return false;
  try {
    return localStorage.getItem(ASKED_KEY) !== '1';
  } catch {
    return true;
  }
}

function markAsked() {
  try {
    localStorage.setItem(ASKED_KEY, '1');
  } catch {
    // we may ask again next time; harmless
  }
}

/** A quick "you're all set" so people see what a notification looks like. */
async function confirmWithNotification() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    const options = { body: 'We’ll remind you before the events you save.', icon: '/icons/icon-192.png', badge: '/icons/favicon-64.png' };
    if (reg) await reg.showNotification('Notifications are on', options);
    else new Notification('Notifications are on', options);
  } catch {
    // not supported here; the permission still stands
  }
}

/**
 * Asked as someone starts making their profile: why notifications are worth
 * it, then the system prompt on "Allow". Either way they carry on afterwards.
 */
export function NotifyPrompt({ isOpen, onDone }: { isOpen: boolean; onDone: () => void }) {
  const [asking, setAsking] = useState(false);

  const finish = () => {
    markAsked();
    onDone();
  };

  async function allow() {
    setAsking(true);
    try {
      // Must start inside the tap, or iPhone ignores it.
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await confirmWithNotification();
        // Get this phone's push address now; it's saved to the account once
        // they've signed in (lib/push.ts listens for this).
        await ensurePushSubscription();
        window.dispatchEvent(new Event('mo:notifications-granted'));
      }
    } catch {
      // older browsers: nothing to do
    } finally {
      setAsking(false);
      finish();
    }
  }

  const reasons = [
    { Icon: CalendarClock, text: 'A reminder before events you’ve saved' },
    { Icon: UserPlus, text: 'When someone connects with you' },
    { Icon: Megaphone, text: 'Big news during the week, like venue changes' },
  ];

  return (
    <Sheet open={isOpen} onClose={finish} label="Turn on notifications" dismissible={!asking}>
      <div className="px-6 pt-8 pb-2">
        <span className="w-14 h-14 rounded-2xl bg-[var(--app-primary)] text-[var(--app-on-primary)] flex items-center justify-center">
          <Bell className="w-7 h-7" aria-hidden="true" />
        </span>
        <h2 className="app-title mt-5 text-[26px] leading-tight">Turn on notifications</h2>
        <p className="mt-1.5 text-[16px] leading-relaxed text-[var(--app-muted)]">
          So you don’t miss anything during Mumbai Onchain Week. You can change this any time in Settings.
        </p>
        <ul className="mt-5 space-y-3">
          {reasons.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[15px]">
              <span className="w-9 h-9 shrink-0 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] flex items-center justify-center">
                <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={allow}
          disabled={asking}
          className="app-press mt-7 w-full h-13 py-3.5 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[16px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {asking && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Allow notifications
        </button>
        <button type="button" onClick={finish} disabled={asking} className="mt-2 w-full h-12 text-[15px] font-semibold text-[var(--app-muted)]">
          Not now
        </button>
      </div>
    </Sheet>
  );
}
