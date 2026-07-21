-- admin_list_users() должен возвращать план подписки (добавлен в 034), иначе карточки в /users всегда показывают FREE

DROP FUNCTION IF EXISTS admin_list_users(text);

CREATE FUNCTION admin_list_users(search text DEFAULT NULL)
RETURNS TABLE (
  id uuid, email text, display_name text, plan text,
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
         coalesce(p.plan, 'free')::text,
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

REVOKE ALL ON FUNCTION admin_list_users(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_users(text) TO authenticated;
