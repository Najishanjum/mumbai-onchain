-- Web push: one row per phone (or browser) that allowed notifications.
-- The app saves its push subscription here after sign-in; the send-push Edge
-- Function reads them with the service role to deliver notifications.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- People manage only their own devices. Nobody can read anyone else's.
DROP POLICY IF EXISTS "Own push subscriptions read" ON push_subscriptions;
CREATE POLICY "Own push subscriptions read" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own push subscriptions insert" ON push_subscriptions;
CREATE POLICY "Own push subscriptions insert" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own push subscriptions update" ON push_subscriptions;
CREATE POLICY "Own push subscriptions update" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own push subscriptions delete" ON push_subscriptions;
CREATE POLICY "Own push subscriptions delete" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
