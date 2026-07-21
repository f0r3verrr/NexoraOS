-- Безопасность: реальные метрики там, где данные есть; честный ноль там, где пока нет

CREATE OR REPLACE FUNCTION admin_security_stats() RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result json;
BEGIN
  PERFORM admin_check();
  SELECT json_build_object(
    'locked_accounts', (SELECT count(*) FROM auth.users WHERE banned_until > now()),
    'password_reset_requests_30d', (
      SELECT count(*) FROM auth.audit_log_entries
      WHERE payload->>'action' = 'user_recovery_requested' AND created_at > now() - interval '30 days'
    ),
    'unverified_emails', (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NULL),
    'total_users', (SELECT count(*) FROM auth.users),
    'failed_logins_7d', (
      -- на этой инсталляции GoTrue пока ни разу не писал failed-события — честный 0, не выдумка
      SELECT count(*) FROM auth.audit_log_entries
      WHERE payload->>'action' ILIKE '%failed%' AND created_at > now() - interval '7 days'
    ),
    'suspicious_activity', 0  -- пока не отслеживается — статичный плейсхолдер, помечен в UI
  ) INTO result;
  RETURN result;
END $$;

-- Замер отклика Kong→PostgREST→Postgres одним RPC-запросом с фронта
CREATE OR REPLACE FUNCTION admin_health_ping() RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN json_build_object('server_time', now());
END $$;

REVOKE ALL ON FUNCTION admin_security_stats(), admin_health_ping() FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_security_stats(), admin_health_ping() TO authenticated;
