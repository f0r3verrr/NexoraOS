import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Icon } from '../icons.jsx';
import { Badge, IconButton } from '../components/primitives.jsx';
import { ConfirmModal } from '../components/Modal.jsx';

/*
 * Кастомная админ-панель (admin.nexoraos.ru).
 * Все данные — через security definer RPC (миграция 024):
 * сервер сам проверяет, что вызывающий состоит в admin_users.
 */

function fmtBytes(b) {
  if (!b) return '0 Б';
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(0)} КБ`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} МБ`;
  return `${(b / 1024 ** 3).toFixed(2)} ГБ`;
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtRel(iso) {
  if (!iso) return 'никогда';
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 30) return `${days} дн. назад`;
  return fmtDate(iso);
}

function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_stats');
      if (error) throw error;
      return data;
    },
    retry: false,
  });
}

function useAdminUsers(search) {
  return useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users', { search: search || null });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

function useAdminAction(fn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

/* ─── Метрика ────────────────────────────────────────────── */
function Metric({ label, value, sub, icon, accent = '--p-openresto' }) {
  return (
    <div style={{ flex: 1, minWidth: 150, padding: '16px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
        <span style={{ width: 24, height: 24, borderRadius: 7, background: `color-mix(in oklab, var(${accent}) 14%, transparent)`, color: `var(${accent})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={13} />
        </span>
      </div>
      <span style={{ fontSize: 26, fontWeight: 500, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

/* ─── График регистраций за 30 дней ──────────────────────── */
function SignupsChart({ data }) {
  // заполняем пропущенные дни нулями
  const map = new Map((data ?? []).map(r => [r.d, r.c]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }), c: map.get(key) ?? 0 };
  });
  const max = Math.max(...days.map(d => d.c), 1);

  return (
    <div style={{ padding: '16px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Регистрации</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>последние 30 дней</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90 }}>
        {days.map(d => (
          <div key={d.key} title={`${d.label}: ${d.c}`}
            style={{ flex: 1, height: `${Math.max(d.c / max * 100, d.c > 0 ? 8 : 2)}%`, borderRadius: 3, background: d.c > 0 ? 'color-mix(in oklab, var(--p-openresto) 60%, transparent)' : 'var(--bg-elev-3)', transition: 'height 200ms' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span>{days[0].label}</span><span>{days[14].label}</span><span>{days[29].label}</span>
      </div>
    </div>
  );
}

/* ─── Таблица пользователей ──────────────────────────────── */
function UsersTable() {
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading } = useAdminUsers(search);
  const [confirmDel, setConfirmDel] = useState(null);

  const ban    = useAdminAction(async (id) => { const { error } = await supabase.rpc('admin_ban_user',    { target: id }); if (error) throw error; });
  const unban  = useAdminAction(async (id) => { const { error } = await supabase.rpc('admin_unban_user',  { target: id }); if (error) throw error; });
  const remove = useAdminAction(async (id) => { const { error } = await supabase.rpc('admin_delete_user', { target: id }); if (error) throw error; });

  return (
    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      {confirmDel && (
        <ConfirmModal
          title="Удалить пользователя?"
          text={`${confirmDel.email} — аккаунт, все данные и файлы будут удалены безвозвратно.`}
          confirmLabel="Удалить навсегда"
          onConfirm={() => remove.mutate(confirmDel.id)}
          onClose={() => setConfirmDel(null)}
        />
      )}

      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', flex: 'none' }}>Пользователи</span>
        <div style={{ flex: 1, maxWidth: 300, display: 'flex', alignItems: 'center', gap: 7, height: 30, padding: '0 10px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 7 }}>
          <Icon name="search" size={12} style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email или имя…" className="no-ring"
            style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text)' }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{isLoading ? '…' : users.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 100px 110px 110px 90px', padding: '8px 16px', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elev-2)', gap: 10 }}>
        <span>Email</span><span>Имя</span><span>Создан</span><span>Был активен</span><span>Статус</span><span />
      </div>

      {isLoading ? (
        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Загрузка…</div>
      ) : users.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Никого не найдено</div>
      ) : (
        users.map(u => {
          const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
          return (
            <div key={u.id}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 100px 110px 110px 90px', padding: '10px 16px', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-subtle)', fontSize: 13, transition: 'background 80ms' }}>
              <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
              <span style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.display_name || '—'}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtDate(u.created_at)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtRel(u.last_sign_in_at)}</span>
              <span>
                {u.is_admin ? <Badge tone="info" dot>админ</Badge>
                  : isBanned ? <Badge tone="danger" dot>бан</Badge>
                  : !u.email_confirmed ? <Badge tone="warn" dot>не подтв.</Badge>
                  : <Badge tone="success" dot>активен</Badge>}
              </span>
              <span style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {!u.is_admin && (isBanned
                  ? <IconButton icon="check"  size="sm" title="Разбанить" onClick={() => unban.mutate(u.id)} />
                  : <IconButton icon="lock"   size="sm" title="Забанить"  onClick={() => ban.mutate(u.id)} />)}
                {!u.is_admin && <IconButton icon="trash" size="sm" title="Удалить"   onClick={() => setConfirmDel(u)} />}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─── Экран ──────────────────────────────────────────────── */
export default function Admin() {
  const { user, signOut } = useAuth();
  const { data: stats, isLoading, error } = useAdminStats();

  /* Не админ — сервер вернул forbidden */
  if (error) {
    return (
      <div className="app-surface" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: 'color-mix(in oklab, var(--danger) 14%, transparent)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={22} />
          </span>
          <span style={{ fontSize: 16, color: 'var(--text)' }}>Нет доступа</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Аккаунт {user?.email} не является администратором</span>
          <button onClick={signOut} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Выйти</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-surface" style={{ minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto' }}>
      {/* Шапка */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg)' }}>
        <img src="/favicon.png" alt="" style={{ height: 26, borderRadius: 7 }} />
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>NexoraOS · Админ</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{user?.email}</span>
        <button onClick={signOut} title="Выйти"
          style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
          <Icon name="x" size={14} />
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px 60px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Метрики */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Metric label="Пользователи" icon="users" value={isLoading ? '…' : stats?.total_users ?? 0}
            sub={stats ? `+${stats.new_7d} за 7 дней · ${stats.confirmed} подтверждено` : undefined} />
          <Metric label="Активны за 7 дней" icon="zap" accent="--p-youmin" value={isLoading ? '…' : stats?.active_7d ?? 0}
            sub={stats?.banned > 0 ? `${stats.banned} в бане` : 'банов нет'} />
          <Metric label="Файлы" icon="file" accent="--p-sites" value={isLoading ? '…' : stats?.storage_files ?? 0}
            sub={stats ? fmtBytes(stats.storage_bytes) : undefined} />
          <Metric label="Контент" icon="check" accent="--warn" value={isLoading ? '…' : (stats?.tasks_total ?? 0) + (stats?.notes_total ?? 0)}
            sub={stats ? `${stats.tasks_total} задач · ${stats.notes_total} заметок` : undefined} />
          <Metric label="Обучение пройдено" icon="star" accent="--success" value={isLoading ? '…' : stats?.onboarding_completed ?? 0}
            sub={stats ? `${stats.onboarding_skipped} пропустили · ${stats.onboarding_pending} ещё нет` : undefined} />
        </div>

        <SignupsChart data={stats?.signups_by_day} />

        <UsersTable />
      </div>
    </div>
  );
}
