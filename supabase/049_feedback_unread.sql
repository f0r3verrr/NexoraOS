-- Счётчик непрочитанных ответов админа в разделе "Обратная связь": раньше
-- пользователь никак не узнавал о новом ответе, кроме как зайдя в тикет.
-- Добавляем per-тикет отметку "прочитано пользователем" и RPC для бейджа
-- в сайдбаре + для сброса счётчика при открытии треда.

ALTER TABLE feedback_items ADD COLUMN IF NOT EXISTS user_read_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION mark_feedback_read(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE feedback_items SET user_read_at = now() WHERE id = p_id AND user_id = auth.uid();
END $$;

REVOKE ALL ON FUNCTION mark_feedback_read(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION mark_feedback_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION get_unread_feedback_count()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT count(DISTINCT r.feedback_id)::int
  FROM feedback_replies r
  JOIN feedback_items f ON f.id = r.feedback_id
  WHERE f.user_id = auth.uid() AND r.is_admin AND r.created_at > f.user_read_at;
$$;

REVOKE ALL ON FUNCTION get_unread_feedback_count() FROM public, anon;
GRANT EXECUTE ON FUNCTION get_unread_feedback_count() TO authenticated;
