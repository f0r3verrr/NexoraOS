-- admin_storage_overview() должен вернуть id пользователя в top_users для drill-down по файлам

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
      SELECT coalesce(json_agg(json_build_object('id', id, 'email', email, 'bytes', bytes) ORDER BY bytes DESC), '[]'::json)
      FROM (
        SELECT u.id, u.email, sum((o.metadata->>'size')::bigint) AS bytes
        FROM storage.objects o
        JOIN auth.users u ON u.id::text = (string_to_array(o.name, '/'))[1]
        WHERE o.bucket_id = 'user-files'
        GROUP BY u.id, u.email
        ORDER BY bytes DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  RETURN result;
END $$;
