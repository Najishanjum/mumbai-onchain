-- "I'm here": a member checks in at an event that's on now, and everyone in
-- the app sees who's in the room. One check-in per account; checking in
-- somewhere else moves it. Each one ends on its own at expires_at (the event's
-- end, at most 12 hours away). Safe to re-run.

CREATE TABLE IF NOT EXISTS check_ins (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  -- Events live in the app, not the database; the title is kept for the push.
  event_title TEXT NOT NULL DEFAULT '',
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS check_ins_event_idx ON check_ins (event_id, expires_at);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Signed-in members see who's somewhere right now; ended check-ins disappear.
DROP POLICY IF EXISTS "See who is here now" ON check_ins;
CREATE POLICY "See who is here now" ON check_ins
  FOR SELECT TO authenticated USING (expires_at > NOW() OR user_id = auth.uid());

-- Only yourself, from your own profile, ending within 12 hours.
DROP POLICY IF EXISTS "Check yourself in" ON check_ins;
CREATE POLICY "Check yourself in" ON check_ins
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid())
    AND expires_at > NOW() AND expires_at <= NOW() + INTERVAL '12 hours'
    AND length(event_title) <= 200
  );

DROP POLICY IF EXISTS "Move your check-in" ON check_ins;
CREATE POLICY "Move your check-in" ON check_ins
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (
    user_id = auth.uid()
    AND profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid())
    AND expires_at > NOW() AND expires_at <= NOW() + INTERVAL '12 hours'
    AND length(event_title) <= 200
  );

DROP POLICY IF EXISTS "Leave" ON check_ins;
CREATE POLICY "Leave" ON check_ins
  FOR DELETE TO authenticated USING (user_id = auth.uid());
