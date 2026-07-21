-- Обратная связь: жалобы/предложения от пользователей + ответы админа

CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'question', 'other');
CREATE TYPE feedback_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE feedback_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE IF NOT EXISTS feedback_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       feedback_type NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  status     feedback_status NOT NULL DEFAULT 'open',
  priority   feedback_priority NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback own select" ON feedback_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "feedback own insert" ON feedback_items FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS feedback_replies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users(id),
  is_admin    boolean NOT NULL DEFAULT false,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_replies own select" ON feedback_replies FOR SELECT
  USING (EXISTS (SELECT 1 FROM feedback_items f WHERE f.id = feedback_id AND f.user_id = auth.uid()));

/* ─── Admin ─── */
CREATE OR REPLACE FUNCTION admin_list_feedback(status_filter feedback_status DEFAULT NULL)
RETURNS TABLE (
  id uuid, user_id uuid, user_email text, type feedback_type, title text, body text,
  status feedback_status, priority feedback_priority, created_at timestamptz, reply_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  RETURN QUERY
  SELECT f.id, f.user_id, u.email::text, f.type, f.title, f.body, f.status, f.priority, f.created_at,
         (SELECT count(*) FROM feedback_replies r WHERE r.feedback_id = f.id)
  FROM feedback_items f
  JOIN auth.users u ON u.id = f.user_id
  WHERE status_filter IS NULL OR f.status = status_filter
  ORDER BY f.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION admin_set_feedback_status(p_id uuid, p_status feedback_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE feedback_items SET status = p_status, updated_at = now() WHERE id = p_id;
  PERFORM admin_log('feedback_status', p_id::text || ' -> ' || p_status::text);
END $$;

CREATE OR REPLACE FUNCTION admin_set_feedback_priority(p_id uuid, p_priority feedback_priority)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  UPDATE feedback_items SET priority = p_priority, updated_at = now() WHERE id = p_id;
  PERFORM admin_log('feedback_priority', p_id::text || ' -> ' || p_priority::text);
END $$;

CREATE OR REPLACE FUNCTION admin_reply_feedback(p_id uuid, p_body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM admin_check();
  INSERT INTO feedback_replies (feedback_id, author_id, is_admin, body) VALUES (p_id, auth.uid(), true, p_body);
  PERFORM admin_log('feedback_reply', p_id::text);
END $$;

REVOKE ALL ON FUNCTION admin_list_feedback(feedback_status), admin_set_feedback_status(uuid, feedback_status),
  admin_set_feedback_priority(uuid, feedback_priority), admin_reply_feedback(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_list_feedback(feedback_status), admin_set_feedback_status(uuid, feedback_status),
  admin_set_feedback_priority(uuid, feedback_priority), admin_reply_feedback(uuid, text) TO authenticated;
