import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, ProjectTag, Checkbox, Tabs, Progress } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useTodayTasks, useAllTasks, useFrogTask, useToggleTask, useUpdateTask, useCreateTask, parseTaskInput, useOverdueCount } from '../hooks/useTasks.js';
import { useProjects } from '../hooks/useProjects.js';
import { useDayEvents, useWeekEvents } from '../hooks/useEvents.js';
import { useQuickNotes, useAddQuickNote, useDeleteQuickNote } from '../hooks/useQuickNotes.js';
import { useJournalEntry, useUpsertJournalEntry, useJournalStreak } from '../hooks/useJournal.js';
import { useHabits, useHabitLogs, useToggleHabitLog, calcStreak } from '../hooks/useHabits.js';
import { useOrders } from '../hooks/useOrders.js';
import { useNotes } from '../hooks/useNotes.js';
import { useInboxItems } from '../hooks/useInbox.js';
import { useGoals } from '../hooks/useGoals.js';
import { usePersonalReminders } from '../hooks/usePersonalReminders.js';
import { supabase } from '../lib/supabase.js';
import { useQueryClient } from '@tanstack/react-query';
import { ru } from '../lib/plural.js';

/* ─── Helpers ────────────────────────────────────────────── */
function isoDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtTime(iso) { if (!iso) return '—'; const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function isOverdue(iso) { return iso && new Date(iso) < new Date(); }

function Sk({ w = '100%', h = 14, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }} />;
}

/* ─── Anchored popover (учитывает body zoom) ─────────────── */
function Popover({ anchor, width = 260, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc  = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
  const vw = window.innerWidth / zoom;
  const ax = anchor.x / zoom;
  const ay = anchor.y / zoom;
  const left = Math.max(8, Math.min(ax - width, vw - width - 8));
  const top  = ay + 6;

  return createPortal(
    <div ref={ref} style={{
      position: 'fixed', left, top, zIndex: 200, width, boxSizing: 'border-box',
      background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
      borderRadius: 10, boxShadow: 'var(--shadow-modal)', padding: 5,
      display: 'flex', flexDirection: 'column', gap: 1,
    }}>
      {children}
    </div>,
    document.body
  );
}

function PopRow({ icon, label, sub, badge, tone, onClick }) {
  return (
    <button onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
      <span style={{ width: 26, height: 26, borderRadius: 7, background: tone ? `color-mix(in oklab, var(${tone}) 14%, transparent)` : 'var(--bg-elev-3)', color: tone ? `var(${tone})` : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Icon name={icon} size={13} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
      </span>
      {badge != null && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{badge}</span>}
    </button>
  );
}

/* ─── Bell: уведомления ──────────────────────────────────── */
function NotifBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const { data: overdue = 0 }  = useOverdueCount();
  const { data: inbox = [] }   = useInboxItems();
  const { data: events = [] }  = useDayEvents();
  const reminders = usePersonalReminders();

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.start_at) > now);
  const total = overdue + inbox.length + reminders.length;

  const toggle = (e) => {
    if (open) { setOpen(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpen({ x: rect.right, y: rect.bottom });
  };

  return (
    <>
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <Button variant="ghost" size="sm" icon="bell" onClick={toggle} />
        {total > 0 && (
          <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: 999, background: 'var(--danger)', pointerEvents: 'none' }} />
        )}
      </span>
      {open && (
        <Popover anchor={open} width={280} onClose={() => setOpen(null)}>
          {total === 0 && upcoming.length === 0 ? (
            <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Всё чисто 🎉</div>
          ) : (
            <>
              {overdue > 0 && (
                <PopRow icon="bell" tone="--danger" label="Просроченные задачи" sub="перейти в Сегодня" badge={overdue}
                  onClick={() => { setOpen(null); navigate('/today'); }} />
              )}
              {inbox.length > 0 && (
                <PopRow icon="inbox" tone="--warn" label="Ждут разбора в Inbox" sub="разобрать сейчас" badge={inbox.length}
                  onClick={() => { setOpen(null); navigate('/inbox'); }} />
              )}
              {upcoming.length > 0 && (
                <PopRow icon="calendar" tone="--p-openresto" label={`Ближайшее: ${upcoming[0].title}`} sub={`сегодня в ${fmtTime(upcoming[0].start_at)}`} badge={upcoming.length}
                  onClick={() => { setOpen(null); navigate('/calendar'); }} />
              )}
              {reminders.map((r, i) => (
                <PopRow key={i} icon={r.icon} tone={r.tone} label={r.label} sub={r.sub}
                  onClick={() => { setOpen(null); navigate(r.to); }} />
              ))}
            </>
          )}
        </Popover>
      )}
    </>
  );
}

/* ─── Добавить: быстрое меню ─────────────────────────────── */
function AddMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);

  const toggle = (e) => {
    if (open) { setOpen(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpen({ x: rect.right, y: rect.bottom });
  };

  const go = (path) => { setOpen(null); navigate(path); };

  return (
    <>
      <Button variant="secondary" icon="plus" onClick={toggle}>Добавить</Button>
      {open && (
        <Popover anchor={open} width={230} onClose={() => setOpen(null)}>
          <PopRow icon="check"    tone="--p-openresto" label="Задача"   sub="сегодня"           onClick={() => go('/today?new=1')} />
          <PopRow icon="calendar" tone="--p-youmin"    label="Событие"  sub="в календарь"       onClick={() => go('/calendar?new=1')} />
          <PopRow icon="note"     tone="--p-sites"     label="Заметка"  sub="в базу знаний"     onClick={() => go('/notes')} />
          <PopRow icon="zap"      tone="--warn"        label="В Inbox"  sub="разобрать позже"   onClick={() => go('/inbox')} />
        </Popover>
      )}
    </>
  );
}

/* ─── Metric ─────────────────────────────────────────────── */
function MetricCard({ label, value, unit, loading, onClick, hint, children }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-2)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
      style={{ flex: 1, padding: '16px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, minHeight: 118, boxSizing: 'border-box', transition: 'box-shadow 150ms ease-out, border-color 150ms ease-out', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
        {hint && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{hint}</span>}
      </div>
      {loading ? <Sk h={28} w="60%" /> : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 500, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</span>
          {unit && <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{unit}</span>}
        </div>
      )}
      {/* виз-зона фиксированной высоты, прижата к низу — бары всех карточек на одной линии */}
      <div style={{ marginTop: 'auto', height: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {children}
      </div>
    </div>
  );
}

/* Мини-бары: 7 значений */
function MiniBars({ data, color }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 22 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${Math.max(v / max * 100, 8)}%`, borderRadius: 2, background: v > 0 ? color : 'var(--bg-elev-3)', opacity: v > 0 ? 0.45 + (v / max) * 0.55 : 1, transition: 'height 200ms' }} />
      ))}
    </div>
  );
}

/* Число + правильная форма глагола: 1 ждёт / 2 ждут */
function verbForm(n, one, many) {
  const mod10 = n % 10, mod100 = n % 100;
  return (mod10 === 1 && mod100 !== 11) ? one : many;
}

/* ─── Task row ───────────────────────────────────────────── */
function TaskRow({ task }) {
  const toggle = useToggleTask();
  return (
    <div
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'transparent', transition: 'background 80ms' }}
    >
      <span onClick={() => toggle.mutate({ id: task.id, done: !task.done })} style={{ cursor: 'pointer' }}>
        <Checkbox checked={task.done} priority={task.priority} />
      </span>
      <span style={{ flex: 1, fontSize: 14, color: task.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', textDecorationColor: 'var(--text-muted)' }}>
        {task.title}
      </span>
      {task.stuck && <Badge tone="warn" icon="flag">застряло</Badge>}
      {isOverdue(task.due_at) && !task.done && <Badge tone="danger" icon="bell">просрочено</Badge>}
      {task.project && <ProjectTag projectToken={task.project.color_token} label={task.project.name} />}
      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', minWidth: 50, textAlign: 'right' }}>{fmtTime(task.due_at)}</span>
    </div>
  );
}

/* ─── Quick add ──────────────────────────────────────────── */
function QuickAddTask() {
  const [v, setV] = useState('');
  const create = useCreateTask();
  const submit = async () => {
    const t = v.trim(); if (!t) return;
    const p = parseTaskInput(t);
    if (!p.due_at) { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); p.due_at = d.toISOString(); }
    await create.mutateAsync(p); setV('');
  };
  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name="plus" size={15} style={{ color: 'var(--text-3)', flex: 'none' }} />
      <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} className="no-ring"
        placeholder="Позвонить Ане в 15:00 !p1" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: v ? 'var(--text)' : 'var(--text-muted)' }} />
      {v && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>↵</span>}
    </div>
  );
}

/* ─── Tasks card с рабочими табами ───────────────────────── */
function TasksCard() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTodayTasks();
  const [tab, setTab] = useState('Все');

  const filtered = useMemo(() => {
    const WORK = ['Работа', 'Подработки'];
    if (tab === 'Работа')  return tasks.filter(t => WORK.includes(t.project?.area));
    if (tab === 'Личное')  return tasks.filter(t => !t.project || !WORK.includes(t.project.area));
    return tasks;
  }, [tasks, tab]);

  const done = tasks.filter(t => t.done).length;

  return (
    <div style={{ gridColumn: 'span 8', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Задачи на сегодня</span>
          {!isLoading && <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{tasks.length} · {done} готово</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tabs items={['Все', 'Работа', 'Личное']} active={tab} onSelect={setTab} />
          <IconButton icon="chevron_right" size="sm" title="Открыть Сегодня" onClick={() => navigate('/today')} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 6px 8px', minHeight: 60 }}>
        {isLoading ? [1,2,3].map(i => <div key={i} style={{ padding: '10px 14px' }}><Sk h={14} w={`${60+i*10}%`} /></div>) :
        filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, flexDirection: 'column' }}>
            <Icon name="check" size={22} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tab === 'Все' ? 'Задач на сегодня нет' : `Нет задач · ${tab}`}</span>
          </div>
        ) : filtered.map(t => <TaskRow key={t.id} task={t} />)}
      </div>
      <QuickAddTask />
    </div>
  );
}

/* ─── Schedule ───────────────────────────────────────────── */
function ScheduleWidget() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useDayEvents();
  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Расписание</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{isLoading ? '…' : `${events.length}`}</span>
          <IconButton icon="plus" size="sm" title="Новое событие" onClick={() => navigate('/calendar?new=1')} />
        </div>
      </div>
      <div style={{ padding: '0 18px 14px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {isLoading ? [1,2,3].map(i => <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 10, padding: '10px 0' }}><Sk h={12} w={40} /><Sk h={44} r={8} /></div>) :
        events.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 0' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет событий сегодня</span>
            <button onClick={() => navigate('/calendar?new=1')} style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>+ Добавить событие</button>
          </div>
        ) : (
          events.map(e => {
            const now = new Date();
            const isNow = new Date(e.start_at) <= now && now <= new Date(e.end_at);
            const color = e.project?.color_token || e.color_token || '--p-openresto';
            return (
              <div key={e.id}
                onClick={() => navigate('/calendar')}
                onMouseEnter={el => el.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 10, padding: '10px 4px', borderRadius: 8, background: 'transparent', transition: 'background 80ms', margin: '0 -4px', cursor: 'pointer' }}>
                <span style={{ fontSize: 12, color: isNow ? 'var(--text)' : 'var(--text-3)', fontFamily: 'var(--font-mono)', paddingTop: 1, fontWeight: isNow ? 500 : 400 }}>{fmtTime(e.start_at)}</span>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: `color-mix(in oklab, var(${color}) ${isNow ? 16 : 10}%, transparent)`, borderLeft: `2px solid var(${color})`, display: 'flex', flexDirection: 'column', gap: 3, position: 'relative', minWidth: 0 }}>
                  {isNow && <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, color: `var(${color})`, fontFamily: 'var(--font-mono)', background: `color-mix(in oklab, var(${color}) 14%, var(--bg-elev-3))`, padding: '2px 6px', borderRadius: 4, animation: 'pulse 2.5s ease-in-out infinite', fontWeight: 600 }}>СЕЙЧАС</span>}
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{e.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtTime(e.start_at)} – {fmtTime(e.end_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Projects ───────────────────────────────────────────── */
function ProjectsCard() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  return (
    <div style={{ gridColumn: 'span 8', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Активные проекты</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>всего {projects.length}</span>
          <IconButton icon="chevron_right" size="sm" title="Все проекты" onClick={() => navigate('/projects')} />
        </div>
      </div>
      {isLoading ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>{[1,2,3,4].map(i => <Sk key={i} h={88} r={10} />)}</div> :
      projects.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <button onClick={() => navigate('/projects')} style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>+ Создать первый проект</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
          {projects.slice(0,4).map(p => (
            <div key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `color-mix(in oklab, var(${p.color_token}) 50%, var(--border-subtle))`; e.currentTarget.style.boxShadow = 'var(--shadow-1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = ''; }}
              style={{ padding: 14, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8, transition: 'border-color 130ms, box-shadow 130ms', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${p.color_token})`, flex: 'none' }} />
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <Icon name="chevron_right" size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.area}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Quick notes ────────────────────────────────────────── */
function QuickNotesWidget() {
  const { data: notes = [], isLoading } = useQuickNotes();
  const addNote = useAddQuickNote();
  const delNote = useDeleteQuickNote();
  const createTask = useCreateTask();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [color, setColor] = useState('--p-openresto');
  const [busyId, setBusyId] = useState(null);

  const COLORS = ['--p-openresto','--p-youmin','--p-home','--p-girl','--p-car','--p-bots','--p-diploma'];

  const submit = async () => {
    if (!text.trim()) return;
    await addNote.mutateAsync({ text: text.trim(), color_token: color });
    setText(''); setAdding(false);
  };

  /* → Задача: создаёт задачу на сегодня и убирает стикер */
  const toTask = async (n) => {
    if (busyId) return;
    setBusyId(n.id);
    try {
      const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0);
      await createTask.mutateAsync({ title: n.text, due_at: d.toISOString(), kanban_status: 'todo' });
      await delNote.mutateAsync(n.id);
    } finally { setBusyId(null); }
  };

  /* → Заметка: создаёт полноценную заметку и убирает стикер */
  const toNote = async (n) => {
    if (busyId) return;
    setBusyId(n.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        title: n.text.length > 80 ? n.text.slice(0, 77) + '…' : n.text,
        body: n.text,
        folder: 'Личное',
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['notes'] });
      await delNote.mutateAsync(n.id);
    } finally { setBusyId(null); }
  };

  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Быстрые заметки</span>
        <IconButton icon="plus" onClick={() => setAdding(a => !a)} />
      </div>

      {adding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: 'var(--bg-elev-2)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} className="no-ring"
            placeholder="Текст заметки…" autoFocus
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 16, height: 16, borderRadius: 4, background: `var(${c})`, border: `2px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />)}
            <span style={{ flex: 1 }} />
            <button onClick={submit} style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Добавить ↵</button>
          </div>
        </div>
      )}

      {isLoading ? [1,2].map(i => <Sk key={i} h={56} r={8} />) : notes.length === 0 && !adding ? (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <button onClick={() => setAdding(true)} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Первая заметка</button>
        </div>
      ) : (
        notes.map(n => (
          <div key={n.id} style={{ position: 'relative', padding: '10px 12px', background: `color-mix(in oklab, var(${n.color_token}) 10%, var(--bg-elev-2))`, borderLeft: `2px solid var(${n.color_token})`, borderRadius: '0 8px 8px 0', display: 'flex', flexDirection: 'column', gap: 4, opacity: busyId === n.id ? 0.5 : 1, transition: 'opacity 120ms' }}
            onMouseEnter={e => e.currentTarget.querySelector('.qn-actions').style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.querySelector('.qn-actions').style.opacity = '0'}>
            <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.45, paddingRight: 70 }}>{n.text}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {new Date(n.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
            </span>
            <div className="qn-actions" style={{ position: 'absolute', top: 6, right: 6, opacity: 0, transition: 'opacity 120ms', display: 'flex', gap: 2, background: 'var(--bg-elev-2)', borderRadius: 6, padding: 2, border: '1px solid var(--border-subtle)' }}>
              <button onClick={() => toTask(n)} title="→ Задача на сегодня"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', borderRadius: 4, transition: 'color 100ms' }}>
                <Icon name="check" size={12} />
              </button>
              <button onClick={() => toNote(n)} title="→ Заметка"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', borderRadius: 4, transition: 'color 100ms' }}>
                <Icon name="note" size={12} />
              </button>
              <button onClick={() => delNote.mutate(n.id)} title="Удалить"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', borderRadius: 4, transition: 'color 100ms' }}>
                <Icon name="x" size={12} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─── Inbox widget ───────────────────────────────────────── */
function InboxWidget() {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useInboxItems();
  const latest = items.slice(0, 3);

  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Inbox</span>
          {items.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, height: 18, minWidth: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: 'var(--warn)', color: 'var(--bg)', padding: '0 5px' }}>{items.length}</span>}
        </div>
        <IconButton icon="chevron_right" size="sm" title="Открыть Inbox" onClick={() => navigate('/inbox')} />
      </div>

      {isLoading ? [1,2].map(i => <Sk key={i} h={36} r={8} />) : items.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 0' }}>
          <Icon name="check" size={20} style={{ color: 'var(--success)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inbox чист</span>
        </div>
      ) : (
        <>
          {latest.map(item => (
            <div key={item.id}
              onClick={() => navigate('/inbox')}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
              style={{ padding: '8px 12px', background: 'var(--bg-elev-2)', borderRadius: 8, cursor: 'pointer', transition: 'background 80ms' }}>
              <span style={{ fontSize: 13, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
            </div>
          ))}
          <Button variant="secondary" size="sm" icon="inbox" onClick={() => navigate('/inbox')} style={{ marginTop: 2 }}>
            Разобрать · 2 мин
          </Button>
        </>
      )}
    </div>
  );
}

/* ─── Goals widget ───────────────────────────────────────── */
function GoalsWidget() {
  const navigate = useNavigate();
  const { data: goals = [], isLoading } = useGoals();
  const top = [...goals].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0)).slice(0, 3);

  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Цели</span>
        <IconButton icon="chevron_right" size="sm" title="Все цели" onClick={() => navigate('/goals')} />
      </div>

      {isLoading ? [1,2,3].map(i => <Sk key={i} h={30} r={6} />) : top.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 0' }}>
          <Icon name="target" size={20} style={{ color: 'var(--text-muted)' }} />
          <button onClick={() => navigate('/goals')} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Поставить цель</button>
        </div>
      ) : (
        top.map(g => (
          <div key={g.id}
            onClick={() => navigate('/goals')}
            style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', flex: 'none' }}>{g.progress ?? 0}%</span>
            </div>
            <Progress value={g.progress ?? 0} color={(g.progress ?? 0) >= 100 ? 'var(--success)' : 'var(--p-openresto)'} height={4} />
          </div>
        ))
      )}
    </div>
  );
}

/* ─── Upcoming (7 дней) ──────────────────────────────────── */
function UpcomingWidget() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useWeekEvents(new Date());

  const now = new Date();
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const upcoming = events.filter(e => new Date(e.start_at) > todayEnd).slice(0, 4);

  const fmtDay = (iso) => {
    const d = new Date(iso);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (isoDate(d) === isoDate(tomorrow)) return 'завтра';
    return d.toLocaleDateString('ru', { weekday: 'short', day: 'numeric' });
  };

  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>На неделе</span>
        <IconButton icon="chevron_right" size="sm" title="Открыть календарь" onClick={() => navigate('/calendar')} />
      </div>

      {isLoading ? [1,2,3].map(i => <Sk key={i} h={30} r={6} />) : upcoming.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 0' }}>
          <Icon name="calendar" size={20} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Неделя свободна</span>
        </div>
      ) : (
        upcoming.map(e => {
          const color = e.project?.color_token || e.color_token || '--p-openresto';
          return (
            <div key={`${e.id}-${e.start_at}`}
              onClick={() => navigate('/calendar')}
              onMouseEnter={el => el.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, margin: '0 -8px', cursor: 'pointer', transition: 'background 80ms' }}>
              <span style={{ width: 3, height: 26, borderRadius: 2, background: `var(${color})`, flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtDay(e.start_at)} · {fmtTime(e.start_at)}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─── Recent ─────────────────────────────────────────────── */
function RecentWidget() {
  const navigate = useNavigate();
  const { data: notes = [] } = useNotes();
  const { data: tasks = [] } = useTodayTasks();

  const recentNotes = [...notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 3)
    .map(n => ({ i: 'note', l: n.title, s: new Date(n.updated_at).toLocaleDateString('ru', { day:'numeric', month:'short' }), proj: n.project?.color_token ?? '--p-sites', to: '/notes' }));
  const doneTasks = tasks.filter(t => t.done && t.done_at).sort((a, b) => new Date(b.done_at) - new Date(a.done_at)).slice(0, 2)
    .map(t => ({ i: 'check', l: t.title, s: 'выполнено сегодня', proj: t.project?.color_token ?? '--p-openresto', to: '/today' }));
  const items = [...doneTasks, ...recentNotes].slice(0, 5);

  return (
    <div style={{ gridColumn: 'span 5', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Недавнее</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>последние 5</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Нет активности</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((r, i) => (
            <div key={i}
              onClick={() => navigate(r.to)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none', borderRadius: 8, background: 'transparent', transition: 'background 80ms', cursor: 'pointer', margin: '0 -8px' }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, background: `color-mix(in oklab, var(${r.proj}) 14%, transparent)`, color: `var(${r.proj})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name={r.i} size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{r.l}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.s}</span>
              </div>
              <Icon name="chevron_right" size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Mood + streak ──────────────────────────────────────── */
function MoodWidget() {
  const navigate = useNavigate();
  const date = isoDate();
  const { data: entry } = useJournalEntry(date);
  const { data: streak = 0 } = useJournalStreak();
  const upsert = useUpsertJournalEntry();
  const mood = entry?.mood ?? null;
  const energy = entry?.energy ?? null;

  return (
    <div style={{ gridColumn: 'span 3', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Как ты сейчас?</span>
        <button onClick={() => navigate('/journal')} title="Открыть дневник"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: streak > 0 ? 'var(--warn)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {streak > 0 ? <><Icon name="flame" size={13} />{streak}</> : <Icon name="book" size={13} />}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Настроение</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1,2,3,4,5].map(n => {
            const active = n === mood;
            return <button key={n} onClick={() => upsert.mutate({ date, mood: n })}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elev-3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = active ? 'color-mix(in oklab, var(--p-health) 18%, transparent)' : 'var(--bg-elev-2)'; }}
              style={{ width: 38, height: 38, borderRadius: 8, background: active ? 'color-mix(in oklab, var(--p-health) 18%, transparent)' : 'var(--bg-elev-2)', border: `1px solid ${active ? 'color-mix(in oklab, var(--p-health) 40%, transparent)' : 'var(--border-subtle)'}`, color: active ? 'var(--p-health)' : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', transition: 'background 100ms' }}>
              {['😔','😐','🙂','😊','😄'][n - 1]}
            </button>;
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Энергия</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => upsert.mutate({ date, energy: n })}
              onMouseEnter={e => { if (n > (energy ?? 0)) e.currentTarget.style.background = 'var(--border-strong)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = n <= (energy ?? 0) ? 'var(--p-health)' : 'var(--bg-elev-3)'; }}
              style={{ flex: 1, height: 8, borderRadius: 3, background: n <= (energy ?? 0) ? 'var(--p-health)' : 'var(--bg-elev-3)', border: 'none', cursor: 'pointer', transition: 'background 120ms' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Habits ─────────────────────────────────────────────── */
function HabitsWidget() {
  const navigate = useNavigate();
  const { data: habits = [], isLoading: hL } = useHabits();
  const { data: logsMap = {}, isLoading: lL } = useHabitLogs(14);
  const toggle = useToggleHabitLog();
  const today = isoDate();

  if (hL || lL) return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Привычки</span>
      {[1,2,3].map(i => <Sk key={i} h={12} w={`${60+i*10}%`} />)}
    </div>
  );

  if (habits.length === 0) return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={() => navigate('/goals')} style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
        Нет привычек — добавить в «Цели»
      </button>
    </div>
  );

  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Привычки</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>14 дней</span>
          <IconButton icon="chevron_right" size="sm" title="Управлять в Целях" onClick={() => navigate('/goals')} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {habits.map(h => {
          const logs = logsMap[h.id] ?? new Set();
          const streak = calcStreak(h.id, logsMap);
          const dates = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return isoDate(d); });
          return (
            <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {dates.map((date, i) => (
                  <button key={date} onClick={() => toggle.mutate({ habitId: h.id, date, done: !logs.has(date) })}
                    title={date}
                    style={{ width: 12, height: 12, borderRadius: 3, border: date === today ? `1px solid color-mix(in oklab, var(${h.color_token}) 50%, transparent)` : 'none', cursor: 'pointer', background: logs.has(date) ? `color-mix(in oklab, var(${h.color_token}) ${50 + i * 3}%, transparent)` : 'var(--bg-elev-3)' }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: streak > 0 ? 'var(--warn)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                {streak > 0 ? <><Icon name="flame" size={12} />{streak}</> : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading: tL }    = useTodayTasks();
  const { data: allTasks = [] }                = useAllTasks();
  const { data: frog }                         = useFrogTask();
  const { data: inbox = [], isLoading: iL }    = useInboxItems();
  const { data: overdueCount = 0 }             = useOverdueCount();
  const { data: orders = [] }                  = useOrders();
  const updateTask = useUpdateTask();

  const doneTasks = tasks.filter(t => t.done);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  /* Доход за месяц + спарклайн по неделям (8 недель) */
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const paidOrders = orders.filter(o => o.paid);
  const monthlyIncome = paidOrders
    .filter(o => new Date(o.created_at) >= monthStart)
    .reduce((a, o) => a + Number(o.amount), 0);
  const incomeSeries = useMemo(() => {
    const weeks = Array(8).fill(0);
    const now = Date.now();
    for (const o of paidOrders) {
      const ageDays = (now - new Date(o.created_at)) / 86400000;
      const w = Math.floor(ageDays / 7);
      if (w >= 0 && w < 8) weeks[7 - w] += Number(o.amount);
    }
    return weeks;
  }, [orders]);

  /* Дедлайны: по дням следующей недели (реальные бары) */
  const deadlineSeries = useMemo(() => {
    const days = Array(7).fill(0);
    const start = new Date(); start.setHours(0,0,0,0);
    for (const t of allTasks) {
      if (!t.due_at || t.done) continue;
      const diff = Math.floor((new Date(t.due_at) - start) / 86400000);
      if (diff >= 0 && diff < 7) days[diff]++;
    }
    return days;
  }, [allTasks]);
  const weekDeadlines = deadlineSeries.reduce((a, b) => a + b, 0);

  const frogColor = frog?.project?.color_token ?? '--p-openresto';

  const startFrog = () => {
    if (!frog) return;
    updateTask.mutate({ id: frog.id, kanban_status: 'doing' });
    navigate('/today');
  };

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar title="Дашборд" sub="что мне сейчас важно" right={<NotifBell />} />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px' }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <h1 style={{ fontSize: 30, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span>
                  {greeting}.
                  <span style={{ color: 'var(--text-3)' }}>
                    {' '}{tasks.length === 0 ? 'Задач нет — отличный день!'
                      : tasks.length === doneTasks.length ? 'Все задачи выполнены'
                      : `${ru.tasks(tasks.length - doneTasks.length)} на сегодня.`}
                  </span>
                </span>
                {tasks.length > 0 && tasks.length === doneTasks.length && (
                  <span style={{ width: 30, height: 30, borderRadius: 999, background: 'color-mix(in oklab, var(--success) 16%, transparent)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon name="star" size={15} />
                  </span>
                )}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {overdueCount > 0 && (
                <span onClick={() => navigate('/today')} style={{ cursor: 'pointer' }}>
                  <Badge tone="danger" icon="bell">{overdueCount} просрочено</Badge>
                </span>
              )}
              <AddMenu />
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <MetricCard label="Задач на сегодня" value={tL ? '…' : String(tasks.length)} unit={doneTasks.length ? `/ ${doneTasks.length} готово` : undefined} loading={tL} onClick={() => navigate('/today')} hint="→ Сегодня">
              <Progress value={tasks.length ? Math.round(doneTasks.length / tasks.length * 100) : 0} color={doneTasks.length === tasks.length && tasks.length > 0 ? 'var(--success)' : 'var(--p-openresto)'} height={4} />
            </MetricCard>
            <MetricCard label="Дедлайнов на неделе" value={String(weekDeadlines)} onClick={() => navigate('/calendar')} hint="7 дней">
              <MiniBars data={deadlineSeries} color="var(--warn)" />
            </MetricCard>
            <MetricCard label="В Inbox" value={iL ? '…' : String(inbox.length)} unit={inbox.length > 0 ? `${verbForm(inbox.length, 'ждёт', 'ждут')} разбора` : undefined} loading={iL} onClick={() => navigate('/inbox')} hint="→ Inbox">
              <Progress value={inbox.length === 0 ? 100 : 0} color={inbox.length === 0 ? 'var(--success)' : 'var(--warn)'} height={4} />
            </MetricCard>
            <MetricCard label="Доход в месяц" value={monthlyIncome ? monthlyIncome.toLocaleString('ru') : '—'} unit={monthlyIncome ? '₽' : undefined} onClick={() => navigate('/finances')} hint="8 недель">
              <MiniBars data={incomeSeries} color="var(--success)" />
            </MetricCard>
          </div>

          {/* Frog */}
          {frog && (
            <div style={{ padding: '20px 22px', borderRadius: 12, marginBottom: 20, background: `linear-gradient(135deg, color-mix(in oklab, var(${frogColor}) 20%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 65%)`, border: `1px solid color-mix(in oklab, var(${frogColor}) 38%, var(--border))`, display: 'flex', alignItems: 'center', gap: 18, boxShadow: `0 4px 20px -8px color-mix(in oklab, var(${frogColor}) 25%, transparent)` }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in oklab, var(${frogColor}) 24%, transparent)`, color: `var(${frogColor})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: `0 0 16px -4px color-mix(in oklab, var(${frogColor}) 40%, transparent)` }}>
                <Icon name="zap" size={20} stroke={1.5} />
              </span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: `var(${frogColor})`, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>Лягушка дня</span>
                  {frog.kanban_status === 'doing' && <Badge tone="info" icon="zap">в работе</Badge>}
                  {frog.project && <ProjectTag projectToken={frog.project.color_token} label={frog.project.name} />}
                </div>
                <span style={{ fontSize: 18, color: 'var(--text)', fontWeight: 500, letterSpacing: '-0.01em' }}>{frog.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-3)' }}>
                  {frog.due_at && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={12} /> до {fmtTime(frog.due_at)}</span>}
                  {frog.priority && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="flag" size={12} style={{ color: 'var(--danger)' }} /> p{frog.priority}</span>}
                </div>
              </div>
              {frog.kanban_status === 'doing' ? (
                <Button variant="primary" icon="check" onClick={() => { updateTask.mutate({ id: frog.id, done: true, done_at: new Date().toISOString(), kanban_status: 'done' }); }}>Готово</Button>
              ) : (
                <Button variant="primary" icon="zap" onClick={startFrog}>Начать</Button>
              )}
            </div>
          )}

          {/* Tasks + Schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, marginBottom: 16 }}>
            <TasksCard />
            <ScheduleWidget />
          </div>

          {/* Projects + Quick notes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, marginBottom: 16 }}>
            <ProjectsCard />
            <QuickNotesWidget />
          </div>

          {/* Inbox + Goals + Upcoming */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, marginBottom: 16 }}>
            <InboxWidget />
            <GoalsWidget />
            <UpcomingWidget />
          </div>

          {/* Recent + Mood + Habits */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
            <RecentWidget />
            <MoodWidget />
            <HabitsWidget />
          </div>
        </div>
      </main>
    </div>
  );
}
