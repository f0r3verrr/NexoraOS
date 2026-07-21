import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../icons.jsx';
import { Modal, ConfirmModal } from '../../components/Modal.jsx';
import {
  useAdminUserDetail, useBanUser, useUnbanUser, useDeleteUser,
  useVerifyEmail, useLogoutUserSessions, useSetUserRole, useSetUserSubscription, useResetUserPassword,
} from '../../hooks/admin/useAdminUsers.js';
import { Card, Badge, AdminButton, EmptyState } from './AdminUI.jsx';
import { fmtBytes, fmtDate, fmtRel, fmtDateTime } from '../../lib/adminFormat.js';

const PLANS = ['free', 'pro', 'enterprise'];

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: u, isLoading } = useAdminUserDetail(id);

  const ban = useBanUser(), unban = useUnbanUser(), del = useDeleteUser();
  const verify = useVerifyEmail(), logoutSessions = useLogoutUserSessions();
  const setRole = useSetUserRole(), setPlan = useSetUserSubscription();
  const resetPwd = useResetUserPassword();

  const [confirmDel, setConfirmDel] = useState(false);
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  if (isLoading || !u) {
    return <EmptyState icon="users" text="Загрузка..." />;
  }

  const isBanned = u.banned_until && new Date(u.banned_until) > new Date();

  const handleResetPassword = () => {
    resetPwd.mutate(id, { onSuccess: (pwd) => setTempPassword(pwd) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={() => navigate('/users')} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Icon name="chevron_left" size={14} /> Все пользователи
      </button>

      {confirmDel && (
        <ConfirmModal
          title="Удалить пользователя?"
          text={`${u.email} — аккаунт, все данные и файлы будут удалены безвозвратно.`}
          confirmLabel="Удалить навсегда"
          onConfirm={() => del.mutate(id, { onSuccess: () => navigate('/users') })}
          onClose={() => setConfirmDel(false)}
        />
      )}

      {planPickerOpen && (
        <Modal title="Сменить план" width={340} onClose={() => setPlanPickerOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLANS.map(p => (
              <button key={p} onClick={() => { setPlan.mutate({ id, plan: p }, { onSuccess: () => setPlanPickerOpen(false) }); }}
                style={{
                  height: 38, borderRadius: 9, border: '1px solid var(--border-subtle)',
                  background: u.plan === p ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)', color: 'var(--text)',
                  fontSize: 13, cursor: 'pointer', textTransform: 'uppercase',
                }}>
                {p}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {tempPassword && (
        <Modal title="Временный пароль" sub="Скопируйте и передайте пользователю вручную — этот пароль больше не показажется" width={400} onClose={() => setTempPassword(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 9, fontFamily: 'var(--font-mono)', fontSize: 14 }}>
            <span style={{ flex: 1 }}>{tempPassword}</span>
            <button onClick={() => navigator.clipboard.writeText(tempPassword)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }}>
              <Icon name="copy" size={15} />
            </button>
          </div>
        </Modal>
      )}

      {/* Профиль */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ width: 64, height: 64, borderRadius: 999, background: 'linear-gradient(135deg, var(--p-openresto), var(--p-youmin))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, color: 'var(--bg)', flexShrink: 0 }}>
          {(u.display_name || u.email)[0].toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>{u.display_name || u.email}</span>
            <Badge tone={u.plan === 'free' ? 'neutral' : 'info'}>{(u.plan || 'free').toUpperCase()}</Badge>
            {u.is_admin && <Badge tone="success">админ</Badge>}
            {isBanned && <Badge tone="danger">бан</Badge>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{u.email}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
            <span>Регистрация: {fmtDate(u.created_at)}</span>
            <span>Последняя активность: {fmtRel(u.last_sign_in_at)}</span>
            <span>{u.email_confirmed ? 'Email подтверждён' : 'Email не подтверждён'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 460, justifyContent: 'flex-end' }}>
          {!u.email_confirmed && <AdminButton onClick={() => verify.mutate(id)}>Подтвердить email</AdminButton>}
          <AdminButton onClick={() => setPlanPickerOpen(true)}>Сменить план</AdminButton>
          <AdminButton onClick={() => setRole.mutate({ id, makeAdmin: !u.is_admin })}>{u.is_admin ? 'Убрать роль админа' : 'Сделать админом'}</AdminButton>
          <AdminButton onClick={() => logoutSessions.mutate(id)}>Завершить сессии</AdminButton>
          <AdminButton onClick={handleResetPassword} disabled={resetPwd.isPending}>Сбросить пароль</AdminButton>
          {!u.is_admin && (isBanned
            ? <AdminButton onClick={() => unban.mutate(id)}>Разбанить</AdminButton>
            : <AdminButton onClick={() => ban.mutate(id)} danger>Забанить</AdminButton>)}
          {!u.is_admin && <AdminButton onClick={() => setConfirmDel(true)} danger>Удалить</AdminButton>}
        </div>
      </Card>

      {/* Статы */}
      <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 14 }}>
        {[
          { label: 'Проекты', value: u.stats.projects },
          { label: 'Задачи', value: u.stats.tasks },
          { label: 'Заметки', value: u.stats.notes },
          { label: 'Медиа', value: u.stats.media },
          { label: 'Хранилище', value: fmtBytes(u.stats.storage_bytes) },
        ].map(s => (
          <div key={s.label} style={{ padding: 16, borderRadius: 14, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 19, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Таймлайн */}
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 550 }}>Активность</div>
        {(u.timeline ?? []).length === 0 ? (
          <EmptyState icon="activity" text="Активности пока нет" />
        ) : u.timeline.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--bg-elev-2)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 130, flexShrink: 0 }}>{fmtDateTime(t.occurred_at)}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{t.action}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
