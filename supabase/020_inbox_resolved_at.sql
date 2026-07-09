-- Время разбора элемента Inbox — для сортировки вида «Разобрано»

ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Бэкфилл: уже разобранным ставим created_at, чтобы сортировка не ломалась
UPDATE inbox_items SET resolved_at = created_at WHERE resolved = true AND resolved_at IS NULL;
