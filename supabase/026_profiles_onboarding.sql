-- Интерактивный онбординг-тур: статус прохождения и текущий шаг
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'pending'
  CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'skipped'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step int NOT NULL DEFAULT 0;
