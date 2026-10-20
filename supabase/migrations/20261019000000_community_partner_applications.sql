-- ====================================================================
-- MUMBAI ONCHAIN: COMMUNITY PARTNER APPLICATIONS SCHEMA & STORAGE
-- Migration: 20261019000000_community_partner_applications.sql
-- ====================================================================

-- 1. Create Dedicated Storage Bucket for Community Logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-logos',
  'community-logos',
  true,
  5242880, -- 5 MB max limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

-- Storage RLS: Public visitors can upload logos to community-logos bucket
DROP POLICY IF EXISTS "Public can upload community logos" ON storage.objects;
CREATE POLICY "Public can upload community logos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'community-logos');

-- Storage RLS: Anyone can view community logos
DROP POLICY IF EXISTS "Public can view community logos" ON storage.objects;
CREATE POLICY "Public can view community logos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'community-logos');

-- 2. Create Community Partner Applications Table
CREATE TABLE IF NOT EXISTS public.community_partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_name TEXT NOT NULL,
  community_logo_url TEXT NOT NULL,
  community_description TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website_url TEXT DEFAULT '',
  x_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  telegram_url TEXT DEFAULT '',
  discord_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON public.community_partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_apps_created_at ON public.community_partner_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_apps_email ON public.community_partner_applications(email);

-- Enable Row Level Security
ALTER TABLE public.community_partner_applications ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
-- Public visitors may submit applications, but strictly with status = 'pending'
DROP POLICY IF EXISTS "Public can submit partner application" ON public.community_partner_applications;
CREATE POLICY "Public can submit partner application"
  ON public.community_partner_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

-- Public visitors must NOT be able to read private applicant details
-- Only authenticated organizers/admins can view applications
DROP POLICY IF EXISTS "Authenticated admins can view partner applications" ON public.community_partner_applications;
CREATE POLICY "Authenticated admins can view partner applications"
  ON public.community_partner_applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated organizers/admins can update application status
DROP POLICY IF EXISTS "Authenticated admins can update partner applications" ON public.community_partner_applications;
CREATE POLICY "Authenticated admins can update partner applications"
  ON public.community_partner_applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
