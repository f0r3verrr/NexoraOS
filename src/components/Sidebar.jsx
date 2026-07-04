import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Avatar, IconButton } from './primitives.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useProjects } from '../hooks/useProjects.js';
import { useInboxItems } from '../hooks/useInbox.js';
import { useTodayTasks, useFrogTask, useKanbanTasks, useAllTasks, useGanttTasks } from '../hooks/useTasks.js';
import { useNotes, useFolders } from '../hooks/useNotes.js';
import { useGoals } from '../hooks/useGoals.js';
import { useHabits } from '../hooks/useHabits.js';
import { useFiles } from '../hooks/useFiles.js';
import { useOrders } from '../hooks/useOrders.js';
import { useCinema } from '../hooks/useCinema.js';
import { useContacts } from '../hooks/useContacts.js';
import { useSegments, useCreateSegment, useUpdateSegment, useDeleteSegment } from '../hooks/useSegments.js';
import { useJournalEntries, useJournalStreak } from '../hooks/useJournal.js';
import { ru } from '../lib/plural.js';

/* ---- Rail ---- */
const RAIL_TOP = [
  { key: 'home',     path: '/dashboard', icon: 'home',        label: 'Главная' },
  { key: 'inbox',    path: '/inbox',     icon: 'inbox',       label: 'Inbox' },
  { key: 'today',    path: '/today',     icon: 'sun_today',   label: 'Сегодня' },
  { key: 'calendar', path: '/calendar',  icon: 'calendar',    label: 'Календарь' },
  { key: 'kanban',   path: '/kanban',    icon: 'layers',      label: 'Доски' },
  { key: 'gantt',    path: '/gantt',     icon: 'trending_up', label: 'Гантт' },
];
const RAIL_LIBRARY = [
  { key: 'projects', path: '/projects',  icon: 'briefcase',   label: 'Проекты' },
  { key: 'notes',    path: '/notes',     icon: 'note',        label: 'Заметки' },
  { key: 'journal',  path: '/journal',   icon: 'edit',        label: 'Дневник' },
  { key: 'files',    path: '/files',     icon: 'file',        label: 'Файлы' },
  { key: 'finances', path: '/finances',  icon: 'wallet',      label: 'Финансы' },
  { key: 'crm',      path: '/crm',       icon: 'users',       label: 'CRM' },
  { key: 'goals',    path: '/goals',     icon: 'target',      label: 'Цели' },
  { key: 'cinema',   path: '/cinema',    icon: 'film',        label: 'Watchlist' },
];
const RAIL_BOTTOM = [
  { key: 'vault',    path: '/vault',     icon: 'lock',        label: 'Vault' },
  { key: 'settings', path: '/settings', icon: 'settings',    label: 'Настройки' },
];

const PATH_TO_KEY = {
  '/dashboard': 'home', '/today': 'today', '/inbox': 'inbox',
  '/calendar': 'calendar', '/kanban': 'kanban', '/gantt': 'gantt',
  '/projects': 'projects', '/notes': 'notes', '/journal': 'journal',
  '/files': 'files', '/finances': 'finances', '/crm': 'crm',
  '/goals': 'goals', '/cinema': 'cinema', '/settings': 'settings', '/vault': 'vault',
};

function RailDot({ item, active }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => item.path && navigate(item.path)} title={item.label}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-3)';
        }
      }}
      style={{
        width: 40, height: 40, borderRadius: 10,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: active ? 'var(--text)' : 'var(--text-3)',
        background: active
          ? 'color-mix(in oklab, var(--p-openresto) 16%, var(--bg-elev-3))'
          : 'transparent',
        position: 'relative', transition: 'background 120ms, color 120ms',
      }}>
      <Icon name={item.icon} size={18} />
      {item.badge && (
        <span style={{
          position: 'absolute', top: 3, right: 3,
          minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
          background: 'var(--danger)', color: 'white',
          fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-mono)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg-elev-1)',
        }}>{item.badge}</span>
      )}
      {active && (
        <span style={{
          position: 'absolute', left: -10, top: 10, bottom: 10, width: 2.5,
          borderRadius: 999,
          background: 'var(--p-openresto)',
          boxShadow: '0 0 10px 2px color-mix(in oklab, var(--p-openresto) 65%, transparent)',
        }} />
      )}
    </button>
  );
}

function SidebarRail() {
  const { pathname } = useLocation();
  const activeKey = PATH_TO_KEY[pathname] || (pathname.startsWith('/projects/') ? 'projects' : 'home');

  const { data: inboxItems = [] } = useInboxItems();
  const { data: todayTasks = [] } = useTodayTasks();
  const inboxCount = inboxItems.length;
  const todayCount = todayTasks.filter(t => !t.done).length;

  const railTopWithCounts = RAIL_TOP.map(n => {
    if (n.key === 'inbox') return { ...n, badge: inboxCount || undefined };
    if (n.key === 'today') return { ...n, badge: todayCount || undefined };
    return n;
  });

  return (
    <div style={{
      width: 80, flex: 'none',
      background: 'var(--bg-elev-1)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 0', gap: 4,
    }}>

      {railTopWithCounts.map((n) => (
        <RailDot key={n.key} item={n} active={n.key === activeKey} />
      ))}

      <div style={{ height: 1, width: 28, background: 'linear-gradient(90deg, transparent, var(--border), transparent)', margin: '8px 0' }} />

      {RAIL_LIBRARY.map((n) => (
        <RailDot key={n.key} item={n} active={n.key === activeKey} />
      ))}

      <div style={{ flex: 1 }} />

      {RAIL_BOTTOM.map((n) => (
        <RailDot key={n.key} item={n} active={n.key === activeKey} />
      ))}

      <UserAvatar />
    </div>
  );
}

function UserAvatar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 1).toUpperCase()
    : user?.email?.slice(0, 1).toUpperCase() || 'К';
  const label = user?.user_metadata?.display_name || user?.email || 'Пользователь';

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div ref={ref} style={{ position: 'relative', marginTop: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={user?.email}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.72'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'opacity 120ms', display: 'block' }}
      >
        {user?.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover', display: 'block' }} />
        ) : (
          <Avatar initials={initials} color="var(--p-openresto)" size={32} />
        )}
      </button>

      {open && (
        <div className="modal-enter" style={{
          position: 'fixed', bottom: 12, left: 88,
          zIndex: 200,
          background: 'var(--bg-elev-3)',
          border: '1px solid var(--border)',
          borderRadius: 10, padding: 4,
          minWidth: 196,
          boxShadow: 'var(--shadow-modal)',
        }}>
          <div style={{
            padding: '8px 10px 8px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 4,
          }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
            {user?.email && label !== user.email && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{user.email}</div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 12%, transparent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 10px', borderRadius: 6,
              background: 'transparent', color: 'var(--danger)',
              fontSize: 13, textAlign: 'left', cursor: 'pointer',
              transition: 'background 80ms',
            }}
          >
            <Icon name="log_out" size={14} />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}

/* ---- Panel shell ---- */
function PanelChrome({ title, sub, primaryAction, children, footer, onSearch, moreMenu }) {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!showMore) return;
    const handler = (e) => { if (!moreRef.current?.contains(e.target)) setShowMore(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);

  return (
    <div style={{
      width: 260, flex: 'none',
      background: 'var(--bg)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500, letterSpacing: '-0.01em', flex: 1 }}>{title}</span>
          {onSearch && (
            <button onClick={onSearch} style={{
              width: 28, height: 28, borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', color: 'var(--text-3)', transition: 'background 120ms', cursor: 'pointer',
            }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elev-2)')}
               onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Icon name="search" size={15} />
            </button>
          )}
          {moreMenu && (
            <div style={{ position: 'relative' }} ref={moreRef}>
              <button onClick={() => setShowMore(s => !s)} style={{
                width: 28, height: 28, borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: showMore ? 'var(--bg-elev-2)' : 'transparent',
                color: 'var(--text-3)', transition: 'background 120ms', cursor: 'pointer',
              }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elev-2)')}
                 onMouseLeave={e => !showMore && (e.currentTarget.style.background = 'transparent')}>
                <Icon name="more" size={15} />
              </button>
              {showMore && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 40, marginTop: 4,
                  background: 'var(--bg-elev-3)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 4, minWidth: 190,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                }}>
                  {moreMenu({ close: () => setShowMore(false) })}
                </div>
              )}
            </div>
          )}
        </div>
        {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
      </div>

      {primaryAction && <div style={{ padding: '0 12px 8px' }}>{primaryAction}</div>}

      <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px', minHeight: 0 }}>
        {children}
      </div>

      {footer}
    </div>
  );
}

function PanelFooter() {
  const { user } = useAuth();
  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 1).toUpperCase()
    : user?.email?.slice(0, 1).toUpperCase() || 'К';
  const label = user?.user_metadata?.display_name || user?.email || 'user';
  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar initials={initials} color="var(--p-openresto)" size={24} />
      <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <IconButton icon="moon" size="sm" />
    </div>
  );
}

function PanelButton({ children, primary, kbd, icon, onClick }) {
  return (
    <button onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = primary ? 'oklch(0.90 0.002 80)' : 'var(--bg-elev-3)'}
      onMouseLeave={e => e.currentTarget.style.background = primary ? 'var(--text)' : 'var(--bg-elev-2)'}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', height: 32, padding: '0 10px', borderRadius: 8,
        background: primary ? 'var(--text)' : 'var(--bg-elev-2)',
        color: primary ? 'var(--bg)' : 'var(--text-2)',
        border: primary ? 'none' : '1px solid var(--border-subtle)',
        fontSize: 13, fontWeight: 500,
        transition: 'background 120ms', cursor: 'pointer',
      }}>
      {icon && <Icon name={icon} size={15} />}
      <span style={{ flex: 1, textAlign: 'left' }}>{children}</span>
      {kbd && <span style={{ fontSize: 11, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>{kbd}</span>}
    </button>
  );
}

function PanelGroupLabel({ children, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '12px 10px 6px',
      fontSize: 11, color: 'var(--text-3)',
      letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
    }}>
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
}

function PanelRow({ icon, dot, label, sub, badge, active, indent = 0, onClick }) {
  return (
    <button onClick={onClick}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--bg-elev-2)' : 'transparent'; }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: `7px 10px 7px ${10 + indent}px`,
        borderRadius: 6,
        background: active ? 'var(--bg-elev-2)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-2)',
        textAlign: 'left', transition: 'background 80ms',
      }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: 3, background: `var(${dot})`, flex: 'none' }} />}
      {icon && <Icon name={icon} size={14} style={{ color: active ? 'var(--text)' : 'var(--text-3)' }} />}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
      </span>
      {badge != null && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{badge}</span>}
    </button>
  );
}

/* ---- Dynamic mini calendar ---- */
function MiniCal({ highlightWeek = true }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const weekStart = today - dayOfWeek;
  const weekEnd = weekStart + 6;
  const cellCount = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 4px' }}>
      {['пн','вт','ср','чт','пт','сб','вс'].map(d => (
        <span key={d} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>{d}</span>
      ))}
      {Array.from({ length: cellCount }, (_, i) => {
        const day = i - firstDow + 1;
        const valid = day >= 1 && day <= daysInMonth;
        const isToday = valid && day === today;
        const inWeek = highlightWeek && valid && day >= weekStart && day <= weekEnd;
        return (
          <span key={i} style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            textAlign: 'center', padding: '4px 0', borderRadius: 5,
            color: !valid ? 'transparent' : isToday ? 'var(--bg)' : inWeek ? 'var(--text)' : 'var(--text-3)',
            background: isToday ? 'var(--text)' : inWeek ? 'var(--bg-elev-2)' : 'transparent',
          }}>{valid ? day : ''}</span>
        );
      })}
    </div>
  );
}

/* ---- Helpers ---- */
function fmtSize(bytes) {
  if (!bytes) return '0 Б';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} ГБ`;
}

const MOOD_EMOJI = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '😄' };

/* ---- Panels ---- */
function HomePanel() {
  const { data: projects = [], isLoading } = useProjects();
  const today = new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <PanelChrome title="Главная" sub={today}
      primaryAction={<PanelButton primary icon="plus" kbd="⌘N">Быстро добавить</PanelButton>}
    >
      <PanelGroupLabel action={<Icon name="briefcase" size={11} style={{ color: 'var(--text-muted)' }} />}>Проекты</PanelGroupLabel>
      {isLoading ? (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 12, borderRadius: 4, background: 'var(--bg-elev-3)', width: `${60 + i * 10}%` }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Нет проектов</div>
      ) : (
        projects.slice(0, 6).map(p => (
          <PanelRow key={p.id} dot={p.color_token} label={p.name} sub={p.area} />
        ))
      )}
    </PanelChrome>
  );
}

function InboxPanel() {
  const { data: items = [], isLoading } = useInboxItems();
  const tgCount    = items.filter(i => i.source === 'telegram').length;
  const webCount   = items.filter(i => i.source === 'web').length;
  const emailCount = items.filter(i => i.source === 'email').length;
  const voiceCount = items.filter(i => i.source === 'voice').length;

  return (
    <PanelChrome
      title="Inbox"
      sub={isLoading ? '…' : `${items.length} в очереди`}
      primaryAction={<PanelButton primary icon="zap" kbd="⌘I">Захватить мысль</PanelButton>}
    >
      <PanelGroupLabel>Виды</PanelGroupLabel>
      <PanelRow icon="inbox"   label="Не разобрано"       badge={isLoading ? '…' : items.length} active />
      <PanelGroupLabel>Источники</PanelGroupLabel>
      {tgCount    > 0 && <PanelRow icon="send"    label="Telegram-бот" badge={tgCount} />}
      {emailCount > 0 && <PanelRow icon="message" label="Email"        badge={emailCount} />}
      {webCount   > 0 && <PanelRow icon="globe"   label="Web · браузер" badge={webCount} />}
      {voiceCount > 0 && <PanelRow icon="mic"     label="Голос"        badge={voiceCount} />}
      {!isLoading && tgCount === 0 && emailCount === 0 && webCount === 0 && voiceCount === 0 && (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>
          {items.length === 0 ? 'Inbox пуст' : 'Все через web'}
        </div>
      )}
    </PanelChrome>
  );
}

function TodayPanel() {
  const { data: tasks = [], isLoading } = useTodayTasks();
  const { data: frog } = useFrogTask();

  const now = new Date();
  const dateStr = now.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

  const morning = tasks.filter(t => { const h = t.due_at ? new Date(t.due_at).getHours() : -1; return h >= 0 && h < 12 && !t.done; });
  const day_    = tasks.filter(t => { const h = t.due_at ? new Date(t.due_at).getHours() : -1; return h >= 12 && h < 18 && !t.done; });
  const evening = tasks.filter(t => { const h = t.due_at ? new Date(t.due_at).getHours() : -1; return h >= 18 && !t.done; });

  return (
    <PanelChrome
      title="Сегодня"
      sub={`${dateStr} · ${timeStr}`}
      primaryAction={<PanelButton primary icon="plus" kbd="N">Задача</PanelButton>}
    >
      {frog && (
        <>
          <PanelGroupLabel>Главная задача</PanelGroupLabel>
          <PanelRow icon="zap" label={frog.title} sub={frog.project?.name} active />
        </>
      )}
      <PanelGroupLabel>Группы</PanelGroupLabel>
      {morning.length > 0 && <PanelRow icon="sun_today" label="Утро"  badge={morning.length} />}
      {day_.length   > 0 && <PanelRow icon="clock"     label="День"  badge={day_.length} />}
      {evening.length > 0 && <PanelRow icon="moon"      label="Вечер" badge={evening.length} />}
      {isLoading && <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Загрузка…</div>}
      {!isLoading && tasks.length === 0 && <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Задач нет</div>}
    </PanelChrome>
  );
}

function CalendarPanel() {
  const { data: projects = [] } = useProjects();
  const monthYear = new Date().toLocaleDateString('ru', { month: 'long', year: 'numeric' });
  return (
    <PanelChrome title="Календарь" sub={monthYear}
      primaryAction={<PanelButton primary icon="plus">Событие</PanelButton>}
    >
      <div style={{ padding: '8px 8px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{monthYear}</span>
          <div style={{ display: 'flex', gap: 2 }}>
            <IconButton icon="chevron_left"  size="sm" />
            <IconButton icon="chevron_right" size="sm" />
          </div>
        </div>
        <MiniCal />
      </div>
      {projects.length > 0 && (
        <>
          <PanelGroupLabel>Календари</PanelGroupLabel>
          {projects.map(p => (
            <label key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px', borderRadius: 6,
              fontSize: 13, color: 'var(--text-2)',
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: 4,
                background: `color-mix(in oklab, var(${p.color_token}) 28%, transparent)`,
                border: `1px solid color-mix(in oklab, var(${p.color_token}) 60%, transparent)`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
              }}><Icon name="check" size={10} stroke={2.5} style={{ color: `var(${p.color_token})` }} /></span>
              <span style={{ flex: 1 }}>{p.name}</span>
            </label>
          ))}
        </>
      )}
    </PanelChrome>
  );
}

function ProjectsPanel() {
  const { data: projects = [], isLoading } = useProjects();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const grouped = projects.reduce((acc, p) => {
    const area = p.area || 'Личное';
    if (!acc[area]) acc[area] = [];
    acc[area].push(p);
    return acc;
  }, {});
  const areaOrder = ['Работа', 'Подработки', 'Жизнь', 'Личное'];
  const areas = [...new Set([...areaOrder, ...Object.keys(grouped)])].filter(a => grouped[a]);

  return (
    <PanelChrome
      title="Проекты"
      sub={isLoading ? '…' : `${ru.projects(projects.length)}`}
      primaryAction={<PanelButton primary icon="plus" onClick={() => navigate('/projects?new=1')}>Новый проект</PanelButton>}
    >
      {isLoading ? (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ height: 12, borderRadius: 4, background: 'var(--bg-elev-3)', width: `${50 + i * 8}%` }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Нет проектов</span>
        </div>
      ) : (
        areas.map(area => (
          <div key={area}>
            <PanelGroupLabel action={<Icon name="plus" size={11} style={{ color: 'var(--text-muted)' }} />}>{area}</PanelGroupLabel>
            {grouped[area].map(p => (
              <PanelRow
                key={p.id}
                dot={p.color_token}
                label={p.name}
                active={pathname === `/projects/${p.id}`}
                onClick={() => navigate(`/projects/${p.id}`)}
              />
            ))}
          </div>
        ))
      )}
    </PanelChrome>
  );
}

function NotesPanel() {
  const { data: notes = [], isLoading } = useNotes();
  const { data: folders = [] } = useFolders();

  const folderCounts = notes.reduce((acc, n) => {
    acc[n.folder] = (acc[n.folder] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PanelChrome
      title="Заметки"
      sub={isLoading ? '…' : ru.notes(notes.length)}
      primaryAction={<PanelButton primary icon="plus" kbd="N">Новая заметка</PanelButton>}
    >
      <PanelRow icon="layers" label="Все заметки" badge={isLoading ? '…' : notes.length} active />
      {folders.length > 0 && <PanelGroupLabel>Папки</PanelGroupLabel>}
      {folders.map(f => (
        <PanelRow key={f} icon="folder" label={f} badge={folderCounts[f] ?? 0} />
      ))}
    </PanelChrome>
  );
}

function JournalPanel() {
  const { data: streak = 0 } = useJournalStreak();
  const { data: allEntries = [] } = useJournalEntries();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  // Build date → mood map
  const entryMap = {};
  for (const e of allEntries) entryMap[e.date] = e.mood ?? 0;

  const todayKey   = now.toISOString().slice(0, 10);
  const firstDow   = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0
  const daysInMon  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cellCount  = Math.ceil((firstDow + daysInMon) / 7) * 7;

  const monthLabel = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('ru', { month: 'long', year: 'numeric' });

  const handleDayClick = (dateKey) => {
    if (pathname === '/journal') {
      // Already on journal — use search param to open modal
      navigate(`/journal?date=${dateKey}`, { replace: true });
    } else {
      navigate(`/journal?date=${dateKey}`);
    }
  };

  const moodBg = (mood) => {
    if (!mood) return 'var(--bg-elev-3)';
    const pct = 20 + mood * 16;
    return `color-mix(in oklab, var(--p-health) ${pct}%, transparent)`;
  };

  return (
    <PanelChrome
      title="Дневник"
      sub={streak > 0 ? `стрик · ${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}` : undefined}
    >
      {/* Calendar header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px 4px', gap: 4 }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-2)', textTransform: 'capitalize' }}>{monthLabel}</span>
        <button onClick={prevMonth} style={{ width: 22, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon name="chevron_left" size={13} />
        </button>
        <button onClick={nextMonth} style={{ width: 22, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon name="chevron_right" size={13} />
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 8px 8px' }}>
        {['пн','вт','ср','чт','пт','сб','вс'].map(d => (
          <span key={d} style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: '2px 0 4px' }}>{d}</span>
        ))}
        {Array.from({ length: cellCount }, (_, i) => {
          const day = i - firstDow + 1;
          const valid = day >= 1 && day <= daysInMon;
          const dateKey = valid
            ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            : null;
          const isToday   = dateKey === todayKey;
          const mood      = dateKey ? entryMap[dateKey] : undefined;
          const hasEntry  = mood !== undefined;
          const isFuture  = dateKey && dateKey > todayKey;

          return (
            <button
              key={i}
              disabled={!valid || isFuture}
              onClick={valid && !isFuture ? () => handleDayClick(dateKey) : undefined}
              style={{
                height: 26, borderRadius: 5, fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2,
                background: isToday ? 'var(--text)' : 'transparent',
                color: !valid ? 'transparent' : isToday ? 'var(--bg)' : isFuture ? 'var(--text-muted)' : 'var(--text-2)',
                cursor: valid && !isFuture ? 'pointer' : 'default',
                position: 'relative',
                border: 'none',
              }}
              onMouseEnter={e => { if (valid && !isFuture && !isToday) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent'; }}
            >
              {valid ? day : ''}
              {valid && !isToday && hasEntry && (
                <span style={{
                  width: 4, height: 4, borderRadius: 99,
                  background: moodBg(mood),
                  position: 'absolute', bottom: 2,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </PanelChrome>
  );
}

const FILE_TYPE_EXTS = {
  docs:   ['pdf', 'doc', 'docx'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  sheets: ['xls', 'xlsx'],
  text:   ['md', 'txt'],
};

function getFileExt(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function FilesPanel() {
  const { data: result = { items: [] } } = useFiles('');
  const { items = [] } = result;
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const [showSearch, setShowSearch] = useState(false);

  const activeType = searchParams.get('type') ?? '';
  const activeSort = searchParams.get('sort') ?? '';
  const activeQ    = searchParams.get('q')    ?? '';

  const updateParams = (patch) => {
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') p.delete(k); else p.set(k, v);
    }
    navigate(`/files${p.toString() ? '?' + p.toString() : ''}`, { replace: true });
  };

  const goType = (type) => {
    const p = new URLSearchParams();
    if (type) p.set('type', type);
    if (activeSort) p.set('sort', activeSort);
    if (activeQ)    p.set('q', activeQ);
    navigate(`/files${p.toString() ? '?' + p.toString() : ''}`, { replace: true });
  };

  const counts = Object.fromEntries(
    Object.entries(FILE_TYPE_EXTS).map(([key, exts]) => [
      key,
      items.filter(f => exts.includes(getFileExt(f.name))).length,
    ])
  );

  const totalSize = items.reduce((a, f) => a + (f.metadata?.size ?? 0), 0);

  return (
    <PanelChrome
      title="Файлы"
      sub={items.length > 0 ? `${ru.files(items.length)} · ${fmtSize(totalSize)}` : 'нет файлов'}
      primaryAction={
        <button onClick={() => navigate('/files?upload=1')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', height: 32, padding: '0 10px', borderRadius: 8,
          background: 'var(--text)', color: 'var(--bg)',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          <Icon name="paperclip" size={15} />
          <span style={{ flex: 1, textAlign: 'left' }}>Загрузить</span>
        </button>
      }
      onSearch={() => {
        if (showSearch) { setShowSearch(false); updateParams({ q: null }); }
        else setShowSearch(true);
      }}
      moreMenu={({ close }) => (
        <>
          <MoreMenuLabel>Сортировка</MoreMenuLabel>
          {[
            { id: '',     l: 'По дате загрузки' },
            { id: 'name', l: 'По имени' },
            { id: 'size', l: 'По размеру' },
          ].map(s => (
            <MoreMenuItem key={s.id} label={s.l}
              checked={activeSort === s.id}
              onClick={() => { updateParams({ sort: s.id || null }); close(); }}
            />
          ))}
          <MoreMenuSep />
          <MoreMenuItem label="Сбросить фильтры" icon="x"
            onClick={() => { navigate('/files'); close(); setShowSearch(false); }}
          />
        </>
      )}
    >
      {showSearch && (
        <div style={{ padding: '0 4px 6px', position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-55%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input
            value={activeQ}
            onChange={e => updateParams({ q: e.target.value || null })}
            placeholder="Поиск файла…"
            autoFocus
            style={{ width: '100%', height: 28, padding: '0 26px 0 28px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
          {activeQ && (
            <button onClick={() => updateParams({ q: null })} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-55%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Icon name="x" size={11} />
            </button>
          )}
        </div>
      )}

      <PanelGroupLabel>Вид</PanelGroupLabel>
      <PanelRow icon="layers" label="Все" badge={items.length || undefined}
        active={!activeType} onClick={() => goType('')} />

      <PanelGroupLabel>Типы</PanelGroupLabel>
      <PanelRow icon="file"        label="Документы (PDF, DOC)"  badge={counts.docs   || undefined} active={activeType === 'docs'}   onClick={() => goType('docs')} />
      <PanelRow icon="star"        label="Фото и изображения"    badge={counts.images || undefined} active={activeType === 'images'} onClick={() => goType('images')} />
      <PanelRow icon="trending_up" label="Таблицы (XLS)"         badge={counts.sheets || undefined} active={activeType === 'sheets'} onClick={() => goType('sheets')} />
      <PanelRow icon="note"        label="Текстовые (MD, TXT)"   badge={counts.text   || undefined} active={activeType === 'text'}   onClick={() => goType('text')} />
    </PanelChrome>
  );
}

function FinancesPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: orders = [], isLoading } = useOrders();

  const now = new Date();
  const monthName = now.toLocaleDateString('ru', { month: 'long' });

  const byStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <PanelChrome
      title="Финансы"
      sub={monthName}
      primaryAction={<PanelButton primary icon="plus" onClick={() => navigate('/finances?action=new-order')}>Заказ</PanelButton>}
    >
      <PanelRow icon="wallet"      label="Все заказы"  badge={isLoading ? '…' : ru.orders(orders.length)} active={activeTab === 'orders'}   onClick={() => navigate('/finances?tab=orders')} />
      <PanelRow icon="trending_up" label="Аналитика"   active={activeTab === 'overview'} onClick={() => navigate('/finances?tab=overview')} />
      <PanelRow icon="arrow_down"  label="Расходы"     active={activeTab === 'expenses'} onClick={() => navigate('/finances?tab=expenses')} />
      <PanelGroupLabel>Статусы</PanelGroupLabel>
      {Object.entries(byStatus).map(([status, count]) => (
        <PanelRow key={status} icon="flag" label={status} badge={count} onClick={() => navigate('/finances?tab=orders')} />
      ))}
      {!isLoading && orders.length === 0 && (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Нет заказов</div>
      )}
    </PanelChrome>
  );
}

const CRM_STATUSES = ['Новый', 'В работе', 'Переговоры', 'Готово', 'Архив'];
const CRM_STATUS_ICONS = { 'Новый': 'users', 'В работе': 'flag', 'Переговоры': 'zap', 'Готово': 'check', 'Архив': 'archive' };

function SegmentRow({ seg, active, badge, onClick, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', borderRadius: 6, background: active ? 'var(--bg-elev-2)' : 'transparent', transition: 'background 80ms' }}
    >
      <button onClick={onClick} style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 6, textAlign: 'left',
        color: active ? 'var(--text)' : 'var(--text-2)',
      }}>
        <Icon name="users" size={14} style={{ color: active ? 'var(--text)' : 'var(--text-3)', flex: 'none' }} />
        <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {seg.name}
          {seg.status && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 5 }}>({seg.status})</span>}
        </span>
        {badge != null && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{badge}</span>}
      </button>
      {hover && (
        <div style={{ display: 'flex', gap: 1, paddingRight: 6 }}>
          <button onClick={onEdit} title="Переименовать" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--text-3)', background: 'var(--bg-elev-3)' }}>
            <Icon name="edit" size={11} />
          </button>
          <button onClick={onDelete} title="Удалить" style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--danger)', background: 'var(--bg-elev-3)' }}>
            <Icon name="trash" size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

const segFormInputSx = {
  width: '100%', height: 27, padding: '0 8px',
  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
  borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
};

function SegmentForm({ initialName = '', onSave, onCancel }) {
  const [name, setName] = useState(initialName);
  const submit = () => { if (name.trim()) onSave(name.trim()); };
  return (
    <div style={{ padding: '4px 8px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <input
        value={name} onChange={e => setName(e.target.value)} placeholder="Название сегмента…" autoFocus
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
        style={segFormInputSx}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={submit} style={{ flex: 1, height: 24, borderRadius: 5, background: 'var(--text)', color: 'var(--bg)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
          Сохранить
        </button>
        <button onClick={onCancel} style={{ height: 24, padding: '0 10px', borderRadius: 5, background: 'var(--bg-elev-3)', color: 'var(--text-2)', fontSize: 11, cursor: 'pointer' }}>
          Отмена
        </button>
      </div>
    </div>
  );
}

function CrmPanel() {
  const { data: contacts = [], isLoading: cL } = useContacts();
  const { data: segments = [], isLoading: sL } = useSegments();
  const createSeg = useCreateSegment();
  const updateSeg = useUpdateSegment();
  const deleteSeg = useDeleteSegment();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showSearch, setShowSearch] = useState(false);
  const [newSegOpen, setNewSegOpen] = useState(false);
  const [editSegId,  setEditSegId]  = useState(null);

  const activeQ     = searchParams.get('q')      ?? '';
  const activeStatus= searchParams.get('status') ?? '';
  const activeSeg   = searchParams.get('seg')    ?? '';
  const activeSort  = searchParams.get('sort')   ?? '';
  const hideArchive = searchParams.get('hide')   === 'archive';

  const updateParams = (patch) => {
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') p.delete(k); else p.set(k, v);
    }
    navigate(`/crm${p.toString() ? '?' + p.toString() : ''}`, { replace: true });
  };

  const isActive = (id) => {
    if (id === 'all') return !activeStatus && !activeSeg;
    if (id.startsWith('status:')) return activeStatus === id.slice(7) && !activeSeg;
    return activeSeg === id;
  };

  const handleSegClick = (id, status) => {
    if (id === 'all') {
      const p = new URLSearchParams();
      if (activeQ)     p.set('q',    activeQ);
      if (activeSort)  p.set('sort', activeSort);
      if (hideArchive) p.set('hide', 'archive');
      navigate(`/crm${p.toString() ? '?' + p.toString() : ''}`, { replace: true });
    } else if (status) {
      updateParams({ status, seg: null });
    } else {
      updateParams({ seg: id, status: null });
    }
  };

  const statusCounts = CRM_STATUSES.reduce((acc, s) => {
    acc[s] = contacts.filter(c => c.status === s).length;
    return acc;
  }, {});

  const statusSegs  = CRM_STATUSES.filter(s => statusCounts[s] > 0);
  const activeCount = contacts.filter(c => c.status === 'В работе').length;

  return (
    <PanelChrome
      title="CRM"
      sub={cL ? '…' : `${ru.contacts(contacts.length)}${activeCount > 0 ? ` · ${activeCount} активных` : ''}`}
      primaryAction={
        <button onClick={() => navigate('/crm?new=1')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', height: 32, padding: '0 10px', borderRadius: 8,
          background: 'var(--text)', color: 'var(--bg)',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          <Icon name="plus" size={15} />
          <span style={{ flex: 1, textAlign: 'left' }}>Контакт</span>
        </button>
      }
      onSearch={() => {
        if (showSearch) { setShowSearch(false); updateParams({ q: null }); }
        else setShowSearch(true);
      }}
      moreMenu={({ close }) => (
        <>
          <MoreMenuLabel>Сортировка</MoreMenuLabel>
          {[
            { id: '',       l: 'По дате добавления' },
            { id: 'name',   l: 'По имени' },
            { id: 'status', l: 'По статусу' },
          ].map(s => (
            <MoreMenuItem key={s.id} label={s.l}
              checked={activeSort === s.id}
              onClick={() => { updateParams({ sort: s.id || null }); close(); }}
            />
          ))}
          <MoreMenuSep />
          <MoreMenuItem label="Скрыть архив" checked={hideArchive}
            onClick={() => { updateParams({ hide: hideArchive ? null : 'archive' }); close(); }}
          />
          <MoreMenuSep />
          <MoreMenuItem label="Сбросить фильтры" icon="x"
            onClick={() => { navigate('/crm'); close(); setShowSearch(false); }}
          />
        </>
      )}
    >
      {showSearch && (
        <div style={{ padding: '0 4px 6px', position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-55%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input
            value={activeQ}
            onChange={e => updateParams({ q: e.target.value || null })}
            placeholder="Поиск…"
            autoFocus
            style={{ width: '100%', height: 28, padding: '0 26px 0 28px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
          {activeQ && (
            <button onClick={() => updateParams({ q: null })} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-55%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Icon name="x" size={11} />
            </button>
          )}
        </div>
      )}

      <PanelGroupLabel>Сегменты</PanelGroupLabel>

      <PanelRow icon="users" label="Все клиенты"
        badge={cL ? '…' : contacts.length}
        active={isActive('all')}
        onClick={() => handleSegClick('all')}
      />

      {statusSegs.map(s => (
        <PanelRow key={s}
          icon={CRM_STATUS_ICONS[s]}
          label={s}
          badge={statusCounts[s]}
          active={isActive(`status:${s}`)}
          onClick={() => handleSegClick(`status:${s}`, s)}
        />
      ))}

      {/* Кастомные сегменты из БД */}
      {segments.length > 0 && <PanelGroupLabel action={
        <button onClick={() => { setNewSegOpen(s => !s); setEditSegId(null); }} title="Новый сегмент"
          style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', borderRadius: 3 }}>
          <Icon name="plus" size={11} />
        </button>
      }>Мои сегменты</PanelGroupLabel>}

      {segments.map(seg => (
        editSegId === seg.id ? (
          <SegmentForm key={seg.id}
            initialName={seg.name}
            onSave={(name) => { updateSeg.mutate({ id: seg.id, name }); setEditSegId(null); }}
            onCancel={() => setEditSegId(null)}
          />
        ) : (
          <SegmentRow key={seg.id} seg={seg}
            active={isActive(seg.id)}
            badge={contacts.filter(c => c.segment_id === seg.id).length}
            onClick={() => handleSegClick(seg.id)}
            onEdit={() => { setEditSegId(seg.id); setNewSegOpen(false); }}
            onDelete={() => deleteSeg.mutate(seg.id)}
          />
        )
      ))}

      {/* Кнопка + когда нет сегментов */}
      {segments.length === 0 && !newSegOpen && (
        <button onClick={() => setNewSegOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '6px 10px', borderRadius: 6,
          color: 'var(--text-muted)', fontSize: 12,
        }}>
          <Icon name="plus" size={12} />
          Новый сегмент
        </button>
      )}

      {newSegOpen && (
        <SegmentForm
          onSave={(name) => { createSeg.mutate(name); setNewSegOpen(false); }}
          onCancel={() => setNewSegOpen(false)}
        />
      )}

      {!cL && contacts.length === 0 && (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Нет контактов</div>
      )}
    </PanelChrome>
  );
}

const CINEMA_STATUSES = [
  { key: 'watching',  label: 'Смотрю',         icon: 'eye' },
  { key: 'watched',   label: 'Просмотрено',     icon: 'check_circle' },
  { key: 'watchlist', label: 'Хочу посмотреть', icon: 'bookmark' },
  { key: 'waiting',   label: 'Жду сезон',       icon: 'clock' },
  { key: 'dropped',   label: 'Брошено',         icon: 'x' },
];

function CinemaPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: entries = [], isLoading } = useCinema();

  const activeStatus = searchParams.get('status') || 'watched';

  const counts = entries.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PanelChrome
      title="Watchlist"
      sub={isLoading ? '…' : `${entries.length} записей`}
      primaryAction={
        <PanelButton primary icon="plus" onClick={() => navigate('/cinema?new=1')}>
          Добавить
        </PanelButton>
      }
    >
      <PanelGroupLabel>По статусу</PanelGroupLabel>
      {CINEMA_STATUSES.map(s => (
        <PanelRow
          key={s.key}
          icon={s.icon}
          label={s.label}
          badge={counts[s.key] || undefined}
          active={activeStatus === s.key}
          onClick={() => navigate(`/cinema?status=${s.key}`)}
        />
      ))}
    </PanelChrome>
  );
}

function MoreMenuItem({ icon, label, checked, danger, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: '100%', padding: '7px 10px', borderRadius: 6,
      background: 'transparent', fontSize: 13,
      color: danger ? 'var(--danger)' : 'var(--text-2)',
      textAlign: 'left', cursor: 'pointer',
      transition: 'background 80ms',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elev-2)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <span style={{ width: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        {checked ? <Icon name="check" size={12} style={{ color: 'var(--p-openresto)' }} />
                 : icon ? <Icon name={icon} size={12} style={{ color: 'var(--text-muted)' }} /> : null}
      </span>
      {label}
    </button>
  );
}

function MoreMenuSep() {
  return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />;
}

function MoreMenuLabel({ children }) {
  return <div style={{ padding: '6px 10px 2px', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>;
}

function GoalsPanel() {
  const { data: goals = [], isLoading: gL } = useGoals();
  const { data: habits = [], isLoading: hL } = useHabits();
  const { data: streak = 0 } = useJournalStreak();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [showSearch, setShowSearch] = useState(false);
  const [localQ, setLocalQ] = useState('');

  const activeType    = searchParams.get('type') ?? '';
  const activeSort    = searchParams.get('sort') ?? 'created';
  const hideCompleted = searchParams.get('hide') === 'done';

  const updateParams = (patch) => {
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') p.delete(k); else p.set(k, v);
    }
    navigate(`/goals${p.toString() ? '?' + p.toString() : ''}`, { replace: true });
  };

  const handleSearch = (val) => {
    setLocalQ(val);
    updateParams({ q: val || null });
  };

  const handleTypeClick = (type) => {
    if (pathname !== '/goals') { navigate(`/goals?type=${encodeURIComponent(type)}`); return; }
    updateParams({ type: activeType === type ? null : type });
  };

  const byType = goals.reduce((acc, g) => { acc[g.goal_type] = (acc[g.goal_type] ?? 0) + 1; return acc; }, {});
  const typeOrder = ['Годовая', 'Квартальная', 'Месячная', 'Долгосрочная'];
  const types = [...new Set([...typeOrder, ...Object.keys(byType)])].filter(t => byType[t]);

  return (
    <PanelChrome
      title="Цели и привычки"
      sub={streak > 0 ? `стрик · ${ru.days(streak)}` : undefined}
      primaryAction={<PanelButton primary icon="plus" onClick={() => navigate('/goals?new=1')}>Цель</PanelButton>}
      onSearch={() => {
        setShowSearch(s => !s);
        if (showSearch) { setLocalQ(''); updateParams({ q: null }); }
      }}
      moreMenu={({ close }) => (
        <>
          <MoreMenuLabel>Сортировка</MoreMenuLabel>
          {[
            { id: 'created',  l: 'По дате создания' },
            { id: 'progress', l: 'По прогрессу' },
            { id: 'horizon',  l: 'По горизонту' },
          ].map(s => (
            <MoreMenuItem key={s.id} label={s.l}
              checked={activeSort === s.id}
              onClick={() => { updateParams({ sort: s.id === 'created' ? null : s.id }); close(); }}
            />
          ))}
          <MoreMenuSep />
          <MoreMenuItem
            label="Скрыть выполненные"
            checked={hideCompleted}
            onClick={() => { updateParams({ hide: hideCompleted ? null : 'done' }); close(); }}
          />
          <MoreMenuSep />
          <MoreMenuItem label="Сбросить фильтры" icon="x"
            onClick={() => { navigate('/goals'); close(); setLocalQ(''); setShowSearch(false); }}
          />
        </>
      )}
    >
      {/* Inline search */}
      {showSearch && (
        <div style={{ padding: '0 4px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            value={localQ}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Поиск целей…"
            autoFocus
            style={{
              flex: 1, height: 28, padding: '0 10px',
              background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)',
              borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none',
            }}
          />
          {localQ && (
            <button onClick={() => handleSearch('')} style={{ color: 'var(--text-muted)', display: 'flex' }}>
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      )}

      <PanelGroupLabel>Цели</PanelGroupLabel>
      {gL ? (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Загрузка…</div>
      ) : goals.length === 0 ? (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Нет целей</div>
      ) : (
        types.map(type => (
          <PanelRow key={type} icon="target" label={type} badge={byType[type]}
            active={pathname === '/goals' && activeType === type}
            onClick={() => handleTypeClick(type)}
          />
        ))
      )}
      <PanelGroupLabel>Привычки</PanelGroupLabel>
      {hL ? (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Загрузка…</div>
      ) : habits.length === 0 ? (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Нет привычек</div>
      ) : (
        habits.slice(0, 5).map(h => (
          <PanelRow key={h.id} dot={h.color_token} label={h.name} onClick={() => navigate('/goals')} />
        ))
      )}
    </PanelChrome>
  );
}

function KanbanPanel() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useKanbanTasks();

  const openByProject = tasks
    .filter(t => !t.done)
    .reduce((acc, t) => {
      if (t.project_id) acc[t.project_id] = (acc[t.project_id] ?? 0) + 1;
      return acc;
    }, {});

  const openTotal = tasks.filter(t => !t.done).length;

  return (
    <PanelChrome
      title="Доски"
      sub={isLoading ? '…' : `${ru.tasks(openTotal)} открыто`}
      primaryAction={<PanelButton primary icon="plus">Задача</PanelButton>}
    >
      <PanelGroupLabel>Проекты</PanelGroupLabel>
      {isLoading ? (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 12, borderRadius: 4, background: 'var(--bg-elev-3)', width: `${60 + i * 8}%` }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Нет проектов</div>
      ) : (
        projects.map((p, i) => (
          <PanelRow key={p.id} dot={p.color_token} label={p.name}
            badge={openByProject[p.id] || undefined}
            active={i === 0}
          />
        ))
      )}
      <PanelGroupLabel>Виды</PanelGroupLabel>
      <PanelRow icon="layers"      label="Канбан"    active />
      <PanelRow icon="calendar"    label="Календарь" />
      <PanelRow icon="trending_up" label="Гантт" />
    </PanelChrome>
  );
}

function GanttPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useGanttTasks();

  const currentScale = searchParams.get('scale') ?? 'week';

  const tasksByProject = tasks.reduce((acc, t) => {
    if (t.project_id) {
      if (!acc[t.project_id]) acc[t.project_id] = { total: 0, done: 0 };
      acc[t.project_id].total++;
      if (t.done) acc[t.project_id].done++;
    }
    return acc;
  }, {});

  const SCALES = [
    { key: 'day',     icon: 'calendar', label: 'День'    },
    { key: 'week',    icon: 'calendar', label: 'Неделя'  },
    { key: 'month',   icon: 'layers',   label: 'Месяц'   },
    { key: 'quarter', icon: 'layers',   label: 'Квартал' },
    { key: 'year',    icon: 'layers',   label: 'Год'     },
  ];

  const viewMode = searchParams.get('view') ?? 'all';
  const focusPid = searchParams.get('pid') ?? null;

  const setViewAll = () => navigate('/gantt?view=all');
  const setViewProject = (pid) => navigate(`/gantt?view=project&pid=${pid}&scale=${currentScale}`);

  return (
    <PanelChrome
      title="План · Гантт"
      sub={isLoading ? '…' : ru.projects(projects.length)}
      primaryAction={
        <PanelButton primary icon="flag" onClick={() => navigate('/gantt?milestone=1')}>
          Веха
        </PanelButton>
      }
    >
      <PanelGroupLabel>Масштаб</PanelGroupLabel>
      {SCALES.map(s => (
        <PanelRow
          key={s.key}
          icon={s.icon}
          label={s.label}
          active={currentScale === s.key}
          onClick={() => navigate(`/gantt?scale=${s.key}`)}
        />
      ))}
      <PanelGroupLabel>Вид</PanelGroupLabel>
      <PanelRow icon="layers" label="Все проекты" active={viewMode === 'all'} onClick={setViewAll} />
      <PanelGroupLabel>Проекты</PanelGroupLabel>
      {isLoading ? (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 12, borderRadius: 4, background: 'var(--bg-elev-3)', width: `${60 + i * 8}%` }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>Нет проектов</div>
      ) : (
        projects.map(p => {
          const stats = tasksByProject[p.id];
          const sub = stats ? `${stats.done}/${stats.total} задач` : undefined;
          return (
            <PanelRow
              key={p.id}
              dot={p.color_token}
              label={p.name}
              sub={sub}
              active={viewMode === 'project' && focusPid === p.id}
              onClick={() => setViewProject(p.id)}
            />
          );
        })
      )}
    </PanelChrome>
  );
}

function SettingsPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeId = searchParams.get('section') || 'profile';

  const sections = [
    { id: 'profile',       icon: 'users',   label: 'Профиль'     },
    { id: 'appearance',    icon: 'star',    label: 'Внешний вид' },
    { id: 'notifications', icon: 'bell',    label: 'Уведомления' },
    { id: 'integrations',  icon: 'zap',     label: 'Интеграции'  },
    { id: 'security',      icon: 'lock',    label: 'Безопасность'},
    { id: 'data',          icon: 'archive', label: 'Данные'      },
  ];

  return (
    <PanelChrome title="Настройки">
      {sections.map(s => (
        <PanelRow
          key={s.id}
          icon={s.icon}
          label={s.label}
          active={s.id === activeId}
          onClick={() => navigate(`/settings?section=${s.id}`)}
        />
      ))}
    </PanelChrome>
  );
}

/* ---- Sidebar assembly ---- */
function PanelByPath({ pathname }) {
  if (pathname.startsWith('/projects/')) return <ProjectsPanel />;
  switch (pathname) {
    case '/dashboard': return <HomePanel />;
    case '/inbox':     return <InboxPanel />;
    case '/today':     return <TodayPanel />;
    case '/calendar':  return <CalendarPanel />;
    case '/projects':  return <ProjectsPanel />;
    case '/notes':     return null;
    case '/journal':   return <JournalPanel />;
    case '/files':     return <FilesPanel />;
    case '/finances':  return <FinancesPanel />;
    case '/crm':       return <CrmPanel />;
    case '/goals':     return <GoalsPanel />;
    case '/cinema':    return null;
    case '/kanban':    return <KanbanPanel />;
    case '/gantt':     return <GanttPanel />;
    case '/settings':  return <SettingsPanel />;
    case '/vault':     return null;
    default:           return <HomePanel />;
  }
}

export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <>
      <SidebarRail />
      <PanelByPath pathname={pathname} />
    </>
  );
}

/* ---- TopBar ---- */
export function TopBar({ title, breadcrumb, right, sub }) {
  return (
    <div style={{
      height: 56, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 24px',
      borderBottom: '1px solid var(--border-subtle)',
      boxShadow: '0 1px 10px -3px color-mix(in oklab, oklch(0 0 0) 22%, transparent)',
      background: 'var(--bg)', flex: 'none',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, flex: 1, minWidth: 0 }}>
        {breadcrumb && <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{breadcrumb}</span>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</span>
          {sub && <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{sub}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
    </div>
  );
}

