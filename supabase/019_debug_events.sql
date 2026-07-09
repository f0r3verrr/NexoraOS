-- Диагностика событий — запусти в Supabase Dashboard → SQL Editor

-- 1. Все события за -7 / +7 дней
SELECT
  id,
  title,
  start_at,
  end_at,
  all_day,
  recurrence,
  created_at
FROM events
WHERE start_at BETWEEN now() - interval '7 days' AND now() + interval '7 days'
ORDER BY start_at DESC;

-- 2. Если таблица пустая — создай тестовое событие СЕЙЧАС на сегодня:
-- (замени 'your-user-id' на твой реальный user id из auth.users)
-- INSERT INTO events (user_id, title, start_at, end_at, all_day, recurrence)
-- VALUES (
--   auth.uid(),
--   'Тест Today',
--   now(),
--   now() + interval '1 hour',
--   false,
--   'none'
-- );
