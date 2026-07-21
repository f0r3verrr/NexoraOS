-- Клиентские ошибки: сбор из ErrorBoundary/window.onerror + просмотр в админке

CREATE TABLE IF NOT EXISTS client_errors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  route      text,
  message    text NOT NULL,
  stack      text,
  severity   text NOT NULL DEFAULT 'error' CHECK (severity IN ('error', 'warning')),
  status     text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;
-- без select-политики: пишут все (даже anon, ошибки бывают до логина) через definer-функцию, читают только админы

CREATE OR REPLACE FUNCTION log_client_error(route text, message text, stack text, severity text DEFAULT 'error')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO client_errors (user_id, route, message, stack, severity)
  VALUES (auth.uid(), route, left(message, 2000), left(stack, 8000), severity);
END $$;

CREATE OR REPLACE FUNCTION admin_list_errors(status_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid, user_email text, route text, message text, stack text,
  severity text, status text, created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT e.id, u.email::text, e.route, e.message, e.stack, e.severity, e.status, e.created_at
  FROM client_errors e
  LEFT JOIN auth.users u ON u.id = e.user_id
  WHERE status_filter IS NULL OR e.status = status_filter
  ORDER BY e.created_at DESC
  LIMIT 300;
END $$;

CREATE OR REPLACE FUNCTION admin_resolve_error(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE client_errors SET status = 'resolved' WHERE id = p_id;
END $$;

/* ─── Переиздание admin_stats() — добавляем errors_24h ─── */
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
    'onboarding_completed', (SELECT count(*) FROM profiles WHERE onboarding_status = 'completed'),
    'onboarding_skipped',   (SELECT count(*) FROM profiles WHERE onboarding_status = 'skipped'),
    'onboarding_pending',   (SELECT count(*) FROM profiles WHERE onboarding_status IN ('pending', 'in_progress')),
    'errors_24h', (SELECT count(*) FROM client_errors WHERE created_at > now() - interval '24 hours'),
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

REVOKE ALL ON FUNCTION admin_list_errors(text), admin_resolve_error(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_errors(text), admin_resolve_error(uuid) TO authenticated;

REVOKE ALL ON FUNCTION log_client_error(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION log_client_error(text, text, text, text) TO authenticated, anon;
