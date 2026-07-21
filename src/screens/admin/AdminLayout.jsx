import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../icons.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { ADMIN_NAV, ADMIN_GROUPS, adminNavByPath } from '../../lib/adminNav.js';
import '../../styles/admin-theme.css';

function useAdminBadges() {
  return useQuery({
    queryKey: ['admin', 'badges'],
    queryFn: async () => {
      const [feedback, errors] = await Promise.all([
        supabase.rpc('admin_list_feedback', { status_filter: 'open' }),
        supabase.rpc('admin_list_errors', { status_filter: 'open' }),
      ]);
      return { openFeedback: feedback.data?.length ?? 0, openErrors: errors.data?.length ?? 0 };
    },
    retry: false,
    staleTime: 60_000,
  });
}

function NavItem({ item, active }) {
  return (
    <NavLink to={item.path} end={item.path === '/'}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 36,
        padding: '0 10px', borderRadius: 9, fontSize: 13, textDecoration: 'none',
        background: active ? 'var(--bg-elev-3)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-3)',
        transition: 'background 100ms, color 100ms',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon name={item.icon} size={16} />
      {item.label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: badges } = useAdminBadges();
  const [showBell, setShowBell] = useState(false);

  const activeKey = adminNavByPath(pathname).key;
  const top = ADMIN_NAV.filter(n => !n.group);
  const badgeTotal = (badges?.openFeedback ?? 0) + (badges?.openErrors ?? 0);

  return (
    <div className="admin-root" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* SIDEBAR — фиксированная высота экрана, сама никогда не скроллится целиком
          (только внутренний <nav>), поэтому кнопка выхода всегда на виду */}
      <aside style={{
        width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--bg-elev-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 18px' }}>
          <img src="/favicon.png" alt="" style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.2 }}>NexoraOS</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>Admin</div>
          </div>
        </div>

        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            {top.map(item => <NavItem key={item.key} item={item} active={item.key === activeKey} />)}
          </div>
          {ADMIN_GROUPS.map(group => {
            const items = ADMIN_NAV.filter(n => n.group === group);
            return (
              <div key={group}>
                <div style={{ padding: '0 10px 8px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {group}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {items.map(item => (
                    <div key={item.key} style={{ position: 'relative' }}>
                      <NavItem item={item} active={item.key === activeKey} />
                      {item.key === 'feedback' && badges?.openFeedback > 0 && (
                        <BadgeDot count={badges.openFeedback} />
                      )}
                      {item.key === 'errors' && badges?.openErrors > 0 && (
                        <BadgeDot count={badges.openErrors} tone="danger" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a href="https://nexoraos.ru/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 9, color: 'var(--text-3)', fontSize: 13, textDecoration: 'none' }}>
            <Icon name="external" size={15} />
            Перейти на сайт
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)' }}>
            <span style={{
              width: 30, height: 30, borderRadius: 999, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--p-openresto), var(--p-youmin))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 600, color: 'var(--bg)',
            }}>{(user?.user_metadata?.display_name || user?.email || '?')[0].toUpperCase()}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.user_metadata?.display_name || user?.email}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Владелец</div>
            </div>
            <button onClick={signOut} title="Выйти" style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Icon name="log_out" size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN — единственная скроллящаяся зона; сайдбар и хедер всегда на месте */}
      <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          zIndex: 10, height: 60, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(14px)',
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>{adminNavByPath(pathname).label}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{adminNavByPath(pathname).subtitle}</div>
          </div>
          <span style={{ flex: 1 }} />
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['admin'] })}
            title="Обновить данные"
            style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icon name="repeat" size={15} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowBell(s => !s)}
              style={{ position: 'relative', width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Icon name="bell" size={15} />
              {badgeTotal > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 999,
                  background: 'var(--danger)', fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: '0 3px', color: 'var(--bg)',
                }}>{badgeTotal}</span>
              )}
            </button>
            {showBell && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, minWidth: 220, background: 'var(--bg-elev-2)',
                border: '1px solid var(--border)', borderRadius: 12, padding: 8, boxShadow: 'var(--shadow-modal)', zIndex: 20,
              }}>
                {badgeTotal === 0 ? (
                  <div style={{ padding: 10, fontSize: 12.5, color: 'var(--text-muted)' }}>Нет новых уведомлений</div>
                ) : (
                  <>
                    {badges.openFeedback > 0 && (
                      <button onClick={() => { setShowBell(false); navigate('/feedback'); }} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 12.5, cursor: 'pointer' }}>
                        {badges.openFeedback} открытых обращений
                      </button>
                    )}
                    {badges.openErrors > 0 && (
                      <button onClick={() => { setShowBell(false); navigate('/errors'); }} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12.5, cursor: 'pointer' }}>
                        {badges.openErrors} неразрешённых ошибок
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="ws-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 24px 24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function BadgeDot({ count, tone = 'info' }) {
  return (
    <span style={{
      position: 'absolute', top: 6, right: 6, minWidth: 15, height: 15, borderRadius: 999,
      background: `var(--${tone === 'danger' ? 'danger' : 'p-openresto'})`, fontSize: 9, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', color: 'var(--bg)',
      pointerEvents: 'none',
    }}>{count}</span>
  );
}
