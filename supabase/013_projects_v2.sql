-- Projects v2 — добавить description, status, emoji
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS emoji text;

-- status values: 'active' | 'paused' | 'completed'
