-- Add recurrence field to events for repeating events
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none';
-- values: 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'yearly'
