-- Вложения (фото/видео) в обращениях/ответах + архивирование тикетов
-- (как в YouGile: отправить в архив, при необходимости вернуть на доску).

ALTER TABLE feedback_items   ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE feedback_replies ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE feedback_items   ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Приватный бакет: доступ только владельцу тикета (папка = user_id) и админу.
-- 50 МБ лимит покрывает короткие видео с телефона; is_admin() уже создан в 041.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('feedback-attachments', 'feedback-attachments', false, 52428800,
  ARRAY['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "feedback-attachments insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feedback-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin()));
CREATE POLICY "feedback-attachments select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'feedback-attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin()));

/* ─── reply_feedback / admin_reply_feedback — добавляем p_attachments ─── */

DROP FUNCTION IF EXISTS reply_feedback(uuid, text);
CREATE FUNCTION reply_feedback(p_id uuid, p_body text, p_attachments jsonb DEFAULT '[]'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM feedback_items WHERE id = p_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'feedback item not found';
  END IF;
  INSERT INTO feedback_replies (feedback_id, author_id, is_admin, body, attachments)
  VALUES (p_id, auth.uid(), false, p_body, p_attachments);
  UPDATE feedback_items
  SET updated_at = now(), status = CASE WHEN status = 'closed' THEN 'open' ELSE status END
  WHERE id = p_id;
END $$;
REVOKE ALL ON FUNCTION reply_feedback(uuid, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION reply_feedback(uuid, text, jsonb) TO authenticated;

DROP FUNCTION IF EXISTS admin_reply_feedback(uuid, text);
CREATE FUNCTION admin_reply_feedback(p_id uuid, p_body text, p_attachments jsonb DEFAULT '[]'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  INSERT INTO feedback_replies (feedback_id, author_id, is_admin, body, attachments)
  VALUES (p_id, auth.uid(), true, p_body, p_attachments);
  UPDATE feedback_items SET updated_at = now() WHERE id = p_id;
  PERFORM admin_log('feedback_reply', p_id::text);
END $$;
REVOKE ALL ON FUNCTION admin_reply_feedback(uuid, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_reply_feedback(uuid, text, jsonb) TO authenticated;

/* ─── admin_list_feedback_thread — вложения в ленте ─── */

CREATE OR REPLACE FUNCTION admin_list_feedback_thread(p_id uuid)
RETURNS TABLE (id uuid, is_admin boolean, body text, attachments jsonb, created_at timestamptz, author_email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT r.id, r.is_admin, r.body, r.attachments, r.created_at, u.email::text
  FROM feedback_replies r
  JOIN auth.users u ON u.id = r.author_id
  WHERE r.feedback_id = p_id
  ORDER BY r.created_at ASC;
END $$;
REVOKE ALL ON FUNCTION admin_list_feedback_thread(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_feedback_thread(uuid) TO authenticated;

/* ─── Архив: admin_list_feedback получает переключатель p_archived ─── */

DROP FUNCTION IF EXISTS admin_list_feedback(feedback_status);
CREATE FUNCTION admin_list_feedback(status_filter feedback_status DEFAULT NULL, p_archived boolean DEFAULT false)
RETURNS TABLE (
  id uuid, user_id uuid, user_email text, type feedback_type, title text, body text,
  status feedback_status, priority feedback_priority, created_at timestamptz, reply_count bigint, archived boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT f.id, f.user_id, u.email::text, f.type, f.title, f.body, f.status, f.priority, f.created_at,
         (SELECT count(*) FROM feedback_replies r WHERE r.feedback_id = f.id), f.archived
  FROM feedback_items f
  JOIN auth.users u ON u.id = f.user_id
  WHERE (status_filter IS NULL OR f.status = status_filter) AND f.archived = p_archived
  ORDER BY f.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION admin_list_feedback(feedback_status, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_feedback(feedback_status, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION admin_set_feedback_archived(p_id uuid, p_archived boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE feedback_items SET archived = p_archived, updated_at = now() WHERE id = p_id;
  PERFORM admin_log('feedback_archived', p_id::text || ' -> ' || p_archived::text);
END $$;
REVOKE ALL ON FUNCTION admin_set_feedback_archived(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_set_feedback_archived(uuid, boolean) TO authenticated;
