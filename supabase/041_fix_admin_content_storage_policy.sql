-- Фикс 403 при загрузке обложки в admin-content: политика storage.objects
-- проверяла EXISTS(SELECT 1 FROM admin_users WHERE id=auth.uid()) НАПРЯМУЮ —
-- но admin_users имеет RLS без единой политики (доступ только через
-- definer-функции), поэтому этот подзапрос внутри чужой RLS-политики
-- всегда видел ноль строк, даже для реального админа. Нужна отдельная
-- SECURITY DEFINER функция is_admin(), которая обходит RLS admin_users.

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid());
$$;
REVOKE ALL ON FUNCTION is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

DROP POLICY IF EXISTS "admin-content admin insert" ON storage.objects;
DROP POLICY IF EXISTS "admin-content admin update" ON storage.objects;
DROP POLICY IF EXISTS "admin-content admin delete" ON storage.objects;

CREATE POLICY "admin-content admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-content' AND is_admin());
CREATE POLICY "admin-content admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'admin-content' AND is_admin());
CREATE POLICY "admin-content admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-content' AND is_admin());
