import { useEffect, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Bell, CalendarDays, Check, CircleCheck, Compass, Copy, Download, EllipsisVertical, MapPin, Share, SquarePlus, Users } from 'lucide-react';
import { detectInAppBrowser, detectPlatform, promptInstall, useInstallState } from '../lib/pwa';
import { Scene } from './Scene';
import { supabase } from '../lib/supabase';

// Keeps a community's invite (?c=…) on the link and QR this page hands on.
const inviteSlug = () => new URLSearchParams(window.location.search).get('c');

/** The community whose invite link (?c=…) brought them here, if any. */
function useInviteCommunity() {
  const [community, setCommunity] = useState<{ name: string; logo: string } | null>(null);
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('c');
    if (!slug || !supabase) return;
    supabase
      .from('community_partners_public')
      .select('community_name, community_logo_url')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => data && setCommunity({ name: data.community_name, logo: data.community_logo_url }));
  }, []);
  return community;
}

const FEATURES = [
  { icon: CalendarDays, title: 'Every event, one schedule', body: 'IBW, Devcon 8, ETHGlobal Mumbai and the side events, with what’s on now.' },
  { icon: Users, title: 'Meet people', body: 'Your badge and QR, and everyone you met, saved.' },
  { icon: MapPin, title: 'The map of Mumbai', body: 'Venues and spots the community recommends.' },
  { icon: Bell, title: 'Notifications', body: 'Replies and updates, even with the app closed.' },
];

const inline = 'inline w-[18px] h-[18px] align-[-3px] mx-0.5';

function Steps({ children }: { children: ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {children.map((step, i) => (
        <li key={i} className="flex items-center gap-3 rounded-2xl bg-[var(--app-pressed)] px-3.5 py-3">
          <span className="w-7 h-7 shrink-0 rounded-full bg-[var(--app-ink)] text-[var(--app-bg)] text-[13px] font-extrabold flex items-center justify-center">{i + 1}</span>
          <span className="flex-1 text-[15px] leading-snug">{step}</span>
        </li>
      ))}
    </ol>
  );
}

const primary =
  'app-press w-full h-13 rounded-full bg-[var(--app-ink)] text-[var(--app-bg)] text-[16px] font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-60';
const plain = 'app-press w-full h-12 rounded-full border border-[var(--app-line)] bg-[var(--app-surface)] text-[15px] font-semibold inline-flex items-center justify-center gap-2';

function CopyLink() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      const c = inviteSlug();
      await navigator.clipboard.writeText(window.location.origin + '/app' + (c ? `?c=${encodeURIComponent(c)}` : ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the address is on screen to type
    }
  }
  return (
    <button type="button" onClick={copy} className={plain}>
      {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  );
}

// X, Telegram and Instagram open links in their own browser, which can't
// install apps. iOS 17+ opens Safari from an x-safari- link; Android opens
// Chrome from an intent link. If neither works, the steps still do.
function InAppBrowser({ app, ios }: { app: 'x' | 'telegram' | 'instagram'; ios: boolean }) {
  const name = app === 'x' ? 'X' : app === 'telegram' ? 'Telegram' : 'Instagram';
  // search keeps a community's invite (?c=…) when hopping to the real browser.
  const { host, pathname, search } = window.location;
  const href = ios ? `x-safari-https://${host}${pathname}${search}` : `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-[var(--app-muted)]">You’re inside {name}, which can’t install apps. Open this page in {ios ? 'Safari' : 'Chrome'} first.</p>
      <a href={href} className={primary}>
        <Compass className="w-5 h-5" aria-hidden="true" />
        Open in {ios ? 'Safari' : 'Chrome'}
      </a>
      <Steps>
        {[
          <>
            Or tap <b>•••</b> or <EllipsisVertical className={inline} aria-hidden="true" /> in the corner
          </>,
          <>
            Choose <b>Open in browser</b>
          </>,
        ]}
      </Steps>
      <CopyLink />
    </div>
  );
}

function DesktopQr() {
  const [qr, setQr] = useState('');
  useEffect(() => {
    const c = inviteSlug();
    QRCode.toDataURL(window.location.origin + '/app?source=qr' + (c ? `&c=${encodeURIComponent(c)}` : ''), { margin: 1, width: 360, color: { dark: '#0A0A0C', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, []);
  return (
    <div className="flex items-center gap-4">
      {qr ? <img src={qr} alt={`QR code for ${window.location.host}/app`} className="w-32 h-32 rounded-xl" /> : <div className="w-32 h-32 rounded-xl bg-white/10" />}
      <p className="flex-1 text-[15px] leading-relaxed text-[var(--app-muted)]">It’s made for your phone. Scan this with the camera and add it to your home screen.</p>
    </div>
  );
}

function HowToInstall() {
  const { deferred, installed } = useInstallState();
  const [installing, setInstalling] = useState(false);
  const platform = detectPlatform();
  const inApp = detectInAppBrowser();

  if (installed) {
    return (
      <div className="flex items-start gap-3">
        <CircleCheck className="w-7 h-7 shrink-0 text-[#3CC48C]" aria-hidden="true" />
        <p className="text-[16px] leading-snug">
          <b>You have the app.</b> Open Mumbai Onchain from your home screen.
          {/* Chrome and the installed app share storage on Android, so ?c= carries over. */}
          {inviteSlug() && platform === 'android' && ' Your invite is saved and joins you when you open it.'}
        </p>
      </div>
    );
  }

  async function install() {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  }

  const installButton = deferred && (
    <button type="button" onClick={install} disabled={installing} className={primary}>
      <Download className="w-5 h-5" aria-hidden="true" />
      {installing ? 'Installing…' : 'Install the app'}
    </button>
  );

  if (inApp && platform !== 'desktop') return <InAppBrowser app={inApp} ios={platform === 'ios'} />;

  if (platform === 'ios') {
    return (
      <Steps>
        {[
          <>
            Tap <Share className={inline} aria-hidden="true" /> <b>Share</b> in the toolbar (or under <b>•••</b>)
          </>,
          <>
            Choose <SquarePlus className={inline} aria-hidden="true" /> <b>Add to Home Screen</b>, then <b>Add</b>
          </>,
          <>Open Mumbai Onchain from your home screen</>,
        ]}
      </Steps>
    );
  }

  if (platform === 'desktop') {
    return (
      <div className="space-y-4">
        <DesktopQr />
        {deferred && (
          <button type="button" onClick={install} disabled={installing} className={plain}>
            <Download className="w-4 h-4" aria-hidden="true" />
            Install on this computer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {installButton}
      <Steps>
        {[
          <>
            {deferred ? 'Or open' : 'Open'} the browser menu <EllipsisVertical className={inline} aria-hidden="true" />
          </>,
          <>
            Choose <b>Install app</b> or <b>Add to Home screen</b>
          </>,
        ]}
      </Steps>
      {/* Some phones don't report the installed app; the menu gives it away. */}
      {!deferred && (
        <p className="px-1 text-[14px] leading-snug text-[var(--app-muted)]">
          Menu says <b className="text-[var(--app-ink)]">Open Mumbai Onchain</b> instead? You already have the app. Open it from your home screen
          {inviteSlug() ? ', and your invite comes with you.' : '.'}
        </p>
      )}
    </div>
  );
}

/**
 * mumbaionchain.site/app in a browser: one page whose only job is getting
 * the app onto the phone, for links in posts and DMs. Once installed, the
 * same address opens the app itself (main.tsx).
 */
export function InstallPage() {
  // Dark Aurora like the app, whatever the visitor's settings.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-app-theme', 'dark');
    root.setAttribute('data-app-scene', 'aurora');
    document.title = 'Get the Mumbai Onchain app';
  }, []);
  // So the app works offline from its first launch.
  useRegisterSW({ immediate: true });
  const invite = useInviteCommunity();

  return (
    <div className="app app-root relative isolate min-h-[100svh] overflow-x-hidden">
      <Scene />
      <main className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+40px)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <img src="/icons/icon-192.png" alt="" className="w-22 h-22 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.5)]" />
        <h1 className="mt-5 text-[34px] leading-[1.05] font-extrabold tracking-[-0.02em]">Mumbai Onchain</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-[var(--app-muted)]">Your app for India Blockchain Week, Devcon 8 and ETHGlobal Mumbai. Free, and no App Store needed.</p>

        {invite && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[var(--app-surface)]/85 backdrop-blur-xl border border-[var(--app-line)] p-3.5">
            {invite.logo && <img src={invite.logo} alt="" className="w-11 h-11 rounded-xl object-cover bg-white shrink-0" />}
            <p className="text-[15px] leading-snug">
              <b>{invite.name}</b> invited you. When you make your pass, pick <b>{invite.name}</b> as your community.
            </p>
          </div>
        )}

        <section aria-labelledby="install-title" className="mt-7 rounded-[28px] bg-[var(--app-surface)]/85 backdrop-blur-xl border border-[var(--app-line)] p-4">
          <h2 id="install-title" className="font-['Red_Hat_Mono'] text-[12px] font-semibold tracking-[0.16em] text-[var(--app-muted)] mb-3 px-1">
            INSTALL IN 10 SECONDS
          </h2>
          <HowToInstall />
        </section>

        <ul className="mt-8 space-y-5 px-1">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3.5">
              <span className="w-10 h-10 shrink-0 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-line)] flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[16px] font-bold">{title}</span>
                <span className="block text-[15px] leading-snug text-[var(--app-muted)]">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        <footer className="mt-10 px-1 text-[14px] text-[var(--app-muted)] space-y-2">
          <p>
            Just looking?{' '}
            <a href="/" className="underline text-[var(--app-ink)]">
              Open the website
            </a>
          </p>
          <p>
            Built by{' '}
            <a href="https://x.com/nimsaraonline" target="_blank" rel="noopener noreferrer" className="underline">
              @nimsaraonline
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
