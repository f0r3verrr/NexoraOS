import { Icon } from '../../icons.jsx';
import { useAdminSecurity } from '../../hooks/admin/useAdminSecurity.js';
import { Card, CardHeader } from './AdminUI.jsx';

export default function AdminSecurity() {
  const { data: s, isLoading } = useAdminSecurity();
  const verifiedPct = s?.total_users ? Math.round(((s.total_users - s.unverified_emails) / s.total_users) * 100) : 0;

  const cards = [
    { label: 'Заблокированные аккаунты', value: s?.locked_accounts, icon: 'lock', accent: 'var(--danger)' },
    { label: 'Запросы сброса пароля (30д)', value: s?.password_reset_requests_30d, icon: 'repeat', accent: 'var(--warn)' },
    { label: 'Неподтверждённые email', value: s?.unverified_emails, icon: 'info', accent: 'var(--info)' },
    { label: 'Неудачные попытки входа (7д)', value: s?.failed_logins_7d, icon: 'shield', accent: 'var(--danger)' },
    { label: 'Подозрительная активность', value: s?.suspicious_activity, icon: 'flame', accent: 'var(--text-muted)', note: 'пока не отслеживается' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
        {cards.map(c => (
          <div key={c.label} style={{ padding: 18, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: `color-mix(in oklab, ${c.accent} 16%, transparent)`, color: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={c.icon} size={17} />
            </span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{isLoading ? '…' : c.value ?? 0}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{c.label}{c.note ? ` · ${c.note}` : ''}</div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Верификация email" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
            <div style={{ width: `${verifiedPct}%`, height: '100%', background: 'var(--success)', borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{isLoading ? '…' : `${verifiedPct}% подтверждено`}</span>
        </div>
      </Card>
    </div>
  );
}
