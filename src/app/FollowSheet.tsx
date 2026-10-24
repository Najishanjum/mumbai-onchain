import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { LinkedInLogo, TelegramLogo, XLogo } from './BrandIcons';
import { Sheet } from './ui';

// Mumbai Onchain's own accounts. An entry without a link isn't shown, so
// Instagram and LinkedIn appear as soon as their links are filled in.
const ACCOUNTS: { id: string; name: string; handle: string; href: string; icon: React.ReactNode }[] = [
  { id: 'x', name: 'X', handle: '@Mumbai_onchain', href: 'https://x.com/Mumbai_onchain', icon: <XLogo className="w-5 h-5" /> },
  { id: 'telegram', name: 'Telegram', handle: 'Mumbai Onchain group', href: 'https://t.me/+Yi25K6W8KMo0MDZl', icon: <TelegramLogo className="w-5 h-5" /> },
  { id: 'linkedin', name: 'LinkedIn', handle: 'Mumbai Onchain', href: '', icon: <LinkedInLogo className="w-5 h-5" /> },
].filter((a) => a.href);

const KEY = 'mo_follow_card';
const AGAIN_MS = 3 * 24 * 60 * 60 * 1000;

interface Seen {
  shown: number;
  at: number;
  tapped: string[];
}

function read(): Seen {
  try {
    return { shown: 0, at: 0, tapped: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    // Can't remember answers: act as if already shown twice, so it never nags.
    return { shown: 2, at: Date.now(), tapped: [] };
  }
}
function write(s: Seen) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // shows again next launch at most
  }
}

/**
 * Once someone has a pass: once now, and once more three days later only if
 * they tapped nothing. Never more. Following isn't required for anything.
 */
export function shouldShowFollow(): boolean {
  if (!ACCOUNTS.length) return false;
  const s = read();
  if (s.shown === 0) return true;
  return s.shown === 1 && s.tapped.length === 0 && Date.now() - s.at > AGAIN_MS;
}

/** "Stay in the loop": Mumbai Onchain's socials, each ticked once tapped. */
export function FollowSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tapped, setTapped] = useState<string[]>(() => read().tapped);
  // Counts as shown when it opens.
  useEffect(() => {
    if (!open) return;
    const s = read();
    write({ ...s, shown: s.shown + 1, at: Date.now() });
  }, [open]);

  function tap(id: string) {
    const next = tapped.includes(id) ? tapped : [...tapped, id];
    setTapped(next);
    write({ ...read(), tapped: next });
  }

  return (
    <Sheet open={open} onClose={onClose} label="Stay in the loop">
      <div className="px-5 pt-6 pb-2">
        <img src="/icons/icon-192.png" alt="" className="w-14 h-14 rounded-2xl" />
        <h2 className="app-title mt-4 text-[24px] font-bold">Stay in the loop</h2>
        <p className="mt-1 text-[15px] text-[var(--app-muted)]">Follow Mumbai Onchain for side events, meetups and what’s happening during the week.</p>
        <div className="mt-5 space-y-2">
          {ACCOUNTS.map((a) => {
            const done = tapped.includes(a.id);
            return (
              <a
                key={a.id}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => tap(a.id)}
                className="app-press flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)]"
              >
                <span className="w-10 h-10 rounded-full bg-[var(--app-bg)] flex items-center justify-center shrink-0">{a.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-semibold">{a.name}</span>
                  <span className="block text-[14px] text-[var(--app-muted)] truncate">{a.handle}</span>
                </span>
                {done ? (
                  <span className="h-9 px-3 rounded-full bg-[var(--app-primary-soft)] text-[var(--app-primary)] text-[14px] font-semibold inline-flex items-center gap-1">
                    <Check className="w-4 h-4" aria-hidden="true" /> Opened
                  </span>
                ) : (
                  <span className="h-9 px-4 rounded-full bg-[var(--app-primary)] text-[var(--app-on-primary)] text-[14px] font-semibold inline-flex items-center">
                    {a.id === 'telegram' ? 'Join' : 'Follow'}
                  </span>
                )}
              </a>
            );
          })}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full h-12 text-[15px] font-semibold text-[var(--app-muted)]">
          {tapped.length ? 'Done' : 'Not now'}
        </button>
      </div>
    </Sheet>
  );
}
