-- Community levels: what a partner community unlocks as it brings people in.
--   0 Partner   approved            page, invite link, card, messages (2 a day)
--   1 Rising    15 counted members  community stories, posted as the community
--   2 Featured  50                  "Featured communities" on Today, 3 messages a day
--   3 Champion  100                 pinned on the Partners page, one message to
--                                   everyone without waiting for an admin
-- Counted: members whose first community this is (credited), with a photo or
-- a headline on their profile, so empty sign-ups don't level anyone up.
-- A level, once reached, stays. Admins can set one by hand (level_override),
-- which wins over the count. Safe to re-run.

ALTER TABLE community_partner_applications
  ADD COLUMN IF NOT EXISTS level_reached SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level_override SMALLINT;
ALTER TABLE community_partner_applications DROP CONSTRAINT IF EXISTS community_level_range;
ALTER TABLE community_partner_applications ADD CONSTRAINT community_level_range
  CHECK (level_reached BETWEEN 0 AND 3 AND (level_override IS NULL OR level_override BETWEEN 0 AND 3));

CREATE OR REPLACE FUNCTION community_counted(p_community_id UUID)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int
  FROM community_members m JOIN profiles p ON p.id = m.profile_id
  WHERE m.community_id = p_community_id
    AND m.credited
    AND (COALESCE(p.avatar, '') <> '' OR COALESCE(btrim(p.headline), '') <> '');
$$;

CREATE OR REPLACE FUNCTION level_for_count(n INT)
RETURNS SMALLINT LANGUAGE sql IMMUTABLE AS $$
  SELECT (CASE WHEN n >= 100 THEN 3 WHEN n >= 50 THEN 2 WHEN n >= 15 THEN 1 ELSE 0 END)::smallint;
$$;

CREATE OR REPLACE FUNCTION community_level(p_community_id UUID)
RETURNS SMALLINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(c.level_override, GREATEST(c.level_reached, level_for_count(community_counted(c.id))))
  FROM community_partner_applications c
  WHERE c.id = p_community_id AND c.status = 'approved';
$$;

-- Every listed community's level and count, for the app and the Partners page.
CREATE OR REPLACE FUNCTION community_levels()
RETURNS TABLE (community_id UUID, level SMALLINT, counted INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, community_level(c.id), community_counted(c.id)
  FROM community_partner_applications c
  WHERE c.status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION community_counted(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION community_level(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION community_levels() TO anon, authenticated;

-- Communities that just went up a level: records it and returns them, once.
-- Only the server calls it (event-reminders, every 5 minutes), to push the leads.
CREATE OR REPLACE FUNCTION claim_level_ups()
RETURNS TABLE (community_id UUID, community_name TEXT, level SMALLINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH now_at AS (
    SELECT c.id, community_level(c.id) AS lvl
    FROM community_partner_applications c
    WHERE c.status = 'approved'
  )
  UPDATE community_partner_applications c
  SET level_reached = n.lvl
  FROM now_at n
  WHERE c.id = n.id AND n.lvl > c.level_reached
  RETURNING c.id, c.community_name, c.level_reached;
$$;
REVOKE EXECUTE ON FUNCTION claim_level_ups() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_level_ups() TO service_role;

-- ── Community stories (Rising and up) ────────────────────────────────────
-- A lead can post a story as their community: it shows with the community's
-- name and logo. Checked here, so an older or edited app can't skip it.
ALTER TABLE snaps ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES community_partner_applications(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION check_community_snap()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.community_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.community_id IS DISTINCT FROM OLD.community_id)
     AND NOT (is_community_lead(NEW.community_id) AND COALESCE(community_level(NEW.community_id), 0) >= 1)
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only leads of a Rising community can post as it';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS snaps_community_check ON snaps;
CREATE TRIGGER snaps_community_check BEFORE INSERT OR UPDATE OF community_id ON snaps
  FOR EACH ROW EXECUTE FUNCTION check_community_snap();
