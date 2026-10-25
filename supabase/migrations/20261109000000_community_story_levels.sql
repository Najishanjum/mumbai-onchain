-- Community stories by level, like a Telegram channel's boosts:
--   Partner   no community stories
--   Rising    1 a day, seen by the community's members
--   Featured  3 a day, seen by members
--   Champion  3 a day, seen by everyone in the app
-- Members-only stories are hidden from everyone else here, not just in the
-- app. Personal stories are unchanged (everyone). Safe to re-run.

ALTER TABLE snaps ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'everyone';
ALTER TABLE snaps DROP CONSTRAINT IF EXISTS snaps_audience_check;
ALTER TABLE snaps ADD CONSTRAINT snaps_audience_check CHECK (audience IN ('everyone', 'members'));
CREATE INDEX IF NOT EXISTS snaps_community_idx ON snaps (community_id, created_at DESC) WHERE community_id IS NOT NULL;

-- Who sees what: everyone's public snaps, and a community's members-only
-- stories for its members, its leads, admins and whoever posted it.
DROP POLICY IF EXISTS "Public snaps are viewable by everyone" ON snaps;
DROP POLICY IF EXISTS "See snaps" ON snaps;
CREATE POLICY "See snaps" ON snaps FOR SELECT USING (
  visibility = 'public'
  AND (
    audience = 'everyone'
    OR community_id IS NULL
    OR owner_id = auth.uid()
    OR is_admin()
    OR community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
  )
);

-- Posting as a community: its leads, from Rising, within the day's limit.
-- Below Champion a story is always for members, whatever the app sent.
CREATE OR REPLACE FUNCTION check_community_snap()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  lvl SMALLINT;
  per_day INT;
  today INT;
BEGIN
  IF NEW.community_id IS NULL THEN
    NEW.audience := 'everyone';
    RETURN NEW;
  END IF;
  IF auth.role() = 'service_role' OR (TG_OP = 'UPDATE' AND NEW.community_id IS NOT DISTINCT FROM OLD.community_id AND NEW.audience IS NOT DISTINCT FROM OLD.audience) THEN
    RETURN NEW;
  END IF;
  lvl := COALESCE(community_level(NEW.community_id), 0);
  IF NOT is_community_lead(NEW.community_id) OR lvl < 1 THEN
    RAISE EXCEPTION 'Community stories unlock at Rising: 15 counted members';
  END IF;
  IF lvl < 3 THEN
    NEW.audience := 'members';
  END IF;
  IF TG_OP = 'INSERT' THEN
    per_day := CASE WHEN lvl >= 2 THEN 3 ELSE 1 END;
    SELECT count(*) INTO today FROM snaps WHERE community_id = NEW.community_id AND created_at > NOW() - INTERVAL '24 hours';
    IF today >= per_day THEN
      RAISE EXCEPTION 'That''s % community stor% in the last 24 hours, the most at this level', per_day, CASE WHEN per_day = 1 THEN 'y' ELSE 'ies' END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS snaps_community_check ON snaps;
CREATE TRIGGER snaps_community_check BEFORE INSERT OR UPDATE OF community_id, audience ON snaps
  FOR EACH ROW EXECUTE FUNCTION check_community_snap();
