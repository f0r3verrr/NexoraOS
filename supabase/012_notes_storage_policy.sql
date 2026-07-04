-- Storage RLS policies for note-attachments bucket
-- Run this AFTER creating the bucket in Supabase Dashboard

CREATE POLICY "note_attachments_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'note-attachments'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "note_attachments_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'note-attachments'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "note_attachments_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'note-attachments'
    AND auth.uid()::text = split_part(name, '/', 1)
  );
