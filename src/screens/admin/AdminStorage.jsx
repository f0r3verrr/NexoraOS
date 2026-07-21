import { useState } from 'react';
import { useAdminStorageOverview, useAdminUserStorage } from '../../hooks/admin/useAdminStorage.js';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers.js';
import { LineChartArea } from './charts/LineChartArea.jsx';
import { DonutChart } from './charts/DonutChart.jsx';
import { Card, CardHeader, EmptyState } from './AdminUI.jsx';
import { fmtBytes, fmtDate } from '../../lib/adminFormat.js';

const TYPE_COLORS = { 'Изображения': 'var(--accent-teal)', 'Видео': 'var(--p-youmin)', 'Документы': 'var(--warn)', 'Прочее': 'var(--text-muted)' };

function UserFilesDrilldown({ userId, onClose }) {
  const { data: files = [], isLoading } = useAdminUserStorage(userId);
  return (
    <div style={{ padding: '12px 4px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {isLoading ? (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Загрузка…</span>
      ) : files.length === 0 ? (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Файлов нет</span>
      ) : files.slice(0, 20).map((f, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-2)' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{f.name.split('/').pop()}</span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtBytes(f.size)}</span>
        </div>
      ))}
      <button onClick={onClose} style={{ alignSelf: 'flex-start', marginTop: 6, fontSize: 11.5, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Свернуть</button>
    </div>
  );
}

export default function AdminStorage() {
  const { data: overview, isLoading } = useAdminStorageOverview();
  const [expanded, setExpanded] = useState(null);

  const byType = overview?.by_type ?? [];
  const segments = byType.map(t => ({ label: t.type, value: t.bytes, color: TYPE_COLORS[t.type] ?? 'var(--text-muted)', display: fmtBytes(t.bytes) }));
  const growthValues = (overview?.growth_by_day ?? []).map(r => r.bytes);
  const topUsers = overview?.top_users ?? [];
  const maxTop = Math.max(...topUsers.map(u => u.bytes), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ alignItems: 'center' }}>
          <div style={{ alignSelf: 'flex-start', fontSize: 14.5, fontWeight: 550 }}>Хранилище по типам</div>
          {isLoading ? <EmptyState text="Загрузка…" /> : segments.length === 0 ? <EmptyState text="Нет данных" /> : (
            <DonutChart segments={segments} centerValue={fmtBytes(overview?.total_bytes)} centerLabel="всего" size={160} />
          )}
        </Card>
        <Card>
          <CardHeader title="Рост хранилища" />
          <LineChartArea values={growthValues} color="var(--warn)" height={140} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Топ пользователей по хранилищу" />
        {topUsers.length === 0 ? <EmptyState text="Нет данных" /> : topUsers.map(u => (
          <div key={u.id}>
            <div onClick={() => setExpanded(expanded === u.id ? null : u.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--bg-elev-2)' }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, background: 'linear-gradient(135deg, var(--p-openresto), var(--p-youmin))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 600, color: 'var(--bg)', flexShrink: 0 }}>
                {u.email[0].toUpperCase()}
              </span>
              <span style={{ fontSize: 12.5, flex: 1 }}>{u.email}</span>
              <div style={{ width: 160, height: 6, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
                <div style={{ width: `${(u.bytes / maxTop) * 100}%`, height: '100%', background: 'var(--p-openresto)', borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 70, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmtBytes(u.bytes)}</span>
            </div>
            {expanded === u.id && <UserFilesDrilldown userId={u.id} onClose={() => setExpanded(null)} />}
          </div>
        ))}
      </Card>
    </div>
  );
}
