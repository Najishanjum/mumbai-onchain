-- Community partner applications are reviewed in admin mode (Partners tab),
-- and only admins can read or change them. Najish and Moinuddin join the
-- team as admins. Run after 20261020000000_admins.sql. Safe to re-run.

-- ── The team ─────────────────────────────────────────────────────────────
-- Najish (both his accounts) and Moinuddin, by the X handle on their profile.
INSERT INTO app_admins (user_id, role, added_by)
SELECT DISTINCT owner_id, 'admin', (SELECT user_id FROM app_admins WHERE role = 'owner' ORDER BY created_at LIMIT 1)
  FROM profiles
 WHERE lower(regexp_replace(x_handle, '^(https?://)?(www\.)?(x|twitter)\.com/|^@', '', 'i')) IN ('najish_anjum', 'md_moinuddin1')
   AND owner_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- ── Applications: admins only ────────────────────────────────────────────
ALTER TABLE community_partner_applications
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  -- Set by notify-connection so each application tells the admins once.
  ADD COLUMN IF NOT EXISTS admins_notified_at TIMESTAMPTZ;

-- Was any signed-in user, which is everyone using the app.
DROP POLICY IF EXISTS "Authenticated admins can view partner applications" ON community_partner_applications;
DROP POLICY IF EXISTS "Admins read partner applications" ON community_partner_applications;
CREATE POLICY "Admins read partner applications" ON community_partner_applications
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Authenticated admins can update partner applications" ON community_partner_applications;
DROP POLICY IF EXISTS "Admins review partner applications" ON community_partner_applications;
CREATE POLICY "Admins review partner applications" ON community_partner_applications
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins delete partner applications" ON community_partner_applications;
CREATE POLICY "Admins delete partner applications" ON community_partner_applications
  FOR DELETE TO authenticated USING (is_admin());

-- Applying stays open to everyone, as a fresh pending application.
DROP POLICY IF EXISTS "Public can submit partner application" ON community_partner_applications;
CREATE POLICY "Public can submit partner application" ON community_partner_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND reviewed_by IS NULL AND admins_notified_at IS NULL);

-- ── Approved partners, for everyone ──────────────────────────────────────
-- The public grid reads this: approved rows only, no email or phone. A view
-- runs as its owner, so visitors see it without reading the table.
CREATE OR REPLACE VIEW community_partners_public AS
SELECT id, community_name, community_logo_url, community_description,
       website_url, x_url, instagram_url, linkedin_url, telegram_url, discord_url, created_at
  FROM community_partner_applications
 WHERE status = 'approved';

GRANT SELECT ON community_partners_public TO anon, authenticated;

-- Admins can tidy up logos (anyone can still upload one while applying).
DROP POLICY IF EXISTS "Admins delete community logos" ON storage.objects;
CREATE POLICY "Admins delete community logos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'community-logos' AND is_admin());

-- ── Overview numbers, now with partners ──────────────────────────────────
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
    'partners_pending', (SELECT COUNT(*) FROM community_partner_applications WHERE status = 'pending'),
    'partners_approved', (SELECT COUNT(*) FROM community_partner_applications WHERE status = 'approved'),
    'push_people', (SELECT COUNT(DISTINCT user_id) FROM push_subscriptions),
    'push_devices', (SELECT COUNT(*) FROM push_subscriptions)
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_overview() TO authenticated;
