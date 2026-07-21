import { Link } from 'react-router-dom';
import { Icon } from '../../icons.jsx';
import { useAdminStats } from '../../hooks/admin/useAdminStats.js';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers.js';
import { useFeatureFlags } from '../../hooks/admin/useFeatureFlags.js';
import { useFeedbackAdmin } from '../../hooks/admin/useFeedbackAdmin.js';
import { useAdminLogs } from '../../hooks/admin/useAdminLogs.js';
import { useAdminStorageOverview } from '../../hooks/admin/useAdminStorage.js';
import { LineChartArea } from './charts/LineChartArea.jsx';
import { DonutChart } from './charts/DonutChart.jsx';
import { Card, CardHeader, Metric, Badge, EmptyState } from './AdminUI.jsx';
import { fmtBytes, fmtDateTime, fmtRel } from '../../lib/adminFormat.js';

function seriesFromDays(rows, days = 30) {
  const map = new Map((rows ?? []).map(r => [r.d, r.c]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(map.get(d.toISOString().slice(0, 10)) ?? 0);
  }
  return out;
}

const FLAG_STATUS_TONE = { 'enabled': 'success', 'beta': 'warn', 'disabled': 'neutral', 'internal': 'info' };
const FLAG_STATUS_LABEL = { enabled: 'Включено', beta: 'Бета', disabled: 'Отключено', internal: 'Внутреннее' };
const FEEDBACK_STATUS_TONE = { open: 'danger', in_progress: 'warn', closed: 'success' };
const FEEDBACK_STATUS_LABEL = { open: 'Открыто', in_progress: 'В работе', closed: 'Закрыто' };

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: users = [] } = useAdminUsers();
  const { data: flags = [] } = useFeatureFlags();
  const { data: feedback = [] } = useFeedbackAdmin();
  const { data: logs = [] } = useAdminLogs({ limit: 6 });
  const { data: storage } = useAdminStorageOverview();

  const regValues = seriesFromDays(stats?.signups_by_day);
  const actValues = seriesFromDays(stats?.active_by_day);

  const storageSegments = (storage?.by_type ?? []).map((t, i) => ({
    label: t.type, value: t.bytes,
    color: ['var(--accent-teal)', 'var(--p-openresto)', 'var(--p-youmin)', 'var(--warn)'][i % 4],
    display: fmtBytes(t.bytes),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Метрики */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 14 }}>
        <Metric label="Пользователи" icon="users" value={isLoading ? '…' : stats?.total_users ?? 0}
          delta={stats ? `+${stats.new_7d} за 7 дней` : undefined} deltaColor="var(--success)" />
        <Metric label="Активные (7 дней)" icon="activity" accent="var(--success)" value={isLoading ? '…' : stats?.active_7d ?? 0}
          delta={stats ? `${stats.confirmed} подтверждено` : undefined} />
        <Metric label="Новые регистрации" icon="plus" accent="var(--p-youmin)" value={isLoading ? '…' : stats?.new_7d ?? 0}
          delta="за 7 дней" />
        <Metric label="Файлы" icon="folder" accent="var(--warn)" value={isLoading ? '…' : fmtBytes(stats?.storage_bytes)}
          delta={stats ? `${stats.storage_files} файлов` : undefined} />
        <Metric label="Контент создан" icon="note" accent="var(--accent-violet)" value={isLoading ? '…' : (stats?.tasks_total ?? 0) + (stats?.notes_total ?? 0)}
          delta="задачи + заметки" />
        <Metric label="Ошибки (24ч)" icon="flame" accent="var(--danger)" value={isLoading ? '…' : stats?.errors_24h ?? 0}
          delta={stats?.banned > 0 ? `${stats.banned} в бане` : 'банов нет'} />
      </div>

      {/* Чарты + статус */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 16, alignItems: 'stretch' }}>
        <Card>
          <CardHeader title="Регистрации" action={<Badge tone="neutral">30 дней</Badge>} />
          <LineChartArea values={regValues} color="var(--accent-teal)" />
        </Card>
        <Card>
          <CardHeader title="Активность пользователей" action={<Badge tone="neutral">30 дней</Badge>} />
          <LineChartArea values={actValues} color="var(--p-youmin)" />
        </Card>
        <Card>
          <CardHeader title="Состояние системы" action={<Link to="/status" style={{ fontSize: 11, color: 'var(--success)', textDecoration: 'none' }}>Подробнее →</Link>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'API', ok: true }, { name: 'База данных', ok: true }, { name: 'Хранилище', ok: true },
              { name: 'Авторизация', ok: true },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: s.ok ? 'var(--success)' : 'var(--danger)' }} />
                <span style={{ fontSize: 12.5, flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 11.5, color: 'var(--success)' }}>Healthy</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Пользователи / хранилище / жалобы */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, alignItems: 'stretch' }}>
        <Card>
          <CardHeader title="Последние пользователи" action={<Link to="/users" style={{ fontSize: 12, color: 'var(--accent-teal)', textDecoration: 'none' }}>Все пользователи →</Link>} />
          {users.slice(0, 5).map(u => (
            <Link key={u.id} to={`/users/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '1px solid var(--bg-elev-2)', textDecoration: 'none', color: 'inherit' }}>
              <span style={{ width: 30, height: 30, borderRadius: 999, background: 'linear-gradient(135deg, var(--p-openresto), var(--p-youmin))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--bg)', flexShrink: 0 }}>
                {(u.display_name || u.email)[0].toUpperCase()}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.display_name || '—'}</div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtRel(u.last_sign_in_at)}</span>
            </Link>
          ))}
          {users.length === 0 && <EmptyState text="Пока нет пользователей" />}
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>Показано {Math.min(5, users.length)} из {users.length}</div>
        </Card>

        <Card style={{ alignItems: 'center' }}>
          <div style={{ alignSelf: 'flex-start', fontSize: 14.5, fontWeight: 550 }}>Использование хранилища</div>
          {storageSegments.length > 0 ? (
            <DonutChart segments={storageSegments} centerValue={fmtBytes(storage?.total_bytes)} centerLabel="занято" />
          ) : <EmptyState text="Нет данных" />}
          <Link to="/storage" style={{ marginTop: 6, fontSize: 12, color: 'var(--accent-teal)', textDecoration: 'none', alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between' }}>
            Перейти к хранилищу <span>→</span>
          </Link>
        </Card>

        <Card>
          <CardHeader title="Последние жалобы" action={<Link to="/feedback" style={{ fontSize: 12, color: 'var(--accent-teal)', textDecoration: 'none' }}>Все жалобы →</Link>} />
          {feedback.slice(0, 3).map(fb => (
            <div key={fb.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'color-mix(in oklab, var(--info) 16%, transparent)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="message" size={13} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fb.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fb.user_email}</div>
              </div>
              <Badge tone={FEEDBACK_STATUS_TONE[fb.status]}>{FEEDBACK_STATUS_LABEL[fb.status]}</Badge>
            </div>
          ))}
          {feedback.length === 0 && <EmptyState icon="message" text="Жалоб пока нет" />}
        </Card>
      </div>

      {/* Логи / feature flags */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Последние логи" />
          <div style={{ display: 'grid', gridTemplateColumns: '90px 120px 1fr 1fr', gap: '8px 12px', fontSize: 11, color: 'var(--text-muted)', paddingBottom: 8, borderBottom: '1px solid var(--bg-elev-2)' }}>
            <span>Время</span><span>Пользователь</span><span>Действие</span><span>Детали</span>
          </div>
          {logs.map((log, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 120px 1fr 1fr', gap: '8px 12px', fontSize: 12, padding: '9px 0', borderBottom: '1px solid var(--bg-elev-2)' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{fmtDateTime(log.occurred_at)}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.actor}</span>
              <span style={{ color: 'var(--text-2)' }}>{log.action}</span>
              <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details ?? '—'}</span>
            </div>
          ))}
          {logs.length === 0 && <EmptyState icon="list" text="Логов пока нет" />}
        </Card>

        <Card>
          <CardHeader title="Активные Feature Flags" action={<Link to="/feature-flags" style={{ fontSize: 12, color: 'var(--accent-teal)', textDecoration: 'none' }}>Все фичи →</Link>} />
          {flags.slice(0, 5).map(fl => (
            <div key={fl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--bg-elev-2)' }}>
              <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fl.key}</span>
              <Badge tone={FLAG_STATUS_TONE[fl.status]}>{FLAG_STATUS_LABEL[fl.status]}</Badge>
            </div>
          ))}
          {flags.length === 0 && <EmptyState icon="zap" text="Флагов пока нет" />}
        </Card>
      </div>
    </div>
  );
}
