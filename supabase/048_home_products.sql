-- «Продукты» в модуле «Дом и подписки» — как список у холодильника:
-- что есть, что заканчивается, что закончилось и надо купить.

CREATE TABLE IF NOT EXISTS home_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text DEFAULT 'Еда',        -- Еда / Бытовая химия / Гигиена / Другое
  status      text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'low', 'out')),
  note        text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE home_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_products_owner" ON home_products FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_home_products_user ON home_products(user_id, status, created_at DESC);
