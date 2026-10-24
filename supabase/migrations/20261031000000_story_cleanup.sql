-- Stories with no event are deleted 48 hours after posting; stories tagged
-- with an event stay as Highlights (profile and event page), and the team's
-- stories always stay. The story-cleanup function does the deleting (photos
-- live in Storage, which SQL can't remove); see supabase/cron/story-cleanup.sql.
--
-- Only stories posted after this migration ran are ever deleted: the time is
-- kept below, so nothing posted before the rule existed disappears.
-- Safe to re-run (keeps the first time).

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (functions) reads or writes it.

-- ISO time, so the function can read it as a date.
INSERT INTO app_settings (key, value) VALUES ('story_cleanup_since', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_snaps_general_created ON snaps (created_at) WHERE event_id = 'general';
