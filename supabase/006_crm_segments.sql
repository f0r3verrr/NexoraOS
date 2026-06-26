-- CRM Segments table
CREATE TABLE IF NOT EXISTS crm_segments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user owns crm_segments" ON crm_segments
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add segment_id to contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES crm_segments(id) ON DELETE SET NULL;
