import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/* Статус и шаг онбординг-тура (profiles.onboarding_status / onboarding_step) */
export function useOnboarding() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['prefs', 'onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_status, onboarding_step')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        // колонки ещё нет (миграция 026 не выполнена) — не показываем тур, чтобы не спамить
        if (error.code === '42703' || error.message?.includes('onboarding_status')) {
          return { onboarding_status: 'completed', onboarding_step: 0 };
        }
        throw error;
      }
      return data ?? { onboarding_status: 'pending', onboarding_step: 0 };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useSetOnboardingStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ status, step = 0 }) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, onboarding_status: status, onboarding_step: step }, { onConflict: 'id' });
      if (error) throw error;
      return { onboarding_status: status, onboarding_step: step };
    },
    onSuccess: (data) => qc.setQueryData(['prefs', 'onboarding'], data),
  });
}

/* Только для паузы/ухода — не вызывается на каждый клик «Далее» */
export function useSetOnboardingStep() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ step }) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, onboarding_status: 'in_progress', onboarding_step: step }, { onConflict: 'id' });
      if (error) throw error;
      return { onboarding_status: 'in_progress', onboarding_step: step };
    },
    onSuccess: (data) => qc.setQueryData(['prefs', 'onboarding'], data),
  });
}
