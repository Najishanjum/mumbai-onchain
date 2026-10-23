-- WhatsApp moves from personal profiles to communities: a group invite link
-- on partner applications, shown on approved partner cards. No profile had a
-- number saved when this was written. profiles.whatsapp stays for now: app
-- versions already on phones still send it when saving a profile. Drop it
-- once those have updated.

ALTER TABLE community_partner_applications
  ADD COLUMN IF NOT EXISTS whatsapp_url TEXT DEFAULT '';

-- New column goes last so the view can be replaced in place.
CREATE OR REPLACE VIEW community_partners_public AS
SELECT id, community_name, community_logo_url, community_description,
       website_url, x_url, instagram_url, linkedin_url, telegram_url, discord_url, created_at,
       whatsapp_url
  FROM community_partner_applications
 WHERE status = 'approved';
