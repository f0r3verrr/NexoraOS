-- Remove hardcoded kanban_status check constraint so custom column UUIDs are accepted
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_kanban_status_check;
