import { useMutation, useQueryClient } from '@tanstack/react-query';

/* Общая обёртка для admin-мутаций — инвалидирует весь namespace ['admin'] после успеха */
export function useAdminAction(fn, opts = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      opts.onSuccess?.(...args);
    },
  });
}
