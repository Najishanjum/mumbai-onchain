import { useEffect, useSyncExternalStore } from 'react';

// How the installed app looks, beyond light/dark (see useAppTheme). Saved on
// this device; index.html reads the same key before first paint.
const KEY = 'mo_app_prefs';

export type AccentPref = 'role' | 'builder' | 'founder' | 'student' | 'volunteer' | 'attendee' | 'other';
export type BadgePref = 'auto' | 'white' | 'black';
export type ScenePref = 'aurora' | 'plain';
export type CardPref = 'devcon' | 'classic';

export interface AppPrefs {
  /** 'role' follows the profile's role; otherwise one of the logo colours. */
  accent: AccentPref;
  /** 'auto' is white in Dark and black in Light. */
  badge: BadgePref;
  /** 'aurora' is near-black with drifting Devcon × IBW glows; 'plain' is the bare charcoal. */
  scene: ScenePref;
  /** Badge design: 'devcon' is the prism-header pass, 'classic' the logo-pattern card. */
  design: CardPref;
  jaali: boolean;
  mandala: boolean;
}

const DEFAULTS: AppPrefs = { accent: 'role', badge: 'auto', scene: 'aurora', design: 'classic', jaali: true, mandala: true };

function read(): AppPrefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

let prefs: AppPrefs = read();
const listeners = new Set<() => void>();

export function setAppPrefs(patch: Partial<AppPrefs>) {
  prefs = { ...prefs, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // private mode: lasts for this session
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useAppPrefs(): AppPrefs {
  return useSyncExternalStore(subscribe, () => prefs);
}

/** Reflects the preferences on <html> so the CSS in index.css can follow them. */
export function useApplyAppPrefs() {
  const p = useAppPrefs();
  useEffect(() => {
    const root = document.documentElement;
    const set = (name: string, value: string | null) =>
      value === null ? root.removeAttribute(name) : root.setAttribute(name, value);
    set('data-app-accent', p.accent === 'role' ? null : p.accent);
    set('data-app-badge', p.badge === 'auto' ? null : p.badge);
    set('data-app-scene', p.scene === 'plain' ? null : 'aurora');
    set('data-app-jaali', p.jaali ? null : 'off');
    set('data-app-mandala', p.mandala ? null : 'off');
  }, [p]);
}
