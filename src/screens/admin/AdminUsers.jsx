import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../icons.jsx';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers.js';
import { Badge, EmptyState } from './AdminUI.jsx';
import { fmtRel } from '../../lib/adminFormat.js';

const PLAN_TONE = { pro: 'info', enterprise: 'success', free: 'neutral' };

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading } = useAdminUsers(search);
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
          <Icon name="search" size={15} style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Искать по имени или email..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)' }} />
        </div>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {isLoading ? '…' : `${users.length} пользователей`}
        </span>
      </div>

      {isLoading ? (
        <EmptyState icon="users" text="Загрузка…" />
      ) : users.length === 0 ? (
        <EmptyState icon="users" text="Никого не найдено" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
          {users.map(u => {
            const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
            const isActiveToday = fmtRel(u.last_sign_in_at) === 'сегодня';
            return (
              <div key={u.id} onClick={() => navigate(`/users/${u.id}`)}
                style={{ cursor: 'pointer', padding: 18, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 999, background: 'linear-gradient(135deg, var(--p-openresto), var(--p-youmin))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--bg)', flexShrink: 0 }}>
                    {(u.display_name || u.email)[0].toUpperCase()}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.display_name || '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  {u.is_admin ? <Badge tone="info">админ</Badge>
                    : isBanned ? <Badge tone="danger">бан</Badge>
                    : <Badge tone={PLAN_TONE.free}>{(u.plan || 'free').toUpperCase()}</Badge>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: isActiveToday ? 'var(--success)' : 'var(--text-muted)' }} />
                    {fmtRel(u.last_sign_in_at)}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--accent-teal)' }}>Открыть →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
