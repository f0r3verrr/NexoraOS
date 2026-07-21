-- Фикс admin_list_logs(): ORDER BY occurred_at после UNION ALL падал с
-- "Only result column names can be used, not expressions or functions" —
-- колонкам в SELECT не хватало явных алиасов, поэтому имени occurred_at
-- для внешнего ORDER BY физически не существовало.

CREATE OR REPLACE FUNCTION admin_list_logs(limit_n int DEFAULT 100, before timestamptz DEFAULT now())
RETURNS TABLE (source text, occurred_at timestamptz, actor text, action text, details text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  (
    SELECT 'auth'::text AS source,
           a.created_at AS occurred_at,
           coalesce(a.payload->>'actor_username', a.payload->>'actor_id', 'система') AS actor,
           a.payload->>'action' AS action,
           NULL::text AS details
    FROM auth.audit_log_entries a
    WHERE a.payload->>'log_type' = 'account'
      AND a.created_at < before
    ORDER BY a.created_at DESC
    LIMIT limit_n
  )
  UNION ALL
  (
    SELECT 'admin'::text AS source,
           l.created_at AS occurred_at,
           coalesce(u.email, l.admin_id::text) AS actor,
           l.action AS action,
           l.target AS details
    FROM admin_audit_log l
    LEFT JOIN auth.users u ON u.id = l.admin_id
    WHERE l.created_at < before
    ORDER BY l.created_at DESC
    LIMIT limit_n
  )
  ORDER BY occurred_at DESC
  LIMIT limit_n;
END $$;
