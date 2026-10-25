-- Up to 3 communities each, counting the ones you lead: a lead of one can
-- join two more. Leads themselves (linked by email or a claim code) are never
-- blocked by it. Safe to re-run.

CREATE OR REPLACE FUNCTION community_member_rules()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'member' THEN
    IF (SELECT count(*) FROM community_members WHERE user_id = NEW.user_id) >= 3 THEN
      RAISE EXCEPTION 'You can be in up to 3 communities. Leave one first.';
    END IF;
    NEW.credited := NOT EXISTS (SELECT 1 FROM community_members WHERE user_id = NEW.user_id AND credited);
  ELSE
    NEW.credited := false;
  END IF;
  RETURN NEW;
END;
$$;
