-- Two small additions. Safe to re-run.
--
-- 1. Admin → Notify can write to every community lead ("leads" audience).
--    Leads see those messages in their bell; nobody else does.
-- 2. "I'm here" is marked verified when the phone was within 500 m of the
--    venue at check-in. Only the yes/no is kept, never the location.

ALTER TABLE broadcasts DROP CONSTRAINT IF EXISTS broadcasts_audience_check;
ALTER TABLE broadcasts ADD CONSTRAINT broadcasts_audience_check CHECK (audience IN ('members', 'everyone', 'leads'));

DROP POLICY IF EXISTS "See messages" ON broadcasts;
CREATE POLICY "See messages" ON broadcasts FOR SELECT TO authenticated USING (
  is_admin()
  OR (community_id IS NOT NULL AND is_community_lead(community_id))
  OR (
    status = 'sent'
    AND (audience = 'everyone'
         OR (audience = 'leads' AND EXISTS (SELECT 1 FROM community_members WHERE user_id = auth.uid() AND role = 'lead'))
         OR (audience = 'members' AND community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())))
  )
);

ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
