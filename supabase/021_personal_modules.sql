-- Личные модули: Машина, Дом и подписки, Отношения
-- Run in Supabase Dashboard → SQL Editor

/* ═══ МАШИНА ═══ */

CREATE TABLE IF NOT EXISTS car_profile (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,            -- Hyundai Tucson, 2019
  plate       text,                     -- М 245 ОН 77
  spec        text,                     -- 2.0 бензин · АКПП
  status      text DEFAULT 'в порядке',
  mileage     int  DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS car_deadlines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       text NOT NULL,            -- ОСАГО / КАСКО / Техосмотр / ТО
  due_date    date,                     -- либо дата
  due_km      int,                      -- либо пробег
  note        text,                     -- 14 240 ₽
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS car_service (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  km          int,
  title       text NOT NULL,
  place       text,
  cost        numeric DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

/* ═══ ДОМ И ПОДПИСКИ ═══ */

CREATE TABLE IF NOT EXISTS subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text DEFAULT 'Дом',       -- Дом / Работа / Развлечения / Облако
  amount      numeric NOT NULL DEFAULT 0,
  period      text DEFAULT 'month' CHECK (period IN ('month', 'year')),
  next_charge date,
  color_token text DEFAULT '--p-home',
  note        text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS utility_bills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month       date NOT NULL,            -- первое число месяца
  amount      numeric NOT NULL DEFAULT 0,
  paid        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, month)
);

CREATE TABLE IF NOT EXISTS home_accesses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       text NOT NULL,            -- Wi-Fi · домашний
  value       text NOT NULL,            -- KIR-home / 2.4 + 5
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warranties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  bought      date,
  until       date,
  has_receipt boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

/* ═══ ОТНОШЕНИЯ ═══ */

CREATE TABLE IF NOT EXISTS partner_profile (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  subtitle    text,                     -- магистратура · экономика
  phone       text,
  since       date,                     -- вместе с
  birthday    date,
  anniversary date,
  sizes       jsonb DEFAULT '[]',       -- [{"k":"Обувь","v":"38"}]
  favorites   jsonb DEFAULT '[]',       -- [{"icon":"drop","k":"Кофе","v":"Flat white"}]
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gift_ideas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        text NOT NULL,
  tag         text DEFAULT 'просто так',
  used        boolean DEFAULT false,
  used_on     text,                     -- «ДР 2025»
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shared_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  tag         text DEFAULT 'вечер',
  progress    int DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at  timestamptz DEFAULT now()
);

/* ═══ RLS ═══ */

ALTER TABLE car_profile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_deadlines   ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_service     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_bills   ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_accesses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_ideas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_plans    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "car_profile_owner"     ON car_profile     FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "car_deadlines_owner"   ON car_deadlines   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "car_service_owner"     ON car_service     FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "subscriptions_owner"   ON subscriptions   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "utility_bills_owner"   ON utility_bills   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "home_accesses_owner"   ON home_accesses   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "warranties_owner"      ON warranties      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "partner_profile_owner" ON partner_profile FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "gift_ideas_owner"      ON gift_ideas      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "shared_plans_owner"    ON shared_plans    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_car_service_user    ON car_service(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user  ON subscriptions(user_id, next_charge);
CREATE INDEX IF NOT EXISTS idx_utility_bills_user  ON utility_bills(user_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_gift_ideas_user     ON gift_ideas(user_id, created_at DESC);