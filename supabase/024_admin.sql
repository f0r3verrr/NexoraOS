-- Админ-панель (admin.nexoraos.ru): статистика и управление пользователями.
-- Доступ только для id из admin_users; проверка внутри security definer функций.

CREATE TABLE IF NOT EXISTS admin_users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- политик нет: таблица недоступна через API, читают только definer-функции

/* ─── Проверка прав ─── */
CREATE OR REPLACE FUNCTION admin_check() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
END $$;

/* ─── Сводная статистика ─── */
CREATE OR REPLACE FUNCTION admin_stats() RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN json_build_object(
    'total_users',   (SELECT count(*) FROM auth.users),
    'confirmed',     (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'new_7d',        (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days'),
    'active_7d',     (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '7 days'),
    'banned',        (SELECT count(*) FROM auth.users WHERE banned_until > now()),
    'storage_files', (SELECT count(*) FROM storage.objects WHERE bucket_id = 'user-files'),
    'storage_bytes', (SELECT coalesce(sum((metadata->>'size')::bigint), 0) FROM storage.objects WHERE bucket_id = 'user-files'),
    'tasks_total',   (SELECT count(*) FROM tasks),
    'notes_total',   (SELECT count(*) FROM notes),
    'signups_by_day', (
      SELECT coalesce(json_agg(json_build_object('d', d, 'c', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT created_at::date AS d, count(*) AS c
        FROM auth.users
        WHERE created_at > now() - interval '30 days'
        GROUP BY 1
      ) t
    )
  );
END $$;

/* ─── Список пользователей ─── */
CREATE OR REPLACE FUNCTION admin_list_users(search text DEFAULT NULL)
RETURNS TABLE (
  id uuid, email text, display_name text,
  created_at timestamptz, last_sign_in_at timestamptz,
  banned_until timestamptz, email_confirmed boolean, is_admin boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT u.id,
         u.email::text,
         coalesce(u.raw_user_meta_data->>'display_name', p.display_name)::text,
         u.created_at,
         u.last_sign_in_at,
         u.banned_until,
         u.email_confirmed_at IS NOT NULL,
         EXISTS (SELECT 1 FROM admin_users a WHERE a.id = u.id)
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE search IS NULL OR search = '' OR u.email ILIKE '%' || search || '%'
     OR coalesce(u.raw_user_meta_data->>'display_name', p.display_name) ILIKE '%' || search || '%'
  ORDER BY u.created_at DESC
  LIMIT 200;
END $$;

/* ─── Бан / разбан ─── */
CREATE OR REPLACE FUNCTION admin_ban_user(target uuid, days int DEFAULT 36500) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = target) THEN
    RAISE EXCEPTION 'cannot ban admin';
  END IF;
  UPDATE auth.users SET banned_until = now() + make_interval(days => days) WHERE id = target;
END $$;

CREATE OR REPLACE FUNCTION admin_unban_user(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE auth.users SET banned_until = NULL WHERE id = target;
END $$;

/* ─── Полное удаление пользователя (каскад по FK чистит все данные) ─── */
CREATE OR REPLACE FUNCTION admin_delete_user(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  IF EXISTS (SELECT 1 FROM admin_users WHERE id = target) THEN
    RAISE EXCEPTION 'cannot delete admin';
  END IF;
  DELETE FROM storage.objects
   WHERE bucket_id IN ('user-files', 'avatars')
     AND (string_to_array(name, '/'))[1] = target::text;
  DELETE FROM auth.users WHERE id = target;
END $$;

/* ─── Права: только authenticated, дальше admin_check решает ─── */
REVOKE ALL ON FUNCTION admin_check(), admin_stats(), admin_list_users(text),
  admin_ban_user(uuid, int), admin_unban_user(uuid), admin_delete_user(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_check(), admin_stats(), admin_list_users(text),
  admin_ban_user(uuid, int), admin_unban_user(uuid), admin_delete_user(uuid) TO authenticated;

-- Назначить себя админом (выполнить после регистрации):
-- INSERT INTO admin_users (id) SELECT id FROM auth.users WHERE email = 'ТВОЙ_EMAIL' ON CONFLICT DO NOTHING;
