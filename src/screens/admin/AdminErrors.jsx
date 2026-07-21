import { useAdminErrors, useResolveError } from '../../hooks/admin/useAdminErrors.js';
import { Badge, AdminButton, EmptyState } from './AdminUI.jsx';
import { fmtDateTime } from '../../lib/adminFormat.js';

export default function AdminErrors() {
  const { data: errors = [], isLoading } = useAdminErrors();
  const resolve = useResolveError();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isLoading ? (
        <EmptyState icon="flame" text="Загрузка..." />
      ) : errors.length === 0 ? (
        <EmptyState icon="check_circle" text="Ошибок нет — всё чисто" />
      ) : errors.map(e => (
        <div key={e.id} style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <Badge tone={e.severity === 'error' ? 'danger' : 'warn'}>{e.severity}</Badge>
            <span style={{ fontSize: 13, fontWeight: 550 }}>{e.route ?? '—'}</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDateTime(e.created_at)}</span>
            <Badge tone={e.status === 'resolved' ? 'success' : 'neutral'}>{e.status === 'resolved' ? 'Решено' : 'Открыто'}</Badge>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 6 }}>{e.message}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Пользователь: {e.user_email ?? 'не авторизован'}</div>
          {e.stack && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 9, background: 'var(--bg)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'color-mix(in oklab, var(--danger) 70%, var(--text-2))', overflowX: 'auto', whiteSpace: 'pre' }}>
              {e.stack}
            </div>
          )}
          {e.status !== 'resolved' && (
            <div style={{ marginTop: 12 }}>
              <AdminButton onClick={() => resolve.mutate(e.id)}>Отметить решённым</AdminButton>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
