-- The ring around team members' photos: which profiles belong to the
-- Mumbai Onchain team (app_admins). Only profile ids come out, never the
-- admin list itself. Community leads come from community_members. Safe to re-run.
CREATE OR REPLACE FUNCTION team_profile_ids()
RETURNS SETOF TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id FROM profiles p JOIN app_admins a ON a.user_id = p.owner_id;
$$;
GRANT EXECUTE ON FUNCTION team_profile_ids() TO anon, authenticated;
