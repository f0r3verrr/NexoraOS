-- Gantt Pro v2 — start_date on tasks, milestones table, task_dependencies
-- Run in Supabase Dashboard → SQL Editor

-- Add start_date to tasks (real bar start for Gantt)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS start_date date;

-- Milestones (project-level, separate from projects.end_date)
CREATE TABLE IF NOT EXISTS milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       text NOT NULL,
  date        date NOT NULL,
  description text,
  done        boolean NOT NULL DEFAULT false,
  color_token text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_owner" ON milestones
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id, date);

-- Task dependencies (Finish→Start, etc.)
CREATE TABLE IF NOT EXISTS task_dependencies (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_task uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  to_task   uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dep_type  text NOT NULL DEFAULT 'finish_to_start',
  -- 'finish_to_start' | 'finish_to_finish' | 'start_to_start' | 'start_to_finish'
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_task, to_task)
);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deps_owner" ON task_dependencies
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_deps_from ON task_dependencies(from_task);
CREATE INDEX IF NOT EXISTS idx_deps_to   ON task_dependencies(to_task);
