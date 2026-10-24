import { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { getEventStartDateTime } from './date';
import { mergeSaved, useSavedEvents } from './useSavedEvents';
import type { EventItem } from '../types/event';

const row = (userId: string, e: EventItem) => ({
  user_id: userId,
  event_id: e.id,
  title: e.title.slice(0, 200),
  venue: (e.location || '').slice(0, 200),
  starts_at: getEventStartDateTime(e)?.toISOString() ?? null,
});

/**
 * Copies the phone's saved events to the account, so the server can push
 * "starts in 15 min" with the app closed. On sign-in it also brings back
 * events saved on another phone. Start times are refreshed every launch,
 * in case an event moved.
 */
export function useSavedSync(userId: string | null, events: EventItem[]) {
  const { savedIds } = useSavedEvents();
  // What the account has, as far as this session knows; null until loaded.
  const synced = useRef<{ user: string; ids: Set<string> } | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client || !userId || !events.length) return;
    const byId = new Map(events.map((e) => [e.id, e]));
    let live = true;

    void (async () => {
      if (synced.current?.user !== userId) {
        const { data, error } = await client.from('saved_events').select('event_id');
        if (error || !live) return;
        const remote = (data ?? []).map((r) => r.event_id as string);
        synced.current = { user: userId, ids: new Set(remote) };
        // Saved elsewhere: show here too. The next run uploads this phone's.
        mergeSaved(remote.filter((id) => byId.has(id)));
        const all = [...new Set([...savedIds, ...remote])].map((id) => byId.get(id)).filter((e): e is EventItem => Boolean(e));
        if (all.length) await client.from('saved_events').upsert(all.map((e) => row(userId, e)), { onConflict: 'user_id,event_id' });
        if (live) synced.current = { user: userId, ids: new Set(all.map((e) => e.id)) };
        return;
      }
      const known = synced.current.ids;
      const added = savedIds.filter((id) => !known.has(id)).map((id) => byId.get(id)).filter((e): e is EventItem => Boolean(e));
      const removed = [...known].filter((id) => !savedIds.includes(id));
      if (added.length) {
        const { error } = await client.from('saved_events').upsert(added.map((e) => row(userId, e)), { onConflict: 'user_id,event_id' });
        if (!error) added.forEach((e) => known.add(e.id));
      }
      if (removed.length) {
        const { error } = await client.from('saved_events').delete().eq('user_id', userId).in('event_id', removed);
        if (!error) removed.forEach((id) => known.delete(id));
      }
    })();
    return () => {
      live = false;
    };
  }, [userId, events, savedIds]);
}
