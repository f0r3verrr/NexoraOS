-- Custom Kanban columns (beyond the 5 defaults)
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS kanban_columns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  color_token text NOT NULL DEFAULT '--text-muted',
  position    int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kanban_columns_owner" ON kanban_columns
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_kanban_columns_user ON kanban_columns(user_id, position);
