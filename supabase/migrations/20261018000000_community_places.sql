-- Places people add to the city map, and Mumbai Onchain ratings for any place
-- on it (hand-picked, OpenStreetMap or community). Google reviews are linked
-- out, not stored: their terms don't allow showing them on a non-Google map.

-- ── Community places ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  category TEXT NOT NULL CHECK (category IN ('stay', 'food', 'cafe', 'cowork', 'laundry', 'health', 'money', 'sim', 'transport')),
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN 18.8 AND 19.4),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN 72.7 AND 73.2),
  area TEXT CHECK (char_length(area) <= 60),
  tip TEXT CHECK (char_length(tip) <= 200),
  price TEXT CHECK (char_length(price) <= 40),
  -- Who added it, shown on the card ("Added by Nimsara").
  added_by_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  added_by_name TEXT,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'live' for now. Switch the default to 'pending' to review before showing.
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'pending', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_places_status_idx ON community_places (status, created_at DESC);

ALTER TABLE community_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Live places are public" ON community_places;
CREATE POLICY "Live places are public" ON community_places
  FOR SELECT USING (status = 'live' OR owner_id = auth.uid());

-- Add as yourself only, always live or pending (never pre-hidden or spoofed).
DROP POLICY IF EXISTS "Add places as yourself" ON community_places;
CREATE POLICY "Add places as yourself" ON community_places
  FOR INSERT TO authenticated WITH CHECK (
    owner_id = auth.uid()
    AND status IN ('live', 'pending')
    AND (added_by_profile_id IS NULL OR added_by_profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid()))
  );

-- Edit or remove your own; you can't un-hide something moderators hid.
DROP POLICY IF EXISTS "Edit your own places" ON community_places;
CREATE POLICY "Edit your own places" ON community_places
  FOR UPDATE TO authenticated USING (owner_id = auth.uid() AND status <> 'hidden') WITH CHECK (owner_id = auth.uid() AND status <> 'hidden');

DROP POLICY IF EXISTS "Remove your own places" ON community_places;
CREATE POLICY "Remove your own places" ON community_places
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ── Ratings ──────────────────────────────────────────────────────────────
-- place_id is the app's id for any place: hand-picked ("zostel-marol"),
-- OpenStreetMap ("osm-node-123") or a community place's UUID.
CREATE TABLE IF NOT EXISTS place_ratings (
  place_id TEXT NOT NULL CHECK (char_length(place_id) <= 80),
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT,
  stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) <= 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One rating per person per place; rating again updates it.
  PRIMARY KEY (place_id, owner_id)
);

CREATE INDEX IF NOT EXISTS place_ratings_place_idx ON place_ratings (place_id, updated_at DESC);

ALTER TABLE place_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ratings are public" ON place_ratings;
CREATE POLICY "Ratings are public" ON place_ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Rate as yourself" ON place_ratings;
CREATE POLICY "Rate as yourself" ON place_ratings
  FOR INSERT TO authenticated WITH CHECK (
    owner_id = auth.uid()
    AND (reviewer_profile_id IS NULL OR reviewer_profile_id IN (SELECT id FROM profiles WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Edit your rating" ON place_ratings;
CREATE POLICY "Edit your rating" ON place_ratings
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Remove your rating" ON place_ratings;
CREATE POLICY "Remove your rating" ON place_ratings
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Average and count per place, for the map list and cards.
CREATE OR REPLACE FUNCTION place_rating_summary()
RETURNS TABLE (place_id TEXT, average NUMERIC, total INT)
LANGUAGE sql
STABLE
AS $$
  SELECT place_id, ROUND(AVG(stars)::NUMERIC, 1), COUNT(*)::INT
  FROM place_ratings
  GROUP BY place_id;
$$;

GRANT EXECUTE ON FUNCTION place_rating_summary() TO anon, authenticated;
