import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';
import { useAdminAction } from './useAdminAction.js';

export function useNewsAdmin() {
  return useQuery({
    queryKey: ['admin', 'news'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_news');
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

export function useCreateNews() {
  return useAdminAction(async (v) => {
    const { error } = await supabase.rpc('admin_create_news', {
      p_title: v.title, p_category: v.category, p_description: v.description,
      p_icon: v.icon, p_push_notify: v.push_notify, p_published: v.published,
    });
    if (error) throw error;
  });
}

export function useUpdateNews() {
  return useAdminAction(async ({ id, ...v }) => {
    const { error } = await supabase.rpc('admin_update_news', {
      p_id: id, p_title: v.title, p_category: v.category, p_description: v.description,
      p_icon: v.icon, p_push_notify: v.push_notify, p_published: v.published,
    });
    if (error) throw error;
  });
}

export function useDeleteNews() {
  return useAdminAction(async (id) => {
    const { error } = await supabase.rpc('admin_delete_news', { p_id: id });
    if (error) throw error;
  });
}
