import { useCallback, useSyncExternalStore } from 'react';

// The user's own plan: event IDs they saved in the app. Kept apart from
// EventItem.status, which is seeded with the site owner's personal plan
// (e.g. Devcon = VOLUNTEER) and would show up as everyone's plan.
// Kept on the phone; useSavedSync copies it to the account for reminders.
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

/** Adds events saved on another device (from the account), keeping this phone's. */
export function mergeSaved(ids: string[]) {
  const extra = ids.filter((id) => !saved.includes(id));
  if (extra.length) write([...saved, ...extra]);
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
