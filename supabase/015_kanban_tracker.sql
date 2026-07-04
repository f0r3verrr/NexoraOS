-- Kanban tracker upgrade — subtasks for tasks
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS task_subtasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      text NOT NULL,
  done       boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtasks_owner" ON task_subtasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_subtasks_task ON task_subtasks(task_id, sort_order);
