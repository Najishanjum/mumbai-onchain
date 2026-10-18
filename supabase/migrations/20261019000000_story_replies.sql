-- Replies to stories ("Send a reply…" in the story viewer). Private, like a
-- DM: only the person who replied and the story's author can read one.

CREATE TABLE IF NOT EXISTS story_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snap_id TEXT NOT NULL REFERENCES snaps(id) ON DELETE CASCADE,
  from_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- The account that replied; RLS checks it.
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS story_replies_snap_idx ON story_replies (snap_id, created_at DESC);
CREATE INDEX IF NOT EXISTS story_replies_owner_idx ON story_replies (owner_id, created_at DESC);

ALTER TABLE story_replies ENABLE ROW LEVEL SECURITY;

-- Your own replies, and replies to your snaps.
DROP POLICY IF EXISTS "See your replies and replies to you" ON story_replies;
CREATE POLICY "See your replies and replies to you" ON story_replies
  FOR SELECT TO authenticated USING (
    owner_id = auth.uid()
    OR snap_id IN (SELECT id FROM snaps WHERE owner_id = auth.uid())
  );

-- Reply from your own profile, to someone else's public snap.
DROP POLICY IF EXISTS "Reply from your own profile" ON story_replies;
CREATE POLICY "Reply from your own profile" ON story_replies
  FOR INSERT TO authenticated WITH CHECK (
    owner_id = auth.uid()
    AND from_profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid())
    AND snap_id IN (
      SELECT id FROM snaps
       WHERE visibility = 'public' AND owner_id IS NOT NULL AND owner_id <> auth.uid()
    )
  );

-- Take back your reply, or clear one sent to you.
DROP POLICY IF EXISTS "Delete your replies or replies to you" ON story_replies;
CREATE POLICY "Delete your replies or replies to you" ON story_replies
  FOR DELETE TO authenticated USING (
    owner_id = auth.uid()
    OR snap_id IN (SELECT id FROM snaps WHERE owner_id = auth.uid())
  );

-- Spam guard: at most 20 replies per account every 10 minutes.
CREATE OR REPLACE FUNCTION story_replies_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM story_replies
       WHERE owner_id = NEW.owner_id AND created_at > NOW() - INTERVAL '10 minutes') >= 20 THEN
    RAISE EXCEPTION 'Too many replies, try again in a few minutes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS story_replies_rate_limit ON story_replies;
CREATE TRIGGER story_replies_rate_limit
  BEFORE INSERT ON story_replies
  FOR EACH ROW EXECUTE FUNCTION story_replies_rate_limit();
