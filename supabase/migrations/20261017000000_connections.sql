-- People adding each other ("Add" on a profile). Until now this lived only in
-- the adder's browser, so the other person never knew and nothing could be
-- counted. One row per add, from one profile to another.

CREATE TABLE IF NOT EXISTS connections (
  from_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Not a foreign key: people can also come from website-only profiles.
  to_profile_id TEXT NOT NULL,
  -- The account that made the add; RLS checks it.
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (from_profile_id, to_profile_id),
  CHECK (from_profile_id <> to_profile_id)
);

CREATE INDEX IF NOT EXISTS connections_to_profile_idx ON connections (to_profile_id, created_at DESC);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- You see the adds you made and the adds made to your own profile; nobody
-- else's. Counts for any profile come from connection_counts() below.
DROP POLICY IF EXISTS "See own adds and adds to you" ON connections;
CREATE POLICY "See own adds and adds to you" ON connections
  FOR SELECT TO authenticated USING (
    owner_id = auth.uid()
    OR to_profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid())
  );

-- Add only from your own profile.
DROP POLICY IF EXISTS "Add from your own profile" ON connections;
CREATE POLICY "Add from your own profile" ON connections
  FOR INSERT TO authenticated WITH CHECK (
    owner_id = auth.uid()
    AND from_profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid())
  );

-- Remove only your own adds.
DROP POLICY IF EXISTS "Remove your own adds" ON connections;
CREATE POLICY "Remove your own adds" ON connections
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- "Added 12 · Added you 8" for any profile, without exposing who added whom.
CREATE OR REPLACE FUNCTION connection_counts(p_profile_id TEXT)
RETURNS TABLE (added INT, added_you INT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::INT FROM connections WHERE from_profile_id = p_profile_id),
    (SELECT COUNT(*)::INT FROM connections WHERE to_profile_id = p_profile_id);
$$;

REVOKE ALL ON FUNCTION connection_counts(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION connection_counts(TEXT) TO anon, authenticated;
