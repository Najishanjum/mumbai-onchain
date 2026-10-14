-- ====================================================================
-- MUMBAI ONCHAIN: ACCOUNTS + LOCKED-DOWN ROW LEVEL SECURITY
-- Run once in the Supabase SQL Editor (or `psql -f`). Safe to re-run.
--
-- Before: anyone with the public key could edit any profile and delete any
-- snap or photo; any signed-in user could rewrite the event schedule and
-- read everyone's notes. After: people sign in with an email code and can
-- only change what they own.
-- ====================================================================

-- ── 1. Profiles belong to an account ─────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Fields the app already collects but the table couldn't store, so other
  -- people (and match suggestions) never saw them.
  ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS currently_building TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS looking_for TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS telegram_handle TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS farcaster_handle TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT '';

-- One profile per account.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_owner_id ON profiles(owner_id) WHERE owner_id IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can insert community profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can update community profiles" ON profiles;
DROP POLICY IF EXISTS "Owners create their profile" ON profiles;
DROP POLICY IF EXISTS "Owners update their profile" ON profiles;
DROP POLICY IF EXISTS "Owners delete their profile" ON profiles;

-- Reading stays public ("Community profiles are viewable by everyone").
CREATE POLICY "Owners create their profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update their profile" ON profiles
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete their profile" ON profiles
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Profiles made before accounts existed have no owner. The app knows the
-- profile ID it created on that phone and claims it on first sign-in.
-- Trade-off: a determined person could claim another legacy profile by ID
-- (IDs are visible). It only applies to rows created before this migration
-- and with no owner yet; drop the function once people have signed in.
CREATE OR REPLACE FUNCTION claim_profile(p_profile_id TEXT)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in first';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'This account already has a profile';
  END IF;
  UPDATE profiles
     SET owner_id = auth.uid(), updated_at = NOW()
   WHERE id = p_profile_id
     AND owner_id IS NULL
     AND created_at < '2026-10-15T00:00:00Z'
  RETURNING * INTO claimed;
  RETURN claimed; -- NULL when there was nothing to claim
END;
$$;
REVOKE ALL ON FUNCTION claim_profile(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION claim_profile(TEXT) TO authenticated;

-- ── 2. Snaps belong to an account ────────────────────────────────────
ALTER TABLE snaps ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can insert public snaps" ON snaps;
DROP POLICY IF EXISTS "Users can delete their own snaps" ON snaps;
DROP POLICY IF EXISTS "Users can update reactions" ON snaps;
DROP POLICY IF EXISTS "Owners post snaps" ON snaps;
DROP POLICY IF EXISTS "Owners update their snaps" ON snaps;
DROP POLICY IF EXISTS "Owners delete their snaps" ON snaps;

CREATE POLICY "Owners post snaps" ON snaps
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update their snaps" ON snaps
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete their snaps" ON snaps
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Reactions: anyone signed in can react, but only the counts change.
CREATE OR REPLACE FUNCTION react_to_snap(p_snap_id TEXT, p_reaction TEXT, p_delta INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in first';
  END IF;
  IF p_reaction NOT IN ('heart', 'fire', 'eyes', 'clap') OR p_delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Invalid reaction';
  END IF;
  UPDATE snaps
     SET reactions = jsonb_set(
           COALESCE(reactions, '{}'::jsonb),
           ARRAY[p_reaction],
           to_jsonb(GREATEST(0, COALESCE((reactions ->> p_reaction)::INT, 0) + p_delta))
         )
   WHERE id = p_snap_id AND visibility = 'public'
  RETURNING reactions INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION react_to_snap(TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION react_to_snap(TEXT, TEXT, INT) TO authenticated;

-- ── 3. Storage: photos live in a folder named after the account ──────
-- snaps/<user id>/<file>, avatars/<user id>/<file>
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public snaps bucket upload" ON storage.objects;
DROP POLICY IF EXISTS "Public snaps bucket delete" ON storage.objects;
DROP POLICY IF EXISTS "Owners upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners replace photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars bucket read" ON storage.objects;

CREATE POLICY "Public avatars bucket read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Owners upload photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('snaps', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners replace photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('snaps', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('snaps', 'avatars') AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── 4. Close the "any signed-in user" holes ──────────────────────────
-- These policies only checked that someone was signed in. Once anyone can
-- sign in, they would let any attendee rewrite the shared event schedule
-- (the app loads this table over its built-in list) and read or overwrite
-- everyone's private notes. Events come from the code; notes stay on the
-- device until they get a real owner column.
DROP POLICY IF EXISTS "Owner can modify events" ON events;
DROP POLICY IF EXISTS "Private notes are viewable by owner only" ON event_notes;
DROP POLICY IF EXISTS "User event overrides viewable by owner only" ON user_events;
