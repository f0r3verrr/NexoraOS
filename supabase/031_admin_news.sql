-- Новости: анонсы для пользователей (отдельно от changelog, без модалки)

CREATE TABLE IF NOT EXISTS news_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  category    text NOT NULL,
  description text NOT NULL,
  icon        text NOT NULL DEFAULT 'globe',
  push_notify boolean NOT NULL DEFAULT false,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news public read" ON news_posts FOR SELECT USING (published = true);

CREATE OR REPLACE FUNCTION admin_list_news() RETURNS SETOF news_posts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY SELECT * FROM news_posts ORDER BY created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION admin_create_news(p_title text, p_category text, p_description text, p_icon text, p_push_notify boolean, p_published boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  PERFORM admin_check();
  INSERT INTO news_posts (title, category, description, icon, push_notify, published)
  VALUES (p_title, p_category, p_description, p_icon, p_push_notify, p_published)
  RETURNING id INTO new_id;
  PERFORM admin_log('news_create', p_title);
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION admin_update_news(p_id uuid, p_title text, p_category text, p_description text, p_icon text, p_push_notify boolean, p_published boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE news_posts SET title = p_title, category = p_category, description = p_description,
    icon = p_icon, push_notify = p_push_notify, published = p_published
  WHERE id = p_id;
  PERFORM admin_log('news_update', p_title);
END $$;

CREATE OR REPLACE FUNCTION admin_delete_news(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  PERFORM admin_check();
  SELECT title INTO t FROM news_posts WHERE id = p_id;
  DELETE FROM news_posts WHERE id = p_id;
  PERFORM admin_log('news_delete', t);
END $$;

REVOKE ALL ON FUNCTION admin_list_news(), admin_create_news(text, text, text, text, boolean, boolean),
  admin_update_news(uuid, text, text, text, text, boolean, boolean), admin_delete_news(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_news(), admin_create_news(text, text, text, text, boolean, boolean),
  admin_update_news(uuid, text, text, text, text, boolean, boolean), admin_delete_news(uuid) TO authenticated;
