-- Тарифный план пользователя + расширенные действия админа в деталке пользователя

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro', 'enterprise'));

/* ─── Деталка пользователя: профиль + статы + таймлайн ─── */
CREATE OR REPLACE FUNCTION admin_user_detail(target uuid) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  PERFORM admin_check();
  SELECT json_build_object(
    'id', u.id,
    'email', u.email,
    'display_name', coalesce(u.raw_user_meta_data->>'display_name', p.display_name),
    'plan', coalesce(p.plan, 'free'),
    'created_at', u.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'banned_until', u.banned_until,
    'email_confirmed', u.email_confirmed_at IS NOT NULL,
    'is_admin', EXISTS (SELECT 1 FROM admin_users a WHERE a.id = u.id),
    'stats', json_build_object(
      'projects', (SELECT count(*) FROM projects WHERE user_id = u.id),
      'tasks',    (SELECT count(*) FROM tasks WHERE user_id = u.id),
      'notes',    (SELECT count(*) FROM notes WHERE user_id = u.id),
      'media',    (SELECT count(*) FROM storage.objects WHERE bucket_id = 'user-files'
                     AND (string_to_array(name, '/'))[1] = u.id::text
                     AND (metadata->>'mimetype' LIKE 'image/%' OR metadata->>'mimetype' LIKE 'video/%')),
      'files',    (SELECT count(*) FROM storage.objects WHERE bucket_id = 'user-files'
                     AND (string_to_array(name, '/'))[1] = u.id::text),
      'storage_bytes', (SELECT coalesce(sum((metadata->>'size')::bigint), 0) FROM storage.objects
                     WHERE bucket_id = 'user-files' AND (string_to_array(name, '/'))[1] = u.id::text)
    ),
    'timeline', (
      SELECT coalesce(json_agg(row_to_json(t) ORDER BY t.occurred_at DESC), '[]'::json)
      FROM (
        (SELECT a.created_at AS occurred_at, a.payload->>'action' AS action
         FROM auth.audit_log_entries a
         WHERE a.payload->>'actor_id' = u.id::text AND a.payload->>'log_type' = 'account'
         ORDER BY a.created_at DESC LIMIT 20)
        UNION ALL
        (SELECT l.created_at AS occurred_at, l.action
         FROM admin_audit_log l
         WHERE l.target = u.id::text OR l.target = u.email
         ORDER BY l.created_at DESC LIMIT 20)
      ) t
    )
  ) INTO result
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = target;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION admin_verify_email(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE auth.users SET email_confirmed_at = now(), confirmed_at = now() WHERE id = target;
  PERFORM admin_log('verify_email', target::text);
END $$;

-- Блокирует refresh новых токенов; уже выданный access-токен остаётся валиден
-- до истечения своего срока (~1ч) — это ограничение самого JWT, не баг реализации.
CREATE OR REPLACE FUNCTION admin_logout_user(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  DELETE FROM auth.sessions WHERE user_id = target;
  PERFORM admin_log('logout_sessions', target::text);
END $$;

CREATE OR REPLACE FUNCTION admin_set_role(target uuid, make_admin boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  IF NOT make_admin AND target = auth.uid() THEN
    RAISE EXCEPTION 'cannot remove your own admin role';
  END IF;
  IF make_admin THEN
    INSERT INTO admin_users (id) VALUES (target) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM admin_users WHERE id = target;
  END IF;
  PERFORM admin_log('set_role', target::text || ': admin=' || make_admin::text);
END $$;

CREATE OR REPLACE FUNCTION admin_set_subscription(target uuid, new_plan text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  IF new_plan NOT IN ('free', 'pro', 'enterprise') THEN
    RAISE EXCEPTION 'invalid plan';
  END IF;
  UPDATE profiles SET plan = new_plan WHERE id = target;
  PERFORM admin_log('set_subscription', target::text || ': ' || new_plan);
END $$;

-- Ручной сброс пароля: SMTP пока деградирован (Unisender free tier), поэтому
-- вместо resetPasswordForEmail генерируем временный пароль напрямую в БД —
-- работает независимо от почты. Пароль возвращается один раз, админ передаёт
-- его пользователю вручную.
CREATE OR REPLACE FUNCTION admin_reset_password_manual(target uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_password text;
BEGIN
  PERFORM admin_check();
  new_password := encode(gen_random_bytes(9), 'base64');
  new_password := replace(replace(replace(new_password, '/', 'x'), '+', 'y'), '=', '');
  UPDATE auth.users SET encrypted_password = crypt(new_password, gen_salt('bf')) WHERE id = target;
  PERFORM admin_log('reset_password', target::text);
  RETURN new_password;
END $$;

REVOKE ALL ON FUNCTION admin_user_detail(uuid), admin_verify_email(uuid), admin_logout_user(uuid),
  admin_set_role(uuid, boolean), admin_set_subscription(uuid, text), admin_reset_password_manual(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_user_detail(uuid), admin_verify_email(uuid), admin_logout_user(uuid),
  admin_set_role(uuid, boolean), admin_set_subscription(uuid, text), admin_reset_password_manual(uuid) TO authenticated;
