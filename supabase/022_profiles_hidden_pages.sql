-- Отключённые страницы аккаунта (Настройки → Страницы)
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hidden_pages jsonb DEFAULT '[]';
