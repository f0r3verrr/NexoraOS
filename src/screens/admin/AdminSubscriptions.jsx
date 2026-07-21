import { Icon } from '../../icons.jsx';
import { Card, CardHeader, Metric } from './AdminUI.jsx';
import { MOCK_SUB_STATS, MOCK_MRR, MOCK_PLANS } from './mockSubscriptions.js';

/* Мокнутая страница — реальный биллинг подключим позже, сейчас чистый UI */
export default function AdminSubscriptions() {
  const max = Math.max(...MOCK_MRR.map(m => m.value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
        {MOCK_SUB_STATS.map(s => (
          <div key={s.label} style={{ padding: 18, borderRadius: 16, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="MRR за последние 6 месяцев" />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 140 }}>
          {MOCK_MRR.map(b => (
            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{b.value}к</span>
              <div style={{ width: '100%', height: `${(b.value / max) * 100}%`, borderRadius: '6px 6px 2px 2px', background: 'linear-gradient(180deg, var(--p-openresto), var(--p-youmin))' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 }}>
        {MOCK_PLANS.map(p => (
          <div key={p.name} style={{
            padding: 24, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 16,
            background: p.highlight ? 'color-mix(in oklab, var(--p-youmin) 8%, var(--bg-elev-1))' : 'var(--bg-elev-1)',
            border: `1px solid ${p.highlight ? 'color-mix(in oklab, var(--p-youmin) 40%, transparent)' : 'var(--border-subtle)'}`,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 26, fontWeight: 600, marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                {p.price}<span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>{p.period}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {p.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
                  <Icon name="check" size={13} style={{ color: 'var(--success)' }} /> {f}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Активных пользователей</span>
              <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{p.activeUsers}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
