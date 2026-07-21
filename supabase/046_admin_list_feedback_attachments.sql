-- admin_list_feedback не возвращал attachments у самого тикета (только у
-- ответов, через admin_list_feedback_thread) — поэтому вложения, добавленные
-- при СОЗДАНИИ обращения, не показывались в админке (только текст).

DROP FUNCTION IF EXISTS admin_list_feedback(feedback_status, boolean);
CREATE FUNCTION admin_list_feedback(status_filter feedback_status DEFAULT NULL, p_archived boolean DEFAULT false)
RETURNS TABLE (
  id uuid, user_id uuid, user_email text, type feedback_type, title text, body text, attachments jsonb,
  status feedback_status, priority feedback_priority, created_at timestamptz, reply_count bigint, archived boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT f.id, f.user_id, u.email::text, f.type, f.title, f.body, f.attachments, f.status, f.priority, f.created_at,
         (SELECT count(*) FROM feedback_replies r WHERE r.feedback_id = f.id), f.archived
  FROM feedback_items f
  JOIN auth.users u ON u.id = f.user_id
  WHERE (status_filter IS NULL OR f.status = status_filter) AND f.archived = p_archived
  ORDER BY f.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION admin_list_feedback(feedback_status, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_feedback(feedback_status, boolean) TO authenticated;
