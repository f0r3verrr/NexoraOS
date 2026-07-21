-- admin_list_feedback показывал только email — добавляем отображаемое имя
-- пользователя (тот же coalesce raw_user_meta_data/profiles, что и в
-- admin_list_users), чтобы в канбане и карточке тикета было видно имя.

DROP FUNCTION IF EXISTS admin_list_feedback(feedback_status, boolean);
CREATE FUNCTION admin_list_feedback(status_filter feedback_status DEFAULT NULL, p_archived boolean DEFAULT false)
RETURNS TABLE (
  id uuid, user_id uuid, user_email text, user_name text, type feedback_type, title text, body text, attachments jsonb,
  status feedback_status, priority feedback_priority, created_at timestamptz, reply_count bigint, archived boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT f.id, f.user_id, u.email::text,
         coalesce(u.raw_user_meta_data->>'display_name', p.display_name)::text,
         f.type, f.title, f.body, f.attachments, f.status, f.priority, f.created_at,
         (SELECT count(*) FROM feedback_replies r WHERE r.feedback_id = f.id), f.archived
  FROM feedback_items f
  JOIN auth.users u ON u.id = f.user_id
  LEFT JOIN profiles p ON p.id = f.user_id
  WHERE (status_filter IS NULL OR f.status = status_filter) AND f.archived = p_archived
  ORDER BY f.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION admin_list_feedback(feedback_status, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_feedback(feedback_status, boolean) TO authenticated;
