-- Performance indexes for notes table
CREATE INDEX IF NOT EXISTS notes_user_folder  ON notes(user_id, folder);
CREATE INDEX IF NOT EXISTS notes_user_updated ON notes(user_id, updated_at DESC);

-- Attachments table for notes
CREATE TABLE IF NOT EXISTS note_attachments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id      uuid        NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  size         bigint,
  mime_type    text,
  storage_path text        NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "note_attachments_owner" ON note_attachments
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
