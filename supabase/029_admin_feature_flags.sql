-- Feature Flags: управление функциями продукта из админ-панели

CREATE TABLE IF NOT EXISTS feature_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  audience    text NOT NULL DEFAULT 'everyone' CHECK (audience IN ('everyone', 'admins', 'selected')),
  status      text NOT NULL DEFAULT 'disabled' CHECK (status IN ('enabled', 'beta', 'disabled', 'internal')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
-- политик нет: доступ только через definer-функции ниже

CREATE TABLE IF NOT EXISTS feature_flag_users (
  flag_id uuid NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (flag_id, user_id)
);
ALTER TABLE feature_flag_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION admin_list_flags() RETURNS TABLE (
  id uuid, key text, name text, description text, audience text, status text,
  selected_count bigint, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT f.id, f.key, f.name, f.description, f.audience, f.status,
         (SELECT count(*) FROM feature_flag_users fu WHERE fu.flag_id = f.id),
         f.created_at, f.updated_at
  FROM feature_flags f
  ORDER BY f.created_at ASC;
END $$;

CREATE OR REPLACE FUNCTION admin_create_flag(p_key text, p_name text, p_description text, p_audience text, p_status text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  PERFORM admin_check();
  INSERT INTO feature_flags (key, name, description, audience, status)
  VALUES (p_key, p_name, p_description, p_audience, p_status)
  RETURNING id INTO new_id;
  PERFORM admin_log('flag_create', p_key);
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION admin_update_flag(p_id uuid, p_name text, p_description text, p_audience text, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE flag_key text;
BEGIN
  PERFORM admin_check();
  UPDATE feature_flags SET name = p_name, description = p_description, audience = p_audience,
    status = p_status, updated_at = now()
  WHERE id = p_id
  RETURNING key INTO flag_key;
  PERFORM admin_log('flag_update', flag_key);
END $$;

CREATE OR REPLACE FUNCTION admin_toggle_flag(p_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE flag_key text; old_status text;
BEGIN
  PERFORM admin_check();
  SELECT key, status INTO flag_key, old_status FROM feature_flags WHERE id = p_id;
  UPDATE feature_flags SET status = p_status, updated_at = now() WHERE id = p_id;
  PERFORM admin_log('flag_toggle', flag_key || ': ' || old_status || ' -> ' || p_status);
END $$;

CREATE OR REPLACE FUNCTION admin_delete_flag(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE flag_key text;
BEGIN
  PERFORM admin_check();
  SELECT key INTO flag_key FROM feature_flags WHERE id = p_id;
  DELETE FROM feature_flags WHERE id = p_id;
  PERFORM admin_log('flag_delete', flag_key);
END $$;

CREATE OR REPLACE FUNCTION admin_set_flag_users(p_id uuid, p_user_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  DELETE FROM feature_flag_users WHERE flag_id = p_id;
  INSERT INTO feature_flag_users (flag_id, user_id)
  SELECT p_id, unnest(p_user_ids)
  ON CONFLICT DO NOTHING;
  PERFORM admin_log('flag_set_users', p_id::text);
END $$;

REVOKE ALL ON FUNCTION admin_list_flags(), admin_create_flag(text, text, text, text, text),
  admin_update_flag(uuid, text, text, text, text), admin_toggle_flag(uuid, text),
  admin_delete_flag(uuid), admin_set_flag_users(uuid, uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_flags(), admin_create_flag(text, text, text, text, text),
  admin_update_flag(uuid, text, text, text, text), admin_toggle_flag(uuid, text),
  admin_delete_flag(uuid), admin_set_flag_users(uuid, uuid[]) TO authenticated;
