import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';
import { useAdminAction } from './useAdminAction.js';

export function useChangelogAdmin() {
  return useQuery({
    queryKey: ['admin', 'changelog'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_changelog');
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

const toRpcArgs = (v) => ({
  p_title: v.title, p_version: v.version, p_description: v.description,
  p_cover_image_url: v.cover_image_url || null, p_release_date: v.release_date,
  p_priority: v.priority, p_button_text: v.button_text || null, p_button_link: v.button_link || null,
  p_visibility: v.visibility, p_published: v.published,
});

export function useCreateChangelog() {
  return useAdminAction(async (v) => {
    const { error } = await supabase.rpc('admin_create_changelog', toRpcArgs(v));
    if (error) throw error;
  });
}

export function useUpdateChangelog() {
  return useAdminAction(async ({ id, ...v }) => {
    const { error } = await supabase.rpc('admin_update_changelog', { p_id: id, ...toRpcArgs(v) });
    if (error) throw error;
  });
}

export function usePublishChangelog() {
  return useAdminAction(async ({ id, published }) => {
    const { error } = await supabase.rpc('admin_publish_changelog', { p_id: id, p_published: published });
    if (error) throw error;
  });
}

export function useDeleteChangelog() {
  return useAdminAction(async (id) => {
    const { error } = await supabase.rpc('admin_delete_changelog', { p_id: id });
    if (error) throw error;
  });
}
