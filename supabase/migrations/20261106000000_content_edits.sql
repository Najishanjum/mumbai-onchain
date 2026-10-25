-- Changes to places and partners go through review. An admin (or a
-- community's lead, for their own community) proposes a change; it waits in
-- Admin → Places / Partners → Waiting, and the live version stays as it is
-- until an admin approves it. Approving applies only the allowed fields.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS content_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target TEXT NOT NULL CHECK (target IN ('place', 'partner')),
  target_id UUID NOT NULL,
  -- Only the fields that change: {"name": "…", "lat": 18.9, …}
  changes JSONB NOT NULL CHECK (jsonb_typeof(changes) = 'object' AND changes <> '{}'::jsonb AND length(changes::text) <= 4000),
  proposed_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  proposer_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT NOT NULL DEFAULT '' CHECK (length(review_note) <= 200),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS content_edits_waiting_idx ON content_edits (target, status, created_at);

ALTER TABLE content_edits ENABLE ROW LEVEL SECURITY;

-- Admins see all; others see what they proposed.
DROP POLICY IF EXISTS "See edits" ON content_edits;
CREATE POLICY "See edits" ON content_edits FOR SELECT TO authenticated USING (is_admin() OR proposed_by = auth.uid());

-- Admins propose for anything; leads for their own community. Always waiting.
DROP POLICY IF EXISTS "Propose edits" ON content_edits;
CREATE POLICY "Propose edits" ON content_edits FOR INSERT TO authenticated WITH CHECK (
  proposed_by = auth.uid()
  AND status = 'pending' AND reviewed_by IS NULL
  AND (is_admin() OR (target = 'partner' AND is_community_lead(target_id)))
);

-- Take back your own change while it waits.
DROP POLICY IF EXISTS "Withdraw edits" ON content_edits;
CREATE POLICY "Withdraw edits" ON content_edits FOR DELETE TO authenticated USING (proposed_by = auth.uid() AND status = 'pending');

CREATE OR REPLACE FUNCTION content_edit_name()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.proposer_name := COALESCE((SELECT left(name, 80) FROM profiles WHERE owner_id = NEW.proposed_by ORDER BY created_at DESC LIMIT 1), 'Someone');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS content_edit_name ON content_edits;
CREATE TRIGGER content_edit_name BEFORE INSERT ON content_edits FOR EACH ROW EXECUTE FUNCTION content_edit_name();

-- Approve (apply the allowed fields) or reject. Admins only; each edit once.
CREATE OR REPLACE FUNCTION review_content_edit(p_id UUID, p_approve BOOLEAN, p_note TEXT DEFAULT '')
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e content_edits;
  c JSONB;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  UPDATE content_edits
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_by = auth.uid(), reviewed_at = NOW(), review_note = left(COALESCE(p_note, ''), 200)
  WHERE id = p_id AND status = 'pending'
  RETURNING * INTO e;
  IF e.id IS NULL THEN
    RAISE EXCEPTION 'Someone already answered this one';
  END IF;
  IF NOT p_approve THEN
    RETURN 'rejected';
  END IF;
  c := e.changes;

  IF e.target = 'place' THEN
    UPDATE community_places SET
      name = CASE WHEN c ? 'name' THEN c->>'name' ELSE name END,
      category = CASE WHEN c ? 'category' THEN c->>'category' ELSE category END,
      lat = CASE WHEN c ? 'lat' THEN (c->>'lat')::double precision ELSE lat END,
      lng = CASE WHEN c ? 'lng' THEN (c->>'lng')::double precision ELSE lng END,
      area = CASE WHEN c ? 'area' THEN NULLIF(c->>'area', '') ELSE area END,
      tip = CASE WHEN c ? 'tip' THEN NULLIF(c->>'tip', '') ELSE tip END,
      price = CASE WHEN c ? 'price' THEN NULLIF(c->>'price', '') ELSE price END,
      updated_at = NOW()
    WHERE id = e.target_id;
  ELSE
    UPDATE community_partner_applications SET
      community_name = CASE WHEN c ? 'community_name' THEN c->>'community_name' ELSE community_name END,
      community_description = CASE WHEN c ? 'community_description' THEN c->>'community_description' ELSE community_description END,
      website_url = CASE WHEN c ? 'website_url' THEN NULLIF(c->>'website_url', '') ELSE website_url END,
      x_url = CASE WHEN c ? 'x_url' THEN NULLIF(c->>'x_url', '') ELSE x_url END,
      instagram_url = CASE WHEN c ? 'instagram_url' THEN NULLIF(c->>'instagram_url', '') ELSE instagram_url END,
      linkedin_url = CASE WHEN c ? 'linkedin_url' THEN NULLIF(c->>'linkedin_url', '') ELSE linkedin_url END,
      telegram_url = CASE WHEN c ? 'telegram_url' THEN NULLIF(c->>'telegram_url', '') ELSE telegram_url END,
      discord_url = CASE WHEN c ? 'discord_url' THEN NULLIF(c->>'discord_url', '') ELSE discord_url END,
      whatsapp_url = CASE WHEN c ? 'whatsapp_url' THEN NULLIF(c->>'whatsapp_url', '') ELSE whatsapp_url END,
      updated_at = NOW()
    WHERE id = e.target_id;
  END IF;
  RETURN 'approved';
END;
$$;
GRANT EXECUTE ON FUNCTION review_content_edit(UUID, BOOLEAN, TEXT) TO authenticated;
