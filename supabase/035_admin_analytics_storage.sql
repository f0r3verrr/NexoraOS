-- Аналитика и хранилище: реальные данные по реально существующим модулям

CREATE OR REPLACE FUNCTION admin_analytics(p_range text DEFAULT '30d') RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  days int;
  result json;
BEGIN
  PERFORM admin_check();
  days := CASE p_range WHEN '7d' THEN 7 WHEN '90d' THEN 90 WHEN '1Y' THEN 365 ELSE 30 END;

  SELECT json_build_object(
    'dau', (SELECT count(DISTINCT payload->>'actor_id') FROM auth.audit_log_entries
             WHERE payload->>'action' = 'login' AND created_at > now() - interval '1 day'),
    'wau', (SELECT count(DISTINCT payload->>'actor_id') FROM auth.audit_log_entries
             WHERE payload->>'action' = 'login' AND created_at > now() - interval '7 days'),
    'mau', (SELECT count(DISTINCT payload->>'actor_id') FROM auth.audit_log_entries
             WHERE payload->>'action' = 'login' AND created_at > now() - interval '30 days'),
    'activity_by_day', (
      SELECT coalesce(json_agg(json_build_object('d', d, 'c', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT created_at::date AS d, count(DISTINCT payload->>'actor_id') AS c
        FROM auth.audit_log_entries
        WHERE payload->>'action' = 'login' AND created_at > now() - make_interval(days => days)
        GROUP BY 1
      ) t
    ),
    'modules', json_build_array(
      json_build_object('name', 'Задачи',    'count', (SELECT count(*) FROM tasks)),
      json_build_object('name', 'Заметки',   'count', (SELECT count(*) FROM notes)),
      json_build_object('name', 'Календарь', 'count', (SELECT count(*) FROM events)),
      json_build_object('name', 'Дневник',   'count', (SELECT count(*) FROM journal_entries)),
      json_build_object('name', 'Цели',      'count', (SELECT count(*) FROM goals)),
      json_build_object('name', 'CRM',       'count', (SELECT count(*) FROM contact_activities)),
      json_build_object('name', 'Watchlist', 'count', (SELECT count(*) FROM cinema_entries)),
      json_build_object('name', 'Файлы',     'count', (SELECT count(*) FROM storage.objects WHERE bucket_id = 'user-files'))
    )
  ) INTO result;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION admin_storage_overview() RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
  PERFORM admin_check();
  SELECT json_build_object(
    'total_bytes', (SELECT coalesce(sum((metadata->>'size')::bigint), 0) FROM storage.objects WHERE bucket_id = 'user-files'),
    'by_type', (
      SELECT coalesce(json_agg(json_build_object('type', category, 'bytes', bytes)), '[]'::json)
      FROM (
        SELECT
          CASE
            WHEN metadata->>'mimetype' LIKE 'image/%' THEN 'Изображения'
            WHEN metadata->>'mimetype' LIKE 'video/%' THEN 'Видео'
            WHEN metadata->>'mimetype' IN ('application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document') THEN 'Документы'
            ELSE 'Прочее'
          END AS category,
          sum((metadata->>'size')::bigint) AS bytes
        FROM storage.objects
        WHERE bucket_id = 'user-files'
        GROUP BY 1
      ) t
    ),
    'growth_by_day', (
      SELECT coalesce(json_agg(json_build_object('d', d, 'bytes', bytes) ORDER BY d), '[]'::json)
      FROM (
        SELECT created_at::date AS d, sum((metadata->>'size')::bigint) AS bytes
        FROM storage.objects
        WHERE bucket_id = 'user-files' AND created_at > now() - interval '30 days'
        GROUP BY 1
      ) t
    ),
    'top_users', (
      SELECT coalesce(json_agg(json_build_object('email', email, 'bytes', bytes) ORDER BY bytes DESC), '[]'::json)
      FROM (
        SELECT u.email, sum((o.metadata->>'size')::bigint) AS bytes
        FROM storage.objects o
        JOIN auth.users u ON u.id::text = (string_to_array(o.name, '/'))[1]
        WHERE o.bucket_id = 'user-files'
        GROUP BY u.email
        ORDER BY bytes DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION admin_user_storage(target uuid)
RETURNS TABLE (name text, size bigint, mimetype text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT o.name, (o.metadata->>'size')::bigint, o.metadata->>'mimetype', o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'user-files' AND (string_to_array(o.name, '/'))[1] = target::text
  ORDER BY o.created_at DESC;
END $$;

REVOKE ALL ON FUNCTION admin_analytics(text), admin_storage_overview(), admin_user_storage(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_analytics(text), admin_storage_overview(), admin_user_storage(uuid) TO authenticated;
