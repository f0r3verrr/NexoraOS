-- Новости теперь тоже участвуют в модалке "что нового" — по аналогии с changelog_reads

CREATE TABLE IF NOT EXISTS news_reads (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_id uuid NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, news_id)
);
ALTER TABLE news_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_reads own" ON news_reads FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION get_unread_news() RETURNS SETOF news_posts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT n.* FROM news_posts n
  WHERE n.published = true
    AND n.created_at::date > (SELECT p.created_at::date FROM profiles p WHERE p.id = auth.uid())
    AND n.id NOT IN (SELECT news_id FROM news_reads WHERE user_id = auth.uid())
  ORDER BY n.created_at ASC;
END $$;

CREATE OR REPLACE FUNCTION mark_news_read(ids uuid[]) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO news_reads (user_id, news_id)
  SELECT auth.uid(), unnest(ids)
  ON CONFLICT DO NOTHING;
END $$;

REVOKE ALL ON FUNCTION get_unread_news(), mark_news_read(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION get_unread_news(), mark_news_read(uuid[]) TO authenticated;
