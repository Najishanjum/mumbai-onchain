-- Saved events in the account, so a saved event can remind you with a push
-- 15 minutes before it starts, even with the app closed (event-reminders
-- function, run every few minutes by supabase/cron/event-reminders.sql).
-- Events live in the app, so each row carries the title, venue and start
-- the app knew when saving. Safe to re-run.

CREATE TABLE IF NOT EXISTS saved_events (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '' CHECK (length(title) <= 200),
  venue TEXT NOT NULL DEFAULT '' CHECK (length(venue) <= 200),
  -- Null when the time isn't announced yet: no reminder.
  starts_at TIMESTAMPTZ,
  reminded_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

-- The reminder run looks for what starts soon and hasn't been sent.
CREATE INDEX IF NOT EXISTS saved_events_due_idx ON saved_events (starts_at) WHERE reminded_at IS NULL;

ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own saved events" ON saved_events;
CREATE POLICY "Own saved events" ON saved_events
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- A moved start time means a fresh reminder.
CREATE OR REPLACE FUNCTION saved_events_time_changed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.starts_at IS DISTINCT FROM OLD.starts_at THEN NEW.reminded_at := NULL; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS saved_events_time_changed ON saved_events;
CREATE TRIGGER saved_events_time_changed BEFORE UPDATE ON saved_events
  FOR EACH ROW EXECUTE FUNCTION saved_events_time_changed();
