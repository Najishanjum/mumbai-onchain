import { useCallback, useSyncExternalStore } from 'react';

// The user's own plan: event IDs they saved in the app. Kept apart from
// EventItem.status, which is seeded with the site owner's personal plan
// (e.g. Devcon = VOLUNTEER) and would show up as everyone's plan.
// lean-ctx: device-local for now; syncs to the profile once accounts land (phase 3).
const KEY = 'mo_saved_events_v1';

let saved: string[] = read();
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(next: string[]) {
  saved = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: keep the in-memory list for this session
  }
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  // Another tab (e.g. Safari vs. the installed app on Android) changed the list.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      saved = read();
      listeners.forEach((l) => l());
    }
  });
}

export function useSavedEvents() {
  const ids = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => saved
  );

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);
  const toggleSaved = useCallback((id: string) => {
    write(saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id]);
  }, []);

  return { savedIds: ids, isSaved, toggleSaved };
}
