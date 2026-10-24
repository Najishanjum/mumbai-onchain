-- Community messages, phase 2 of community spaces. Leads message their
-- members (no approval, 2 a day, no links); a message to everyone waits for
-- an admin. Every push notification that goes to people is kept here, admin
-- ones from Notify too, as the history. Members can mute a community.
-- Writes go through the community-message function (service role) or, for
-- an admin's own Notify sends, straight from the app. Safe to re-run.

CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null: from the Mumbai Onchain team (Admin → Notify).
  community_id UUID REFERENCES community_partner_applications(id) ON DELETE CASCADE,
  sender_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 80),
  body TEXT NOT NULL DEFAULT '' CHECK (length(body) <= 240),
  audience TEXT NOT NULL CHECK (audience IN ('members', 'everyone')),
  -- pending: asking to reach everyone, waiting for an admin.
  status TEXT NOT NULL CHECK (status IN ('sent', 'pending', 'rejected')),
  review_note TEXT NOT NULL DEFAULT '' CHECK (length(review_note) <= 200),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  -- Phones it reached.
  recipients INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS broadcasts_community_idx ON broadcasts (community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS broadcasts_sent_idx ON broadcasts (status, sent_at DESC);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Admins: everything. Leads: their community's, waiting and declined ones too.
-- Everyone else: what was sent to them (their communities, or everyone).
DROP POLICY IF EXISTS "See messages" ON broadcasts;
CREATE POLICY "See messages" ON broadcasts FOR SELECT TO authenticated USING (
  is_admin()
  OR (community_id IS NOT NULL AND is_community_lead(community_id))
  OR (
    status = 'sent'
    AND (audience = 'everyone'
         OR community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid()))
  )
);

-- The app writes only the admins' own Notify sends; the rest is the function's.
DROP POLICY IF EXISTS "Admins log their sends" ON broadcasts;
CREATE POLICY "Admins log their sends" ON broadcasts FOR INSERT TO authenticated WITH CHECK (
  is_admin() AND community_id IS NULL AND status = 'sent' AND sender_id = auth.uid()
);

-- ── Mute ─────────────────────────────────────────────────────────────────
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS muted BOOLEAN NOT NULL DEFAULT false;

-- Members change only their own mute, not their role.
CREATE OR REPLACE FUNCTION set_community_muted(p_community_id UUID, p_muted BOOLEAN)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE community_members SET muted = p_muted WHERE community_id = p_community_id AND user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION set_community_muted(UUID, BOOLEAN) TO authenticated;
