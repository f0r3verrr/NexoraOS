-- ================================================================
-- Migration 004 — Goal categories and units
-- Run in Supabase: SQL Editor → paste → Run
-- ================================================================

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS unit     text;
