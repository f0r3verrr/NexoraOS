-- Changelog: релизы продукта + отслеживание прочтения по пользователю

CREATE TYPE changelog_priority AS ENUM ('low', 'normal', 'high');

CREATE TABLE IF NOT EXISTS changelog_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  version         text NOT NULL,
  description     text NOT NULL,
  cover_image_url text,
  release_date    date NOT NULL DEFAULT current_date,
  priority        changelog_priority NOT NULL DEFAULT 'normal',
  button_text     text,
  button_link     text,
  visibility      text NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'admins')),
  published       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "changelog public read" ON changelog_entries FOR SELECT USING (published = true);

CREATE TABLE IF NOT EXISTS changelog_reads (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changelog_id uuid NOT NULL REFERENCES changelog_entries(id) ON DELETE CASCADE,
  read_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, changelog_id)
);
ALTER TABLE changelog_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "changelog_reads own" ON changelog_reads FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Публичный бакет для обложек релизов (пишут только админы)
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-content', 'admin-content', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admin-content admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-content' AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "admin-content admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'admin-content' AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "admin-content admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-content' AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

/* ─── Admin CRUD ─── */
CREATE OR REPLACE FUNCTION admin_list_changelog() RETURNS SETOF changelog_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY SELECT * FROM changelog_entries ORDER BY release_date DESC, created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION admin_create_changelog(
  p_title text, p_version text, p_description text, p_cover_image_url text,
  p_release_date date, p_priority changelog_priority, p_button_text text, p_button_link text,
  p_visibility text, p_published boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  PERFORM admin_check();
  INSERT INTO changelog_entries (title, version, description, cover_image_url, release_date, priority, button_text, button_link, visibility, published)
  VALUES (p_title, p_version, p_description, p_cover_image_url, p_release_date, p_priority, p_button_text, p_button_link, p_visibility, p_published)
  RETURNING id INTO new_id;
  PERFORM admin_log('changelog_create', p_version);
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION admin_update_changelog(
  p_id uuid, p_title text, p_version text, p_description text, p_cover_image_url text,
  p_release_date date, p_priority changelog_priority, p_button_text text, p_button_link text,
  p_visibility text, p_published boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE changelog_entries SET
    title = p_title, version = p_version, description = p_description, cover_image_url = p_cover_image_url,
    release_date = p_release_date, priority = p_priority, button_text = p_button_text, button_link = p_button_link,
    visibility = p_visibility, published = p_published, updated_at = now()
  WHERE id = p_id;
  PERFORM admin_log('changelog_update', p_version);
END $$;

CREATE OR REPLACE FUNCTION admin_publish_changelog(p_id uuid, p_published boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  PERFORM admin_check();
  UPDATE changelog_entries SET published = p_published, updated_at = now() WHERE id = p_id RETURNING version INTO v;
  PERFORM admin_log(CASE WHEN p_published THEN 'changelog_publish' ELSE 'changelog_unpublish' END, v);
END $$;

CREATE OR REPLACE FUNCTION admin_delete_changelog(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  PERFORM admin_check();
  SELECT version INTO v FROM changelog_entries WHERE id = p_id;
  DELETE FROM changelog_entries WHERE id = p_id;
  PERFORM admin_log('changelog_delete', v);
END $$;

/* ─── Пользовательская сторона ─── */

-- Непрочитанные релизы: только опубликованные, только с даты РЕГИСТРАЦИИ пользователя,
-- только те, что ещё не помечены прочитанными — так новый пользователь никогда
-- не увидит историю до своего появления.
CREATE OR REPLACE FUNCTION get_unread_changelog() RETURNS SETOF changelog_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT c.* FROM changelog_entries c
  WHERE c.published = true
    AND c.release_date > (SELECT p.created_at::date FROM profiles p WHERE p.id = auth.uid())
    AND c.id NOT IN (SELECT changelog_id FROM changelog_reads WHERE user_id = auth.uid())
  ORDER BY c.release_date ASC;
END $$;

CREATE OR REPLACE FUNCTION mark_changelog_read(ids uuid[]) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO changelog_reads (user_id, changelog_id)
  SELECT auth.uid(), unnest(ids)
  ON CONFLICT DO NOTHING;
END $$;

REVOKE ALL ON FUNCTION admin_list_changelog(), admin_create_changelog(text, text, text, text, date, changelog_priority, text, text, text, boolean),
  admin_update_changelog(uuid, text, text, text, text, date, changelog_priority, text, text, text, boolean),
  admin_publish_changelog(uuid, boolean), admin_delete_changelog(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_changelog(), admin_create_changelog(text, text, text, text, date, changelog_priority, text, text, text, boolean),
  admin_update_changelog(uuid, text, text, text, text, date, changelog_priority, text, text, text, boolean),
  admin_publish_changelog(uuid, boolean), admin_delete_changelog(uuid) TO authenticated;

REVOKE ALL ON FUNCTION get_unread_changelog(), mark_changelog_read(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION get_unread_changelog(), mark_changelog_read(uuid[]) TO authenticated;
