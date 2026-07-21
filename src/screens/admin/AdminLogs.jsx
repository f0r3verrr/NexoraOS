import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import { useAdminLogs } from '../../hooks/admin/useAdminLogs.js';
import { EmptyState, Badge } from './AdminUI.jsx';
import { fmtDateTime } from '../../lib/adminFormat.js';

const ACTION_TONE = {
  login: 'success', logout: 'neutral', user_signedup: 'info',
  ban_user: 'danger', unban_user: 'success', delete_user: 'danger',
};

export default function AdminLogs() {
  const [search, setSearch] = useState('');
  const { data: logs = [], isLoading } = useAdminLogs({ limit: 150 });

  const filtered = search
    ? logs.filter(l => l.actor?.toLowerCase().includes(search.toLowerCase()) || l.action?.toLowerCase().includes(search.toLowerCase()))
    : logs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 13px', borderRadius: 9, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
          <Icon name="search" size={14} style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по пользователю или действию..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--text)' }} />
        </div>
      </div>

      <div style={{ padding: '8px 20px', borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
        {isLoading ? (
          <EmptyState icon="list" text="Загрузка..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="list" text="Логов пока нет" />
        ) : filtered.map((log, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 160px 1fr', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--bg-elev-2)', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDateTime(log.occurred_at)}</span>
            <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.actor}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge tone={ACTION_TONE[log.action] ?? 'neutral'}>{log.action}</Badge>
              {log.details && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{log.details}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
