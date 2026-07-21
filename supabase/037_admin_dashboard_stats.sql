-- Финальное переиздание admin_stats(): добавляет active_by_day (аналог signups_by_day по логинам)

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
    ),
    'active_by_day', (
      SELECT coalesce(json_agg(json_build_object('d', d, 'c', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT created_at::date AS d, count(DISTINCT payload->>'actor_id') AS c
        FROM auth.audit_log_entries
        WHERE payload->>'action' = 'login' AND created_at > now() - interval '30 days'
        GROUP BY 1
      ) t
    )
  );
END $$;
