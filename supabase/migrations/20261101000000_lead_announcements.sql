-- Announcements to community leads: each lead taps "Got it", so admins see
-- who has read the team's message ("12 of 18 seen") and who to nudge on
-- WhatsApp. Safe to re-run.

CREATE TABLE IF NOT EXISTS broadcast_reads (
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (broadcast_id, user_id)
);

ALTER TABLE broadcast_reads ENABLE ROW LEVEL SECURITY;

-- Your own reads; admins see everyone's.
DROP POLICY IF EXISTS "See reads" ON broadcast_reads;
CREATE POLICY "See reads" ON broadcast_reads FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

-- Only leads, only as themselves, only for the team's sent messages to leads.
DROP POLICY IF EXISTS "Leads mark announcements seen" ON broadcast_reads;
CREATE POLICY "Leads mark announcements seen" ON broadcast_reads FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM community_members WHERE user_id = auth.uid() AND role = 'lead')
  AND broadcast_id IN (SELECT id FROM broadcasts WHERE audience = 'leads' AND status = 'sent')
);
