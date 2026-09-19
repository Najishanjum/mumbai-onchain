-- MUMBAI // ONCHAIN WEEK 2026 DATABASE SCHEMA

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  accent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  organizer TEXT NOT NULL,
  category TEXT NOT NULL,
  start_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_date DATE NOT NULL,
  end_time TEXT NOT NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  location TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  official_url TEXT NOT NULL,
  map_url TEXT,
  status TEXT NOT NULL DEFAULT 'INTERESTED',
  priority TEXT DEFAULT 'NORMAL',
  is_primary BOOLEAN DEFAULT FALSE,
  devcon_tracks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create User Events Table (Personal Status Overrides)
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  priority TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)
);

-- 4. Create Event Notes Table (Private Notes & Networking Records)
CREATE TABLE IF NOT EXISTS event_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  people_met TEXT,
  projects TEXT,
  ideas TEXT,
  followups TEXT,
  takeaways TEXT,
  content_idea TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- Anyone can view public events
CREATE POLICY "Public events are viewable by everyone" 
  ON events FOR SELECT USING (true);

-- Authenticated owner can manage events
CREATE POLICY "Owner can modify events" 
  ON events FOR ALL USING (auth.role() = 'authenticated');

-- User events and private notes are restricted
CREATE POLICY "Private notes are viewable by owner only" 
  ON event_notes FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "User event overrides viewable by owner only" 
  ON user_events FOR ALL USING (auth.role() = 'authenticated');
