import { useState } from 'react';
import { useAdminAnalytics } from '../../hooks/admin/useAdminAnalytics.js';
import { LineChartArea } from './charts/LineChartArea.jsx';
import { Card, CardHeader, EmptyState } from './AdminUI.jsx';

const TABS = [
  { key: '7d', label: '7д' }, { key: '30d', label: '30д' }, { key: '90d', label: '90д' }, { key: '1Y', label: '1Г' },
];

function seriesFromDays(rows) {
  return (rows ?? []).map(r => r.c);
}

export default function AdminAnalytics() {
  const [range, setRange] = useState('30d');
  const { data, isLoading } = useAdminAnalytics(range);
  const activity = seriesFromDays(data?.activity_by_day);
  const modules = data?.modules ?? [];
  const maxModule = Math.max(...modules.map(m => m.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setRange(t.key)} style={{
            height: 34, padding: '0 16px', borderRadius: 8,
            border: `1px solid ${range === t.key ? 'var(--p-openresto)' : 'var(--border-subtle)'}`,
            background: range === t.key ? 'color-mix(in oklab, var(--p-openresto) 14%, transparent)' : 'var(--bg-elev-1)',
            color: range === t.key ? 'var(--text)' : 'var(--text-3)', fontSize: 12.5, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
        {[
          { label: 'DAU', value: data?.dau ?? 0 },
          { label: 'WAU', value: data?.wau ?? 0 },
          { label: 'MAU', value: data?.mau ?? 0 },
          { label: 'DAU / MAU', value: data?.mau ? `${((data.dau / data.mau) * 100).toFixed(0)}%` : '—' },
        ].map(s => (
          <div key={s.label} style={{ padding: 18, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{isLoading ? '…' : s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Активность пользователей" />
        <LineChartArea values={activity} color="var(--accent-teal)" width={640} height={160} />
      </Card>

      <Card>
        <CardHeader title="Самые используемые модули" />
        {modules.length === 0 ? <EmptyState text="Нет данных" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {modules.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 100, fontSize: 12.5, color: 'var(--text-2)', flexShrink: 0 }}>{m.name}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
                  <div style={{ width: `${(m.count / maxModule) * 100}%`, height: '100%', borderRadius: 999, background: 'var(--p-openresto)' }} />
                </div>
                <span style={{ width: 50, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{m.count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
