-- Аудит действий администратора + объединённый лог (GoTrue auth events + admin actions)

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id   uuid NOT NULL REFERENCES auth.users(id),
  action     text NOT NULL,
  target     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- политик нет: таблица недоступна через API, читают/пишут только definer-функции

/* ─── Внутренний хелпер: записать действие админа ─── */
CREATE OR REPLACE FUNCTION admin_log(p_action text, p_target text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO admin_audit_log (admin_id, action, target) VALUES (auth.uid(), p_action, p_target);
END $$;

/* ─── Объединённый лог: auth-события (GoTrue) + действия админов ─── */
CREATE OR REPLACE FUNCTION admin_list_logs(limit_n int DEFAULT 100, before timestamptz DEFAULT now())
RETURNS TABLE (source text, occurred_at timestamptz, actor text, action text, details text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  (
    SELECT 'auth'::text,
           a.created_at,
           coalesce(a.payload->>'actor_username', a.payload->>'actor_id', 'система'),
           a.payload->>'action',
           NULL::text
    FROM auth.audit_log_entries a
    WHERE a.payload->>'log_type' = 'account'
      AND a.created_at < before
    ORDER BY a.created_at DESC
    LIMIT limit_n
  )
  UNION ALL
  (
    SELECT 'admin'::text,
           l.created_at,
           coalesce(u.email, l.admin_id::text),
           l.action,
           l.target
    FROM admin_audit_log l
    LEFT JOIN auth.users u ON u.id = l.admin_id
    WHERE l.created_at < before
    ORDER BY l.created_at DESC
    LIMIT limit_n
  )
  ORDER BY occurred_at DESC
  LIMIT limit_n;
END $$;

/* ─── Переиздание существующих RPC (024_admin.sql) с записью в аудит ─── */
CREATE OR REPLACE FUNCTION admin_ban_user(target uuid, days int DEFAULT 36500) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = target) THEN
    RAISE EXCEPTION 'cannot ban admin';
  END IF;
  UPDATE auth.users SET banned_until = now() + make_interval(days => days) WHERE id = target;
  PERFORM admin_log('ban_user', target::text);
END $$;

CREATE OR REPLACE FUNCTION admin_unban_user(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE auth.users SET banned_until = NULL WHERE id = target;
  PERFORM admin_log('unban_user', target::text);
END $$;

CREATE OR REPLACE FUNCTION admin_delete_user(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_email text;
BEGIN
  PERFORM admin_check();
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = target) THEN
    RAISE EXCEPTION 'cannot delete admin';
  END IF;
  SELECT email INTO target_email FROM auth.users WHERE id = target;
  DELETE FROM storage.objects
   WHERE bucket_id IN ('user-files', 'avatars')
     AND (string_to_array(name, '/'))[1] = target::text;
  DELETE FROM auth.users WHERE id = target;
  PERFORM admin_log('delete_user', coalesce(target_email, target::text));
END $$;

REVOKE ALL ON FUNCTION admin_log(text, text), admin_list_logs(int, timestamptz),
  admin_ban_user(uuid, int), admin_unban_user(uuid), admin_delete_user(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_log(text, text), admin_list_logs(int, timestamptz),
  admin_ban_user(uuid, int), admin_unban_user(uuid), admin_delete_user(uuid) TO authenticated;
