-- What admins did, page by page: the history behind the clock icon on each
-- admin page. The app writes a row with every action; the name is filled in
-- here from the admin's profile. The first run also brings in what earlier
-- actions left behind (reviewed places and partners, notifications sent,
-- events added, admins added). Safe to re-run.

CREATE TABLE IF NOT EXISTS admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '' CHECK (length(actor_name) <= 80),
  page TEXT NOT NULL CHECK (page IN ('events', 'places', 'stories', 'partners', 'notify', 'team')),
  kind TEXT NOT NULL CHECK (length(kind) BETWEEN 1 AND 40),
  detail TEXT NOT NULL DEFAULT '' CHECK (length(detail) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_activity_page_idx ON admin_activity (page, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_time_idx ON admin_activity (created_at DESC);

ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read activity" ON admin_activity;
CREATE POLICY "Admins read activity" ON admin_activity FOR SELECT TO authenticated USING (is_admin());

-- Only as yourself, and only now (no back-dated rows). No edits or deletes.
DROP POLICY IF EXISTS "Admins log their actions" ON admin_activity;
CREATE POLICY "Admins log their actions" ON admin_activity FOR INSERT TO authenticated WITH CHECK (
  is_admin() AND actor_id = auth.uid() AND created_at > NOW() - INTERVAL '1 minute'
);

CREATE OR REPLACE FUNCTION admin_activity_name()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.actor_name := COALESCE(
    (SELECT left(name, 80) FROM profiles WHERE owner_id = NEW.actor_id ORDER BY created_at DESC LIMIT 1),
    'An admin'
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS admin_activity_name ON admin_activity;
CREATE TRIGGER admin_activity_name BEFORE INSERT ON admin_activity FOR EACH ROW EXECUTE FUNCTION admin_activity_name();

-- ── Earlier actions, once ───────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM admin_activity) THEN
    RETURN;
  END IF;

  INSERT INTO admin_activity (actor_id, page, kind, detail, created_at)
  SELECT reviewed_by, 'places', CASE status WHEN 'live' THEN 'place_approved' ELSE 'place_hidden' END, name, reviewed_at
  FROM community_places WHERE reviewed_at IS NOT NULL AND status <> 'pending';

  INSERT INTO admin_activity (actor_id, page, kind, detail, created_at)
  SELECT reviewed_by, 'partners', CASE status WHEN 'approved' THEN 'partner_approved' ELSE 'partner_rejected' END, community_name, reviewed_at
  FROM community_partner_applications WHERE reviewed_at IS NOT NULL AND status <> 'pending';

  INSERT INTO admin_activity (actor_id, page, kind, detail, created_at)
  SELECT sender_id, 'notify', 'broadcast_sent', left('“' || title || '”, to ' || CASE audience WHEN 'leads' THEN 'community leads, ' ELSE '' END || recipients || ' phones', 300), COALESCE(sent_at, created_at)
  FROM broadcasts WHERE community_id IS NULL AND status = 'sent';

  INSERT INTO admin_activity (actor_id, page, kind, detail, created_at)
  SELECT b.reviewed_by, 'notify', CASE b.status WHEN 'sent' THEN 'request_approved' ELSE 'request_declined' END,
         left('“' || b.title || '” from ' || COALESCE(c.community_name, 'a community'), 300), b.reviewed_at
  FROM broadcasts b LEFT JOIN community_partner_applications c ON c.id = b.community_id
  WHERE b.community_id IS NOT NULL AND b.reviewed_at IS NOT NULL;

  INSERT INTO admin_activity (actor_id, page, kind, detail, created_at)
  SELECT created_by, 'events', 'event_added', left(title, 300), created_at
  FROM app_events WHERE created_by IS NOT NULL;

  INSERT INTO admin_activity (actor_id, page, kind, detail, created_at)
  SELECT a.added_by, 'team', 'admin_added',
         COALESCE((SELECT name FROM profiles p WHERE p.owner_id = a.user_id ORDER BY p.created_at DESC LIMIT 1), 'Someone'), a.created_at
  FROM app_admins a WHERE a.added_by IS NOT NULL;
END;
$$;
