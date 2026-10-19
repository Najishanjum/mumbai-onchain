-- Admins: the in-app admin mode (Me → Switch to admin). New places wait for
-- an admin's approval; admins can also take down stories and reviews and send
-- notifications. Every admin power is checked here, not only in the app.
-- Safe to re-run.

-- ── Who's an admin ───────────────────────────────────────────────────────
-- 'owner' can add and remove admins; 'admin' moderates.
CREATE TABLE IF NOT EXISTS app_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER so policies can ask without reading app_admins themselves.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM app_admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM app_admins WHERE user_id = auth.uid() AND role = 'owner');
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_owner() TO anon, authenticated;

-- Admins see the team; only owners change it. Owners add admins (not other
-- owners: those are added here, in SQL) and can't remove themselves.
DROP POLICY IF EXISTS "Admins see the team" ON app_admins;
CREATE POLICY "Admins see the team" ON app_admins
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Owners add admins" ON app_admins;
CREATE POLICY "Owners add admins" ON app_admins
  FOR INSERT TO authenticated WITH CHECK (is_owner() AND role = 'admin' AND added_by = auth.uid());

DROP POLICY IF EXISTS "Owners remove admins" ON app_admins;
CREATE POLICY "Owners remove admins" ON app_admins
  FOR DELETE TO authenticated USING (is_owner() AND user_id <> auth.uid());

-- ── Places wait for review ───────────────────────────────────────────────
ALTER TABLE community_places
  ALTER COLUMN status SET DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Live places are public" ON community_places;
CREATE POLICY "Live places are public" ON community_places
  FOR SELECT USING (status = 'live' OR owner_id = auth.uid() OR is_admin());

-- Members' places start pending; an admin's can go live straight away.
DROP POLICY IF EXISTS "Add places as yourself" ON community_places;
CREATE POLICY "Add places as yourself" ON community_places
  FOR INSERT TO authenticated WITH CHECK (
    owner_id = auth.uid()
    AND (status = 'pending' OR (status = 'live' AND is_admin()))
    AND (added_by_profile_id IS NULL OR added_by_profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid()))
  );

-- Editing your own place sends it back for review, so nobody can approve
-- their own (or change a live place into something else).
DROP POLICY IF EXISTS "Edit your own places" ON community_places;
CREATE POLICY "Edit your own places" ON community_places
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND status <> 'hidden')
  WITH CHECK (owner_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Admins review places" ON community_places;
CREATE POLICY "Admins review places" ON community_places
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins remove places" ON community_places;
CREATE POLICY "Admins remove places" ON community_places
  FOR DELETE TO authenticated USING (is_admin());

-- ── Taking down stories and reviews ──────────────────────────────────────
DROP POLICY IF EXISTS "Admins take down snaps" ON snaps;
CREATE POLICY "Admins take down snaps" ON snaps
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins delete snap photos" ON storage.objects;
CREATE POLICY "Admins delete snap photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'snaps' AND is_admin());

DROP POLICY IF EXISTS "Admins remove ratings" ON place_ratings;
CREATE POLICY "Admins remove ratings" ON place_ratings
  FOR DELETE TO authenticated USING (is_admin());

-- ── Overview numbers ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_overview()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN jsonb_build_object(
    'people', (SELECT COUNT(*) FROM profiles WHERE owner_id IS NOT NULL),
    'accounts', (SELECT COUNT(*) FROM auth.users),
    'stories_24h', (SELECT COUNT(*) FROM snaps WHERE created_at > NOW() - INTERVAL '24 hours'),
    'replies_24h', (SELECT COUNT(*) FROM story_replies WHERE created_at > NOW() - INTERVAL '24 hours'),
    'places_pending', (SELECT COUNT(*) FROM community_places WHERE status = 'pending'),
    'places_live', (SELECT COUNT(*) FROM community_places WHERE status = 'live'),
    'push_people', (SELECT COUNT(DISTINCT user_id) FROM push_subscriptions),
    'push_devices', (SELECT COUNT(*) FROM push_subscriptions)
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_overview() TO authenticated;

-- ── The first owner ──────────────────────────────────────────────────────
-- Nimsara, by the X handle on their profile. Add more owners the same way.
INSERT INTO app_admins (user_id, role)
SELECT owner_id, 'owner'
  FROM profiles
 WHERE lower(regexp_replace(x_handle, '^(https?://)?(www\.)?(x|twitter)\.com/|^@', '', 'i')) = 'nimsaraonline'
   AND owner_id IS NOT NULL
 ORDER BY updated_at DESC NULLS LAST
 LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
