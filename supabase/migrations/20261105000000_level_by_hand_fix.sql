-- A level set by hand no longer sticks after it's cleared. Before, the push
-- job recorded it as "reached", so switching back to "By count" kept it.
-- Now level_reached only follows the member count, and level_announced
-- remembers which level the leads were last told about. Safe to re-run.

ALTER TABLE community_partner_applications ADD COLUMN IF NOT EXISTS level_announced SMALLINT NOT NULL DEFAULT 0;

-- Keep what was announced; put level_reached back to what the count earned.
UPDATE community_partner_applications
SET level_announced = GREATEST(level_announced, level_reached)
WHERE level_reached > level_announced;
UPDATE community_partner_applications c
SET level_reached = level_for_count(community_counted(c.id))
WHERE level_reached > level_for_count(community_counted(c.id));

-- Records count-earned levels (they stay) and returns communities whose
-- current level is above what their leads were told, once each.
CREATE OR REPLACE FUNCTION claim_level_ups()
RETURNS TABLE (community_id UUID, community_name TEXT, level SMALLINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE community_partner_applications c
  SET level_reached = level_for_count(community_counted(c.id))
  WHERE c.status = 'approved' AND level_for_count(community_counted(c.id)) > c.level_reached;

  RETURN QUERY
  WITH now_at AS (
    SELECT c.id, community_level(c.id) AS lvl
    FROM community_partner_applications c
    WHERE c.status = 'approved'
  )
  UPDATE community_partner_applications c
  SET level_announced = n.lvl
  FROM now_at n
  WHERE c.id = n.id AND n.lvl > c.level_announced
  RETURNING c.id, c.community_name, c.level_announced;
END;
$$;
REVOKE EXECUTE ON FUNCTION claim_level_ups() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_level_ups() TO service_role;
