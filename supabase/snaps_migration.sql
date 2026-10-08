-- ====================================================================
-- MUMBAI // ONCHAIN WEEK 2026: SNAPS FEATURE MIGRATION
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Create Snaps Table
CREATE TABLE IF NOT EXISTS snaps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  storage_path TEXT,
  event_id TEXT DEFAULT 'devcon-8-india',
  event_name TEXT DEFAULT 'Mumbai Onchain Week',
  date TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  location TEXT DEFAULT 'Mumbai, India',
  tagged_person_ids TEXT[] DEFAULT '{}',
  reactions JSONB DEFAULT '{"heart": 0, "fire": 0, "eyes": 0, "clap": 0}'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_snaps_user_id ON snaps(user_id);
CREATE INDEX IF NOT EXISTS idx_snaps_event_id ON snaps(event_id);
CREATE INDEX IF NOT EXISTS idx_snaps_created_at ON snaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snaps_visibility ON snaps(visibility);

-- 3. Row Level Security (RLS)
ALTER TABLE snaps ENABLE ROW LEVEL SECURITY;

-- Everyone can read public Snaps
CREATE POLICY "Public snaps are viewable by everyone"
  ON snaps FOR SELECT
  USING (visibility = 'public');

-- Anyone can insert public snaps
CREATE POLICY "Anyone can insert public snaps"
  ON snaps FOR INSERT
  WITH CHECK (true);

-- Users can delete their own snaps
CREATE POLICY "Users can delete their own snaps"
  ON snaps FOR DELETE
  USING (true);

-- Users can update reactions/tags
CREATE POLICY "Users can update reactions"
  ON snaps FOR UPDATE
  USING (true);

-- 4. Enable Supabase Realtime broadcast for live updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE snaps;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 5. Dedicated Supabase Storage Bucket: 'snaps'
INSERT INTO storage.buckets (id, name, public)
VALUES ('snaps', 'snaps', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for 'snaps' bucket
DO $$
BEGIN
  -- Read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public snaps bucket read'
  ) THEN
    CREATE POLICY "Public snaps bucket read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'snaps');
  END IF;

  -- Upload access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public snaps bucket upload'
  ) THEN
    CREATE POLICY "Public snaps bucket upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'snaps');
  END IF;

  -- Delete access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public snaps bucket delete'
  ) THEN
    CREATE POLICY "Public snaps bucket delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'snaps');
  END IF;
END $$;
