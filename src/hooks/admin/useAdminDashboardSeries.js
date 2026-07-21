import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';

const iso = (d) => d.toISOString().slice(0, 10);

export function useAdminDashboardSeries(range) {
  const start = iso(range.start), end = iso(range.end);
  return useQuery({
    // ключ — строки дат (день), а не сырые Date-объекты: range.end часто
    // строится через "now()" и отличается на миллисекунды на каждый рендер,
    // из-за чего с Date-объектами в ключе запрос рефетчился бы бесконечно
    queryKey: ['admin', 'dashboard-series', start, end],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_series', {
        start_date: start, end_date: end,
      });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    retry: false,
  });
}
