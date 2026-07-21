import { Icon } from '../../icons.jsx';
import { useAdminStatus } from '../../hooks/admin/useAdminStatus.js';

const STATIC_SERVICES = ['Realtime', 'Mail', 'Очередь', 'Cron-задачи'];

export default function AdminStatus() {
  const { data, isLoading } = useAdminStatus();

  const live = [
    { name: 'API', check: data?.api },
    { name: 'База данных', check: data?.api }, // один RPC-запрос покрывает Kong→PostgREST→Postgres
    { name: 'Авторизация', check: data?.auth },
    { name: 'Хранилище', check: data?.storage },
  ];

  const allOk = !isLoading && live.every(s => s.check?.ok);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        padding: '16px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10,
        background: allOk ? 'color-mix(in oklab, var(--success) 12%, transparent)' : 'color-mix(in oklab, var(--warn) 12%, transparent)',
        border: `1px solid color-mix(in oklab, ${allOk ? 'var(--success)' : 'var(--warn)'} 30%, transparent)`,
      }}>
        <Icon name={allOk ? 'check_circle' : 'flame'} size={18} style={{ color: allOk ? 'var(--success)' : 'var(--warn)' }} />
        <span style={{ fontSize: 14, fontWeight: 550, color: allOk ? 'var(--success)' : 'var(--warn)' }}>
          {isLoading ? 'Проверяем сервисы…' : allOk ? 'Все системы работают нормально' : 'Есть проблемы с сервисами'}
        </span>
      </div>

      <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
        {live.map(s => (
          <div key={s.name} style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: s.check?.ok ? 'var(--success)' : isLoading ? 'var(--text-muted)' : 'var(--danger)' }} />
              <span style={{ fontSize: 14, fontWeight: 550, flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.check?.ok ? 'var(--success)' : isLoading ? 'var(--text-muted)' : 'var(--danger)' }}>
                {isLoading ? '…' : s.check?.ok ? 'Healthy' : 'Недоступен'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Отклик: <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{s.check?.ms != null ? `${s.check.ms}ms` : '—'}</span></span>
            </div>
          </div>
        ))}

        {STATIC_SERVICES.map(name => (
          <div key={name} style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: 'var(--text-muted)' }} />
              <span style={{ fontSize: 14, fontWeight: 550, flex: 1 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Не отслеживается</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Нет инфраструктуры для живой проверки этого сервиса пока что.</div>
          </div>
        ))}
      </div>
    </div>
  );
}
