-- Add url field to events (for call links, Google Meet, Zoom, etc.)
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE events ADD COLUMN IF NOT EXISTS url text;
