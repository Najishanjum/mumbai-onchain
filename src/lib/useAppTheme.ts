import { useEffect, useSyncExternalStore } from 'react';

export type ThemePref = 'dark' | 'light' | 'system';

// Same key the inline script in index.html reads before first paint.
const KEY = 'mo_app_theme';
const BG = { dark: '#0D1316', light: '#EEF2F2' } as const;

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'system' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

let pref: ThemePref = readPref();
const listeners = new Set<() => void>();

export function setThemePref(next: ThemePref) {
  pref = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // private mode: the choice lasts for this session only
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;

function useSystemDark(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
      mq?.addEventListener('change', cb);
      return () => mq?.removeEventListener('change', cb);
    },
    systemDark
  );
}

/**
 * Applies the app theme to <html> while `enabled` (the installed app).
 * The website never gets the attribute, so it keeps its own design.
 */
export function useAppTheme(enabled: boolean) {
  const current = useSyncExternalStore(subscribe, () => pref);
  const sysDark = useSystemDark();
  const resolved: 'dark' | 'light' = current === 'system' ? (sysDark ? 'dark' : 'light') : current;

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.setAttribute('data-app-theme', resolved);
    // Android's status bar and task switcher follow theme-color.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[resolved]);
  }, [enabled, resolved]);

  return { pref: current, resolved, setPref: setThemePref };
}
