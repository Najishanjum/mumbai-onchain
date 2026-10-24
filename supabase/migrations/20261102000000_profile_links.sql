-- More places to find someone: Instagram, YouTube, Facebook, Discord and Lens,
-- picked on the profile editor ("+ Add a link"). GitHub, LinkedIn, Farcaster
-- and Website keep their own columns. Run before the app update ships: the
-- new app saves this column with every profile. Safe to re-run.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '{}'::jsonb;

-- An object of short strings, nothing else.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_links_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_links_check CHECK (jsonb_typeof(links) = 'object' AND length(links::text) <= 2000);
