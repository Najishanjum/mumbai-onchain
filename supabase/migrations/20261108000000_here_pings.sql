-- "I'm here" pings for people going: when someone checks in, people who
-- marked that event Going hear about it. Big events have hundreds going, so
-- each person gets at most one of these per event per hour; this remembers
-- when. Only the notify-connection function (service role) reads or writes
-- it. Safe to re-run.

CREATE TABLE IF NOT EXISTS here_pings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE here_pings ENABLE ROW LEVEL SECURITY;
-- No policies: the app never touches it.
