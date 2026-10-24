-- Events admins add from the app (Admin → Events), from a Luma link or by
-- hand. The app shows the events built into it plus these; a row with the
-- same id as a built-in event replaces it, and hidden = true takes it off.
-- Dates and times are IST, as the app shows them. Safe to re-run.

CREATE TABLE IF NOT EXISTS app_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 5000),
  organizer TEXT NOT NULL DEFAULT '' CHECK (length(organizer) <= 200),
  category TEXT NOT NULL DEFAULT 'Ecosystem',
  start_date TEXT NOT NULL CHECK (start_date ~ '^\d{4}-\d{2}-\d{2}$'),
  start_time TEXT NOT NULL DEFAULT 'TBA' CHECK (start_time = 'TBA' OR start_time ~ '^\d{2}:\d{2}$'),
  end_date TEXT NOT NULL CHECK (end_date ~ '^\d{4}-\d{2}-\d{2}$'),
  end_time TEXT NOT NULL DEFAULT 'TBA' CHECK (end_time = 'TBA' OR end_time ~ '^\d{2}:\d{2}$'),
  location TEXT NOT NULL DEFAULT 'Mumbai, India',
  address TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  official_url TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  -- The page it was imported from, to catch the same link twice.
  source_url TEXT,
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('PRIMARY', 'HIGH', 'NORMAL')),
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS app_events_source_idx ON app_events (source_url) WHERE source_url IS NOT NULL;

ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

-- Everyone, website included, reads them (hidden rows too: they hide built-in events).
DROP POLICY IF EXISTS "Everyone reads events" ON app_events;
CREATE POLICY "Everyone reads events" ON app_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins add events" ON app_events;
CREATE POLICY "Admins add events" ON app_events FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins change events" ON app_events;
CREATE POLICY "Admins change events" ON app_events FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins delete events" ON app_events;
CREATE POLICY "Admins delete events" ON app_events FOR DELETE TO authenticated USING (is_admin());
