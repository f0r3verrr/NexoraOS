import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function timedFetch(path) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers: { apikey: ANON_KEY } });
    return { ok: res.ok, ms: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, ms: null };
  }
}

async function timedPing() {
  const start = performance.now();
  const { error } = await supabase.rpc('admin_health_ping');
  return { ok: !error, ms: Math.round(performance.now() - start) };
}

/*
 * Живые проверки — API (RPC round-trip через Kong→PostgREST→Postgres),
 * Auth (/auth/v1/health) и Storage (/storage/v1/status). Realtime/Mail/
 * Queue/Cron не проверяются вживую — нет для этого инфраструктуры,
 * помечены как "статично" в UI.
 */
export function useAdminStatus() {
  return useQuery({
    queryKey: ['admin', 'status'],
    queryFn: async () => {
      const [api, auth, storage] = await Promise.all([
        timedPing(),
        timedFetch('/auth/v1/health'),
        timedFetch('/storage/v1/status'),
      ]);
      return { api, auth, storage, checkedAt: new Date().toISOString() };
    },
    retry: false,
    refetchInterval: 60_000,
  });
}
