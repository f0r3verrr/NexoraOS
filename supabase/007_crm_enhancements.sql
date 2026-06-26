-- Deal amount field on contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deal_amount NUMERIC(12,2);

-- Activity log per contact
CREATE TABLE IF NOT EXISTS contact_activities (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID        NOT NULL REFERENCES contacts(id)  ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'note', -- note | call | meeting | email
  body       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns contact_activities" ON contact_activities
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Link tasks to a contact
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Reminders per contact
CREATE TABLE IF NOT EXISTS contact_reminders (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID        NOT NULL REFERENCES contacts(id)  ON DELETE CASCADE,
  body       TEXT        NOT NULL,
  remind_at  TIMESTAMPTZ NOT NULL,
  done       BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contact_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns contact_reminders" ON contact_reminders
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
