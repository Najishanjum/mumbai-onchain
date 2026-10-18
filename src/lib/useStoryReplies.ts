import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { usePeopleStore } from './usePeopleStore';

export interface StoryReply {
  id: string;
  snapId: string;
  fromProfileId: string;
  body: string;
  createdAt: string;
}

/**
 * Replies to stories, kept in the account (story_replies). `replies` are the
 * ones people sent to your snaps, newest first; `send` replies to someone
 * else's snap and pushes it to them. Re-read whenever the app comes back to
 * the front, e.g. after tapping a reply's push.
 */
export function useStoryReplies() {
  const { authUser, accountReady, myProfile } = usePeopleStore();
  const [replies, setReplies] = useState<StoryReply[]>([]);
  const uid = authUser?.id;
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const onShow = () => document.visibilityState === 'visible' && setRefresh((n) => n + 1);
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !accountReady || !uid) {
      setReplies([]);
      return;
    }
    let live = true;
    // RLS returns your own replies too; the rest are replies to your snaps.
    client
      .from('story_replies')
      .select('id, snap_id, from_profile_id, body, created_at')
      .neq('owner_id', uid)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!live || error) return;
        setReplies(
          (data ?? []).map((r) => ({ id: r.id, snapId: r.snap_id, fromProfileId: r.from_profile_id, body: r.body, createdAt: r.created_at }))
        );
      });
    return () => {
      live = false;
    };
  }, [accountReady, uid, refresh]);

  const canReply = Boolean(supabase && accountReady && uid && myProfile);

  const send = useCallback(
    async (snapId: string, body: string): Promise<boolean> => {
      const client = supabase;
      const text = body.trim();
      if (!client || !myProfile || !text) return false;
      const { data, error } = await client
        .from('story_replies')
        .insert({ snap_id: snapId, from_profile_id: myProfile.id, body: text.slice(0, 500) })
        .select('id')
        .single();
      if (error || !data) {
        console.error('Could not send reply:', error?.message);
        return false;
      }
      // Best effort: a push to them if they allowed notifications.
      client.functions.invoke('notify-connection', { body: { replyId: data.id } }).catch(() => undefined);
      return true;
    },
    [myProfile]
  );

  return { replies, canReply, send };
}
