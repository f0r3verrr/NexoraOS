-- Графики "Регистрации"/"Активность" на дашборде теперь принимают
-- произвольный диапазон дат (пресеты: текущая/прошлая неделя, текущий/
-- прошлый месяц и т.д.) вместо жёстко зашитых 30 дней в admin_stats().

CREATE OR REPLACE FUNCTION admin_dashboard_series(start_date date, end_date date) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN json_build_object(
    'signups_by_day', (
      SELECT coalesce(json_agg(json_build_object('d', d, 'c', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT created_at::date AS d, count(*) AS c
        FROM auth.users
        WHERE created_at::date BETWEEN start_date AND end_date
        GROUP BY 1
      ) t
    ),
    'active_by_day', (
      SELECT coalesce(json_agg(json_build_object('d', d, 'c', c) ORDER BY d), '[]'::json)
      FROM (
        SELECT created_at::date AS d, count(DISTINCT payload->>'actor_id') AS c
        FROM auth.audit_log_entries
        WHERE payload->>'action' = 'login' AND created_at::date BETWEEN start_date AND end_date
        GROUP BY 1
      ) t
    )
  );
END $$;

REVOKE ALL ON FUNCTION admin_dashboard_series(date, date) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_dashboard_series(date, date) TO authenticated;
