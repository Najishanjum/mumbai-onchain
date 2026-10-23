-- Community spaces, phase 1: approved partners get a link name, leaders and
-- members. A leader is linked by the application email, or with a one-use
-- claim code an admin (or another leader) hands over. Members join through a
-- community's link or pick it themselves, up to 3 communities each; the first
-- one gets the credit. Safe to re-run.

-- ── Link names: /app?c=bharat-blockspace ─────────────────────────────────
ALTER TABLE community_partner_applications ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE OR REPLACE FUNCTION community_slug_base(p_name TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(nullif(trim(BOTH '-' FROM regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g')), ''), 'community');
$$;

UPDATE community_partner_applications SET slug = community_slug_base(community_name) WHERE slug IS NULL OR slug = '';
-- Same name twice: the later one gets a short suffix.
UPDATE community_partner_applications a SET slug = a.slug || '-' || left(a.id::text, 4)
 WHERE EXISTS (SELECT 1 FROM community_partner_applications b WHERE b.slug = a.slug AND b.created_at < a.created_at);
CREATE UNIQUE INDEX IF NOT EXISTS community_partner_slug_idx ON community_partner_applications (slug);

-- Applicants can't pick their own: it's always made from the name.
-- Runs as the owner: applicants can't read other applications to check names.
CREATE OR REPLACE FUNCTION set_community_slug()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.slug := community_slug_base(NEW.community_name);
  IF EXISTS (SELECT 1 FROM community_partner_applications WHERE slug = NEW.slug AND id <> NEW.id) THEN
    NEW.slug := NEW.slug || '-' || left(NEW.id::text, 4);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS community_slug ON community_partner_applications;
CREATE TRIGGER community_slug BEFORE INSERT ON community_partner_applications
  FOR EACH ROW EXECUTE FUNCTION set_community_slug();

-- New column goes last so the view can be replaced in place.
CREATE OR REPLACE VIEW community_partners_public AS
SELECT id, community_name, community_logo_url, community_description,
       website_url, x_url, instagram_url, linkedin_url, telegram_url, discord_url, created_at,
       whatsapp_url, slug
  FROM community_partner_applications
 WHERE status = 'approved';

-- ── Members and leaders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL REFERENCES community_partner_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  -- link: their referral link · picked: chose it · email: application email · claim: claim code
  joined_via TEXT NOT NULL DEFAULT 'picked' CHECK (joined_via IN ('link', 'picked', 'email', 'claim')),
  -- The first community a member joined gets them in its numbers.
  credited BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);
CREATE INDEX IF NOT EXISTS community_members_user_idx ON community_members (user_id);

CREATE OR REPLACE FUNCTION community_member_rules()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'member' THEN
    IF (SELECT count(*) FROM community_members WHERE user_id = NEW.user_id AND role = 'member') >= 3 THEN
      RAISE EXCEPTION 'You can be in up to 3 communities. Leave one first.';
    END IF;
    NEW.credited := NOT EXISTS (SELECT 1 FROM community_members WHERE user_id = NEW.user_id AND credited);
  ELSE
    NEW.credited := false;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS community_member_rules ON community_members;
CREATE TRIGGER community_member_rules BEFORE INSERT ON community_members
  FOR EACH ROW EXECUTE FUNCTION community_member_rules();

CREATE OR REPLACE FUNCTION is_community_lead(p_community_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members WHERE community_id = p_community_id AND user_id = auth.uid() AND role = 'lead'
  );
$$;
GRANT EXECUTE ON FUNCTION is_community_lead(UUID) TO authenticated;

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Members are public among signed-in people, like profiles. No emails here.
DROP POLICY IF EXISTS "See community members" ON community_members;
CREATE POLICY "See community members" ON community_members
  FOR SELECT TO authenticated USING (true);

-- Joining as a member, yourself, an approved community. Leaders come in
-- through community_auto_link() or claim_community() only.
DROP POLICY IF EXISTS "Join a community" ON community_members;
CREATE POLICY "Join a community" ON community_members
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND joined_via IN ('link', 'picked')
    AND profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid())
    AND community_id IN (SELECT id FROM community_partners_public)
  );

DROP POLICY IF EXISTS "Leave a community" ON community_members;
CREATE POLICY "Leave a community" ON community_members
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_admin());

-- Admins change roles (e.g. a leader back to member).
DROP POLICY IF EXISTS "Admins change roles" ON community_members;
CREATE POLICY "Admins change roles" ON community_members
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ── Claim codes ──────────────────────────────────────────────────────────
-- 8 characters without look-alikes (no 0/O, 1/I), easy to type from WhatsApp.
CREATE OR REPLACE FUNCTION gen_claim_code()
RETURNS TEXT LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes BYTEA := uuid_send(gen_random_uuid());
  code TEXT := '';
  i INT;
BEGIN
  -- Bytes 0-5 and 10-11 of a v4 UUID are fully random; 256 divides by 32.
  FOREACH i IN ARRAY ARRAY[0, 1, 2, 3, 4, 5, 10, 11] LOOP
    code := code || substr(alphabet, get_byte(bytes, i) % 32 + 1, 1);
  END LOOP;
  RETURN code;
END;
$$;

CREATE TABLE IF NOT EXISTS community_claims (
  code TEXT PRIMARY KEY DEFAULT gen_claim_code(),
  community_id UUID NOT NULL REFERENCES community_partner_applications(id) ON DELETE CASCADE,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ
);

ALTER TABLE community_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and leaders see claim codes" ON community_claims;
CREATE POLICY "Admins and leaders see claim codes" ON community_claims
  FOR SELECT TO authenticated USING (is_admin() OR is_community_lead(community_id));

DROP POLICY IF EXISTS "Admins and leaders make claim codes" ON community_claims;
CREATE POLICY "Admins and leaders make claim codes" ON community_claims
  FOR INSERT TO authenticated WITH CHECK (
    (is_admin() OR is_community_lead(community_id))
    AND created_by = auth.uid()
    AND used_by IS NULL AND used_at IS NULL
    AND expires_at <= NOW() + INTERVAL '8 days'
  );

-- ── Becoming a leader ────────────────────────────────────────────────────
-- Signed in with the email the community applied with: you lead it.
CREATE OR REPLACE FUNCTION community_auto_link()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me_email TEXT := lower(coalesce(auth.jwt() ->> 'email', ''));
  me_profile TEXT;
  linked INT;
BEGIN
  IF auth.uid() IS NULL OR me_email = '' THEN RETURN 0; END IF;
  SELECT id INTO me_profile FROM profiles WHERE owner_id = auth.uid() ORDER BY created_at DESC LIMIT 1;
  IF me_profile IS NULL THEN RETURN 0; END IF;
  INSERT INTO community_members (community_id, user_id, profile_id, role, joined_via)
  SELECT a.id, auth.uid(), me_profile, 'lead', 'email'
    FROM community_partner_applications a
   WHERE a.status = 'approved' AND lower(trim(a.email)) = me_email
  ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'lead' WHERE community_members.role <> 'lead';
  GET DIAGNOSTICS linked = ROW_COUNT;
  RETURN linked;
END;
$$;
GRANT EXECUTE ON FUNCTION community_auto_link() TO authenticated;

-- A claim code from an admin or another leader: you lead it. One use.
CREATE OR REPLACE FUNCTION claim_community(p_code TEXT)
RETURNS TABLE (community_id UUID, community_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c community_claims;
  me_profile TEXT;
  name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first.'; END IF;
  SELECT id INTO me_profile FROM profiles WHERE owner_id = auth.uid() ORDER BY created_at DESC LIMIT 1;
  IF me_profile IS NULL THEN RAISE EXCEPTION 'Make your pass first, then use the code.'; END IF;

  SELECT * INTO c FROM community_claims WHERE code = upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g')) FOR UPDATE;
  IF c.code IS NULL OR c.used_at IS NOT NULL OR c.expires_at < NOW() THEN
    RAISE EXCEPTION 'That code doesn''t work. It may be used or expired; ask for a new one.';
  END IF;
  SELECT a.community_name INTO name FROM community_partner_applications a WHERE a.id = c.community_id AND a.status = 'approved';
  IF name IS NULL THEN RAISE EXCEPTION 'That community isn''t listed right now.'; END IF;

  INSERT INTO community_members (community_id, user_id, profile_id, role, joined_via)
  VALUES (c.community_id, auth.uid(), me_profile, 'lead', 'claim')
  ON CONFLICT ON CONSTRAINT community_members_pkey DO UPDATE SET role = 'lead';
  UPDATE community_claims SET used_by = auth.uid(), used_at = NOW() WHERE code = c.code;

  community_id := c.community_id;
  community_name := name;
  RETURN NEXT;
END;
$$;
GRANT EXECUTE ON FUNCTION claim_community(TEXT) TO authenticated;
