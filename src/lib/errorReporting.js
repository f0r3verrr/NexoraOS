import { supabase } from './supabase.js';

const recentlyReported = new Map(); // message -> timestamp, throttle одинаковых ошибок

export function reportClientError({ route, message, stack, severity = 'error' }) {
  try {
    const key = String(message).slice(0, 200);
    const now = Date.now();
    const last = recentlyReported.get(key);
    if (last && now - last < 10_000) return;
    recentlyReported.set(key, now);

    supabase.rpc('log_client_error', {
      route: route ?? window.location.pathname,
      message: String(message ?? 'Unknown error'),
      stack: stack ? String(stack) : null,
      severity,
    }).then(({ error }) => {
      if (error) console.warn('[errorReporting] failed to log error:', error);
    });
  } catch {
    // репортер сам никогда не должен ронять приложение
  }
}
