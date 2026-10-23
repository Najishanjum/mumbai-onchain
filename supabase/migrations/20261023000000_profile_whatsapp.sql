-- WhatsApp number on profiles, shown as a wa.me link. Optional and public,
-- like the other contact fields. Run before deploying the app that writes it.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '';
