import { useSyncExternalStore } from 'react';

// Not in lib.dom.d.ts: beforeinstallprompt is a non-standard, Chromium-only event.
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'android' | 'other-mobile' | 'desktop';

export function detectPlatform(): Platform {
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
  if (isIOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mobi/.test(ua)) return 'other-mobile';
  return 'desktop';
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true // iOS Safari
  );
}

// The app layout is only for the installed app. Anyone opening the site in a
// browser, on phone or desktop, gets the website. `?app=1` previews the app
// layout for that page load only; it is deliberately not remembered, so the
// plain URL always shows the website.
export function isAppMode(): boolean {
  if (isStandalone()) return true;
  try {
    return new URLSearchParams(window.location.search).get('app') === '1';
  } catch {
    return false;
  }
}

// Clear the flag older builds left behind, which kept the app layout on for
// the rest of the tab session.
try {
  sessionStorage.removeItem('mo_app_preview');
} catch {
  // storage blocked: nothing to clean
}

// Best effort: X adds "TwitterAndroid" / "Twitter for iPhone", Telegram adds
// "Telegram". Neither in-app browser can install a PWA, and Najish's traffic
// comes mostly from X links, so these people need to be sent to a real browser.
export function detectInAppBrowser(): 'x' | 'telegram' | 'instagram' | null {
  const ua = navigator.userAgent || '';
  if (/TwitterAndroid|Twitter for iPhone/i.test(ua)) return 'x';
  if (/Telegram/i.test(ua)) return 'telegram';
  if (/Instagram/i.test(ua)) return 'instagram';
  return null;
}

// --- Install prompt store -------------------------------------------------
// Captured at module load: Chrome can fire beforeinstallprompt before React
// mounts, and a missed event doesn't come back until the next page load.

type InstallState = { deferred: BeforeInstallPromptEvent | null; installed: boolean };
let state: InstallState = { deferred: null, installed: false };
const listeners = new Set<() => void>();
const emit = (next: Partial<InstallState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

if (typeof window !== 'undefined') {
  state.installed = isStandalone();
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own sheet instead of Chrome's mini-infobar
    emit({ deferred: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => emit({ deferred: null, installed: true }));
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
}

/** Shows Chrome's native install dialog. Resolves true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const e = state.deferred;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  // A prompt event can only be used once.
  emit({ deferred: null, installed: outcome === 'accepted' || state.installed });
  return outcome === 'accepted';
}

// --- "Not now" memory -----------------------------------------------------

const DISMISS_KEY = 'mo_install_dismissed_at';
const DISMISS_DAYS = 3;

export function wasDismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function rememberDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // private mode: the banner just shows again next visit
  }
}
