-- Vault и Транзакции (Финансы): эти таблицы использовались фронтендом,
-- но никогда не попали в миграции — на self-hosted сервере их не было
-- вовсе (Vault падал ошибкой, Финансы молча показывали пустой список).

CREATE TABLE IF NOT EXISTS vault_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT '',
  content    text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_credentials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT '',
  url        text NOT NULL DEFAULT '',
  login      text NOT NULL DEFAULT '',
  password   text NOT NULL DEFAULT '',
  notes      text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  description text NOT NULL DEFAULT '',
  amount      numeric NOT NULL DEFAULT 0,
  category    text,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE vault_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_notes_owner"       ON vault_notes       FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "vault_credentials_owner" ON vault_credentials FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_owner"      ON transactions      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_vault_notes_user       ON vault_notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_credentials_user ON vault_credentials(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user      ON transactions(user_id, date DESC);
