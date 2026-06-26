-- ================================================================
-- Migration 002 — Kanban status, Goals, Quick Notes, Project dates
-- Run in Supabase SQL Editor
-- ================================================================

-- tasks: add kanban_status column
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS kanban_status text NOT NULL DEFAULT 'todo'
  CHECK (kanban_status IN ('backlog','todo','in_progress','review','done'));

-- projects: add timeline dates for Gantt
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date   date;

-- goals table
CREATE TABLE IF NOT EXISTS goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  goal_type     text not null default 'Годовая',
  horizon       text,
  color_token   text not null default '--p-openresto',
  current_value text,
  target_value  text,
  progress      int  not null default 0 check (progress between 0 and 100),
  notes         text,
  archived      boolean not null default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rows" ON goals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- quick_notes table (dashboard sticky notes)
CREATE TABLE IF NOT EXISTS quick_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  text        text not null,
  color_token text not null default '--p-openresto',
  pinned      boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rows" ON quick_notes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER set_updated_at BEFORE UPDATE ON quick_notes
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- indexes
CREATE INDEX IF NOT EXISTS idx_tasks_kanban ON tasks (user_id, kanban_status);
CREATE INDEX IF NOT EXISTS idx_goals_user   ON goals (user_id, archived);
