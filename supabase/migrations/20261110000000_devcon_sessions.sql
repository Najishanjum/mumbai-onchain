-- Devcon 8's programme (3-6 Nov): every stage and hub session, copied from
-- Devcon's site by the devcon-sync function every 30 minutes
-- (supabase/cron/devcon-sync.sql), so times stay current when talks move.
-- Saving a session uses saved_events like any event (event_id 'dc-<code>'),
-- so it shows in My plan and gets the 15-minute reminder. Safe to re-run.

CREATE TABLE IF NOT EXISTS devcon_sessions (
  code TEXT PRIMARY KEY,
  day DATE NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  room TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT '',
  track TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  -- [{ name, avatar?, x? }]
  speakers JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  slides TEXT NOT NULL DEFAULT '',
  -- The session's page in Devcon's app; empty for hub sessions, which have none.
  url TEXT NOT NULL DEFAULT '',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS devcon_sessions_day_idx ON devcon_sessions (day, starts_at);

ALTER TABLE devcon_sessions ENABLE ROW LEVEL SECURITY;

-- Public programme: anyone can read it; only the function (service role) writes.
DROP POLICY IF EXISTS "Devcon sessions are public" ON devcon_sessions;
CREATE POLICY "Devcon sessions are public" ON devcon_sessions FOR SELECT USING (true);

-- A talk that moves moves in everyone's plan too, so the reminder comes at
-- the new time (saved_events resets reminded_at when starts_at changes).
CREATE OR REPLACE FUNCTION devcon_session_moved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE saved_events SET starts_at = NEW.starts_at, title = left(NEW.title, 200)
  WHERE event_id = 'dc-' || NEW.code AND starts_at IS DISTINCT FROM NEW.starts_at;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS devcon_session_moved ON devcon_sessions;
CREATE TRIGGER devcon_session_moved AFTER UPDATE OF starts_at ON devcon_sessions
  FOR EACH ROW WHEN (NEW.starts_at IS DISTINCT FROM OLD.starts_at) EXECUTE FUNCTION devcon_session_moved();
