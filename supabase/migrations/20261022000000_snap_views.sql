-- Who saw your story: one row per account per snap, written by the app when a
-- signed-in member watches someone else's snap. Only the snap's owner (and the
-- viewer themselves) can read them. Safe to re-run.

CREATE TABLE IF NOT EXISTS snap_views (
  snap_id TEXT NOT NULL REFERENCES snaps(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (snap_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS snap_views_snap_idx ON snap_views (snap_id, viewed_at DESC);

ALTER TABLE snap_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "See who saw your snaps" ON snap_views;
CREATE POLICY "See who saw your snaps" ON snap_views
  FOR SELECT TO authenticated USING (
    viewer_id = auth.uid()
    OR snap_id IN (SELECT id FROM snaps WHERE owner_id = auth.uid())
  );

-- As yourself, from your own profile, on someone else's public snap.
DROP POLICY IF EXISTS "Record your own view" ON snap_views;
CREATE POLICY "Record your own view" ON snap_views
  FOR INSERT TO authenticated WITH CHECK (
    viewer_id = auth.uid()
    AND viewer_profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid())
    AND snap_id IN (
      SELECT id FROM snaps
       WHERE visibility = 'public' AND owner_id IS NOT NULL AND owner_id <> auth.uid()
    )
  );
