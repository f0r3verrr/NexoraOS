-- Двусторонний чат в разделе "Обратная связь": раньше отвечать мог только
-- админ (admin_reply_feedback), пользователь мог только прочитать чужие
-- ответы (RLS "own select"), но не написать в ответ. Добавляем:
--  1) reply_feedback() — пользователь отвечает в своём тикете; если тикет
--     был закрыт админом, ответ пользователя автоматически переоткрывает его
--     (стандартное поведение support-чатов).
--  2) admin_list_feedback_thread() — админу нужен SECURITY DEFINER, т.к.
--     feedback_replies без обходной RPC видны только владельцу тикета (RLS).

CREATE OR REPLACE FUNCTION reply_feedback(p_id uuid, p_body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM feedback_items WHERE id = p_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'feedback item not found';
  END IF;
  INSERT INTO feedback_replies (feedback_id, author_id, is_admin, body) VALUES (p_id, auth.uid(), false, p_body);
  UPDATE feedback_items
  SET updated_at = now(), status = CASE WHEN status = 'closed' THEN 'open' ELSE status END
  WHERE id = p_id;
END $$;

REVOKE ALL ON FUNCTION reply_feedback(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION reply_feedback(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION admin_list_feedback_thread(p_id uuid)
RETURNS TABLE (id uuid, is_admin boolean, body text, created_at timestamptz, author_email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT r.id, r.is_admin, r.body, r.created_at, u.email::text
  FROM feedback_replies r
  JOIN auth.users u ON u.id = r.author_id
  WHERE r.feedback_id = p_id
  ORDER BY r.created_at ASC;
END $$;

REVOKE ALL ON FUNCTION admin_list_feedback_thread(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_feedback_thread(uuid) TO authenticated;

-- Ответ админа тоже двигает updated_at (сортировка тикетов по активности)
CREATE OR REPLACE FUNCTION admin_reply_feedback(p_id uuid, p_body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  INSERT INTO feedback_replies (feedback_id, author_id, is_admin, body) VALUES (p_id, auth.uid(), true, p_body);
  UPDATE feedback_items SET updated_at = now() WHERE id = p_id;
  PERFORM admin_log('feedback_reply', p_id::text);
END $$;

REVOKE ALL ON FUNCTION admin_reply_feedback(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_reply_feedback(uuid, text) TO authenticated;
