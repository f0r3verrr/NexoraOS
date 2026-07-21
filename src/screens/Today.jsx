import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, ProjectTag, Checkbox, Kbd } from '../components/primitives.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useIsCompact } from '../hooks/useViewport.js';
import { useProjects } from '../hooks/useProjects.js';
import {
  useTodayTasks, useUndatedTasks, useOverdueTasks, useFrogTask,
  useToggleTask, useCreateTask, useUpdateTask, useDeleteTask, parseTaskInput,
} from '../hooks/useTasks.js';
import { useDayEvents } from '../hooks/useEvents.js';
import { ru } from '../lib/plural.js';

/* ─── Helpers ────────────────────────────────────────────── */
const PRIORITY_COLOR = { 1: '--danger', 2: '--warn', 3: '--info' };
const PRIORITY_LABEL = { 1: 'P1', 2: 'P2', 3: 'P3' };

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function fmtRelDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'сегодня';
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}
function getTimeGroup(due_at) {
  if (!due_at) return 'undated';
  const h = new Date(due_at).getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
}
const TIME_GROUPS = [
  { key: 'morning', label: 'Утро',         sub: 'до 12:00' },
  { key: 'day',     label: 'День',          sub: '12:00 – 18:00' },
  { key: 'evening', label: 'Вечер',         sub: 'после 18:00' },
  { key: 'undated', label: 'Без времени',   sub: 'задачи без дедлайна' },
];

/* ─── ContextMenu (portal) ───────────────────────────────── */
function ContextMenu({ task, pos, onClose, onEdit, onMoveTomorrow, onToggleDone, onDelete }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  // Позиция с учётом body zoom + не выходим за экран
  const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
  const vw = window.innerWidth / zoom;
  const vh = window.innerHeight / zoom;
  const style = {
    position: 'fixed',
    top: Math.max(8, Math.min(pos.y / zoom, vh - 190)),
    left: Math.max(8, Math.min(pos.x / zoom, vw - 210)),
    zIndex: 200,
    width: 200,
    background: 'var(--bg-elev-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    boxShadow: 'var(--shadow-modal)',
    padding: '5px',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  };

  const items = [
    { icon: 'edit',       label: 'Редактировать',   action: () => { onEdit(task); onClose(); } },
    { icon: 'arrow_right', label: 'Перенести на завтра', action: () => { onMoveTomorrow(task); onClose(); } },
    { icon: task.done ? 'circle' : 'check_circle', label: task.done ? 'Снять отметку' : 'Отметить выполненным', action: () => { onToggleDone(task); onClose(); } },
    { divider: true },
    { icon: 'trash', label: 'Удалить', action: () => { onDelete(task.id); onClose(); }, danger: true },
  ];

  return createPortal(
    <div ref={ref} style={style}>
      {items.map((item, i) => item.divider ? (
        <div key={i} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
      ) : (
        <button key={i} onClick={item.action}
          onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'color-mix(in oklab, var(--danger) 10%, transparent)' : 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: item.danger ? 'var(--danger)' : 'var(--text-2)', textAlign: 'left' }}>
          <Icon name={item.icon} size={14} />
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

/* ─── TaskModal (create + edit) ─────────────────────────── */
function TaskModal({ initialTask, defaultDueAt, onClose }) {
  const { data: projects = [] } = useProjects();
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mousedownOnBackdrop = useRef(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const initDate = initialTask
    ? initialTask.due_at?.slice(0, 10) ?? todayStr
    : defaultDueAt?.slice(0, 10) ?? todayStr;
  const initTime = initialTask?.due_at ? fmtTime(initialTask.due_at) : '';

  const [title,    setTitle]    = useState(initialTask?.title ?? '');
  const [date,     setDate]     = useState(initDate);
  const [time,     setTime]     = useState(initTime);
  const [priority, setPriority] = useState(initialTask?.priority ?? null);
  const [projId,   setProjId]   = useState(initialTask?.project_id ?? '');
  const [error,    setError]    = useState('');

  const buildDueAt = () => {
    if (!date) return null;
    if (!time) return `${date}T09:00:00`;
    return `${date}T${time}:00`;
  };

  const submit = async () => {
    if (!title.trim()) { setError('Введи название'); return; }
    const payload = { title: title.trim(), due_at: buildDueAt(), priority, project_id: projId || null };
    if (initialTask) {
      await update.mutateAsync({ id: initialTask.id, ...payload });
    } else {
      await create.mutateAsync({ ...payload, kanban_status: 'todo' });
    }
    onClose();
  };

  const handleDelete = async () => {
    await remove.mutateAsync(initialTask.id);
    onClose();
  };

  const sx = { height: 36, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', width: '100%' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <style>{`.cal-time::-webkit-calendar-picker-indicator{display:none}.cal-time::-webkit-inner-spin-button{display:none}`}</style>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 440, maxWidth: '100%', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{initialTask ? 'Редактировать задачу' : 'Новая задача'}</span>
          <button onClick={onClose} style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={16} /></button>
        </div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Название задачи…" autoFocus
          style={{ ...sx, height: 40, fontSize: 14 }} />

        {/* Date + Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Дата</label>
            <DatePicker value={date} onChange={v => v && setDate(v)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Время (опционально)</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="cal-time"
              style={{ ...sx, fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>

        {/* Priority */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Приоритет</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[null, 1, 2, 3].map(p => {
              const isActive = priority === p;
              const color = p ? `var(${PRIORITY_COLOR[p]})` : 'var(--text-2)';
              return (
                <button key={p ?? 'none'} onClick={() => setPriority(p)}
                  style={{ height: 30, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${isActive ? color : 'var(--border-subtle)'}`, background: isActive ? `color-mix(in oklab, ${color} 14%, transparent)` : 'transparent', color: isActive ? color : 'var(--text-3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms' }}>
                  {p ? PRIORITY_LABEL[p] : 'Без'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Project */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Проект (опционально)</label>
          <select value={projId} onChange={e => setProjId(e.target.value)} style={{ ...sx }}>
            <option value="">— нет —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
          <div>
            {initialTask && !confirmDelete && (
              <Button variant="danger" size="sm" icon="trash" onClick={() => setConfirmDelete(true)}>Удалить</Button>
            )}
            {initialTask && confirmDelete && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Точно?</span>
                <Button variant="danger" size="sm" onClick={handleDelete}>Да</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Нет</Button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
            <Button variant="primary" onClick={submit}>{initialTask ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FrogCard ────────────────────────────────────────────── */
function FrogCard({ task, onEdit }) {
  const toggle = useToggleTask();
  const color = task.priority ? `var(${PRIORITY_COLOR[task.priority]})` : 'var(--p-openresto)';
  return (
    <div style={{ padding: '14px 16px', background: `color-mix(in oklab, ${color} 7%, var(--bg-elev-1))`, border: `1px solid color-mix(in oklab, ${color} 28%, transparent)`, borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span onClick={() => toggle.mutate({ id: task.id, done: !task.done })} style={{ cursor: 'pointer', marginTop: 2, flex: 'none' }}>
        <Checkbox checked={task.done} priority={task.priority} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Главная задача дня</span>
          {task.priority && <Badge tone={PRIORITY_COLOR[task.priority].replace('--','')} >{PRIORITY_LABEL[task.priority]}</Badge>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</span>
        {task.project && <div style={{ marginTop: 4 }}><ProjectTag projectToken={task.project.color_token} label={task.project.name} size="sm" /></div>}
      </div>
      <button onClick={() => onEdit(task)}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', flex: 'none' }}>
        <Icon name="edit" size={13} />
      </button>
    </div>
  );
}

/* ─── TodayTaskRow ───────────────────────────────────────── */
function TodayTaskRow({ task, onEdit, onContextMenu }) {
  const toggle = useToggleTask();
  const overdue = task.due_at && new Date(task.due_at) < new Date() && !task.done;
  const color = task.priority ? `var(${PRIORITY_COLOR[task.priority]})` : null;

  return (
    <div
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, task); }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', transition: 'background 80ms', background: 'transparent', position: 'relative' }}>

      <span onClick={() => toggle.mutate({ id: task.id, done: !task.done })}
        style={{ cursor: 'pointer', flex: 'none' }}>
        <Checkbox checked={task.done} priority={task.priority} />
      </span>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: task.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {task.project && <ProjectTag projectToken={task.project.color_token} label={task.project.name} size="sm" />}
          {task.recurring && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}><Icon name="repeat" size={10} />повт.</span>}
          {overdue && <Badge tone="danger">просрочено</Badge>}
          {task.done && task.done_at && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>готово</span>}
        </div>
      </div>

      {/* Time badge */}
      {task.due_at && (
        <span style={{ fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-3)', fontFamily: 'var(--font-mono)', flex: 'none' }}>
          {fmtTime(task.due_at)}
        </span>
      )}

      {/* Priority dot */}
      {task.priority && (
        <span style={{ width: 6, height: 6, borderRadius: 999, background: color, flex: 'none' }} title={PRIORITY_LABEL[task.priority]} />
      )}

      {/* Action buttons — show on row hover via CSS class */}
      <div className="task-row-actions" style={{ display: 'flex', gap: 2, flex: 'none' }}>
        <button onClick={() => onEdit(task)}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
          <Icon name="edit" size={12} />
        </button>
        <button onClick={e => onContextMenu(e, task)}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
          <Icon name="more" size={12} />
        </button>
      </div>
    </div>
  );
}

/* ─── TodayGroup ─────────────────────────────────────────── */
function TodayGroup({ label, sub, tasks, onEdit, onContextMenu }) {
  const [collapsed, setCollapsed] = useState(false);
  const remaining = tasks.filter(t => !t.done).length;
  return (
    <section style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <header onClick={() => setCollapsed(c => !c)}
        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <Icon name={collapsed ? 'chevron_right' : 'chevron_down'} size={13} style={{ color: 'var(--text-3)', flex: 'none' }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: remaining ? 'var(--text-3)' : 'var(--success)', fontFamily: 'var(--font-mono)' }}>
          {remaining === 0 ? '✓ все готово' : `${remaining} осталось`}
        </span>
      </header>
      {!collapsed && <div>{tasks.map(t => <TodayTaskRow key={t.id} task={t} onEdit={onEdit} onContextMenu={onContextMenu} />)}</div>}
    </section>
  );
}

/* ─── OverdueSection ─────────────────────────────────────── */
function OverdueSection({ tasks, onEdit, onContextMenu }) {
  const [open, setOpen] = useState(true);
  return (
    <section style={{ background: 'color-mix(in oklab, var(--danger) 5%, var(--bg-elev-1))', border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)', borderRadius: 12, overflow: 'hidden' }}>
      <header onClick={() => setOpen(o => !o)}
        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
        onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 8%, transparent)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <Icon name={open ? 'chevron_down' : 'chevron_right'} size={13} style={{ color: 'var(--danger)', flex: 'none' }} />
        <Icon name="bell" size={13} style={{ color: 'var(--danger)', flex: 'none' }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger)' }}>Просрочено</span>
        <span style={{ fontSize: 11, fontWeight: 600, height: 18, minWidth: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: 'var(--danger)', color: 'var(--bg)', padding: '0 5px' }}>{tasks.length}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--danger)', opacity: 0.7 }}>нажми чтобы {open ? 'скрыть' : 'показать'}</span>
      </header>
      {open && <div>{tasks.map(t => <TodayTaskRow key={t.id} task={t} onEdit={onEdit} onContextMenu={onContextMenu} />)}</div>}
    </section>
  );
}

/* ─── QuickAddTask ───────────────────────────────────────── */
function QuickAddTask() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const create = useCreateTask();

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    await create.mutateAsync(parseTaskInput(trimmed));
    setValue('');
    setLoading(false);
  };

  const parsed = useMemo(() => value.trim() ? parseTaskInput(value) : null, [value]);

  return (
    <div style={{ background: 'var(--bg-elev-1)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px' }}>
        <Icon name="plus" size={15} style={{ color: 'var(--text-muted)', flex: 'none' }} />
        <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder='Быстрое добавление: "Встреча в 15:00 !p1"'
          className="no-ring"
          style={{ flex: 1, background: 'none', border: 'none', outline: '0', boxShadow: 'none', fontSize: 13, color: value ? 'var(--text)' : 'var(--text-muted)' }} />
        {value && <Kbd>↵</Kbd>}
      </div>
      {/* Preview parsed result */}
      {parsed && (value.includes('!p') || value.includes(' в ')) && (
        <div style={{ padding: '0 16px 10px 41px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {parsed.priority && <Badge tone={PRIORITY_COLOR[parsed.priority].replace('--','')}>{PRIORITY_LABEL[parsed.priority]}</Badge>}
          {parsed.due_at && <Badge tone="neutral"><Icon name="clock" size={10} /> {fmtTime(parsed.due_at)}</Badge>}
        </div>
      )}
    </div>
  );
}

/* ─── FilterBar ──────────────────────────────────────────── */
function FilterBar({ showDone, onToggleDone, filterPriority, onSetPriority }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '8px 24px', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Выполненные:</span>
        <button onClick={onToggleDone}
          style={{ width: 36, height: 20, borderRadius: 999, background: showDone ? 'var(--text)' : 'var(--bg-elev-3)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 150ms' }}>
          <span style={{ position: 'absolute', top: 2, left: showDone ? 18 : 2, width: 14, height: 14, borderRadius: 999, background: showDone ? 'var(--bg)' : 'var(--text-3)', transition: 'left 150ms' }} />
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{showDone ? 'показывать' : 'скрыть'}</span>
      </div>
      <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Приоритет:</span>
        {[null, 1, 2, 3].map(p => {
          const active = filterPriority === p;
          const color = p ? `var(${PRIORITY_COLOR[p]})` : 'var(--text-2)';
          return (
            <button key={p ?? 'all'} onClick={() => onSetPriority(p)}
              style={{ height: 26, padding: '0 10px', borderRadius: 6, border: `1px solid ${active ? color : 'var(--border-subtle)'}`, background: active ? `color-mix(in oklab, ${color} 14%, transparent)` : 'transparent', color: active ? color : 'var(--text-3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms' }}>
              {p ? PRIORITY_LABEL[p] : 'Все'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── DayTimeline ────────────────────────────────────────── */
const TIMELINE_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06–22

function DayTimeline() {
  const { data: events = [], isLoading: evLoading, error: evError, refetch: evRefetch } = useDayEvents();
  const scrollRef = useRef(null);
  const slotH = 44;
  const totalH = TIMELINE_HOURS.length * slotH;
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowTop = Math.max(0, (nowH - TIMELINE_HOURS[0]) * slotH);
  const nowVisible = nowH >= TIMELINE_HOURS[0] && nowH <= TIMELINE_HOURS[TIMELINE_HOURS.length - 1];

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(0, (nowH - TIMELINE_HOURS[0] - 2) * slotH);
  }, []);

  const allDayEvts = events.filter(e => e.all_day);
  const timedEvts  = events.filter(e => !e.all_day);

  const isCompact = useIsCompact();
  return (
    <aside style={{ width: isCompact ? '100%' : 256, minHeight: isCompact ? 320 : undefined, flex: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flex: 'none' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {now.toLocaleDateString('ru', { weekday: 'long' })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            {now.toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-mono)', color: 'var(--text)', letterSpacing: '-0.03em' }}>
            {now.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: evLoading ? 'var(--text-muted)' : events.length ? 'var(--text-3)' : 'var(--text-muted)', marginTop: 1 }}>
            {evLoading ? '…' : ru.events(events.length)}
          </div>
        </div>
      </header>

      {/* Error state */}
      {evError && (
        <div style={{ padding: '10px 14px', background: 'color-mix(in oklab, var(--danger) 8%, var(--bg-elev-1))', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
          <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500, marginBottom: 4 }}>Ошибка загрузки событий</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{evError?.message ?? String(evError)}</div>
          <button onClick={evRefetch} style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}>Повторить</button>
        </div>
      )}

      {/* All-day events */}
      {allDayEvts.length > 0 && (
        <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
          {allDayEvts.map(e => {
            const c = e.project?.color_token || e.color_token || '--p-openresto';
            return (
              <div key={e.id} style={{ padding: '3px 8px', background: `color-mix(in oklab, var(${c}) 14%, transparent)`, borderLeft: `2px solid var(${c})`, borderRadius: '0 5px 5px 0', fontSize: 11, color: 'var(--text)', marginBottom: 2 }}>
                {e.title}
              </div>
            );
          })}
        </div>
      )}

      {/* Timed grid */}
      <div ref={scrollRef} className="ws-scroll" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ position: 'relative', height: totalH }}>
          {/* Grid lines */}
          {TIMELINE_HOURS.map((h, i) => (
            <div key={h} style={{ position: 'absolute', left: 36, right: 0, top: i * slotH, borderTop: '1px solid var(--border-subtle)', opacity: 0.5 }} />
          ))}
          {/* Hour labels */}
          {TIMELINE_HOURS.map((h, i) => (
            <span key={h} style={{ position: 'absolute', left: 6, top: i === 0 ? 2 : i * slotH - 7, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {String(h).padStart(2,'0')}
            </span>
          ))}
          {/* Events */}
          {timedEvts.map(e => {
            const s = new Date(e.start_at); const en = new Date(e.end_at);
            const sH = s.getHours() + s.getMinutes() / 60;
            const eH = en.getHours() + en.getMinutes() / 60;
            const top = (sH - TIMELINE_HOURS[0]) * slotH + 1;
            const h = Math.max(20, (eH - sH) * slotH - 2);
            const c = e.project?.color_token || e.color_token || '--p-openresto';
            return (
              <div key={e.id} style={{ position: 'absolute', top, height: h, left: 40, right: 4, padding: '4px 8px', background: `color-mix(in oklab, var(${c}) 14%, transparent)`, borderLeft: `2px solid var(${c})`, borderRadius: '0 7px 7px 0', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                {h > 28 && <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtTime(e.start_at)}</div>}
              </div>
            );
          })}
          {/* Empty state */}
          {!evLoading && timedEvts.length === 0 && allDayEvts.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '0 16px' }}>нет событий сегодня</span>
            </div>
          )}
          {/* Now line */}
          {nowVisible && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: nowTop, zIndex: 5, pointerEvents: 'none' }}>
              <div style={{ position: 'relative', height: 1, background: 'var(--danger)', marginLeft: 36 }}>
                <span style={{ position: 'absolute', left: -5, top: -3, width: 7, height: 7, borderRadius: 999, background: 'var(--danger)' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ─── GroupBy button ─────────────────────────────────────── */
const GROUP_CYCLE = ['time', 'project', 'priority', 'none'];
const GROUP_LABELS = { time: 'время', project: 'проект', priority: 'приоритет', none: 'нет' };

/* ─── Today ──────────────────────────────────────────────── */
export default function Today() {
  const isCompact = useIsCompact();
  const [searchParams, setSearchParams] = useSearchParams();
  const [groupBy,        setGroupBy]        = useState(searchParams.get('group') || 'time');
  const [showDone,       setShowDone]       = useState(false);
  const [filterPriority, setFilterPriority] = useState(null);
  const [showFilters,    setShowFilters]    = useState(false);
  const [editTask,       setEditTask]       = useState(null);
  const [createOpen,     setCreateOpen]     = useState(false);
  const [contextMenu,    setContextMenu]    = useState(null);

  const { data: todayTasks   = [], isLoading: tL } = useTodayTasks();
  const { data: undatedTasks = [], isLoading: uL } = useUndatedTasks();
  const { data: overdueTasks = [] }                = useOverdueTasks();
  const { data: frogTask }                         = useFrogTask();

  const toggle    = useToggleTask();
  const update    = useUpdateTask();
  const remove    = useDeleteTask();
  const isLoading = tL || uL;

  /* ?new=1 from Sidebar button */
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setCreateOpen(true);
      const p = new URLSearchParams(searchParams);
      p.delete('new');
      setSearchParams(p, { replace: true });
    }
    const grp = searchParams.get('group');
    if (grp && GROUP_CYCLE.includes(grp)) {
      setGroupBy(grp);
      const p = new URLSearchParams(searchParams);
      p.delete('group');
      setSearchParams(p, { replace: true });
    }
  }, [searchParams.get('new'), searchParams.get('group')]);

  /* Progress — total includes done tasks so the number is stable when checking */
  const allTasks  = [...todayTasks, ...undatedTasks];
  const done      = allTasks.filter(t => t.done).length;
  const totalAll  = allTasks.length;
  const pct       = totalAll ? Math.round((done / totalAll) * 100) : 0;

  /* Visible tasks (client-side filter) */
  const visibleFilter = (t) => (showDone || !t.done) && (filterPriority === null || t.priority === filterPriority);
  const visibleTodayTasks   = todayTasks.filter(visibleFilter);
  const visibleUndatedTasks = undatedTasks.filter(visibleFilter);

  /* Build groups */
  const groups = useMemo(() => {
    const all = [...visibleTodayTasks, ...visibleUndatedTasks];
    if (groupBy === 'time') {
      const map = { morning: [], day: [], evening: [], undated: [] };
      for (const t of all) map[getTimeGroup(t.due_at)].push(t);
      return TIME_GROUPS
        .map(g => ({ key: g.key, label: g.label, sub: g.sub, tasks: map[g.key] }))
        .filter(g => g.tasks.length > 0);
    }
    if (groupBy === 'priority') {
      const map = {};
      for (const t of all) {
        const k = String(t.priority ?? 'none');
        if (!map[k]) map[k] = [];
        map[k].push(t);
      }
      return [
        { key: 'p1', label: 'Приоритет 1', sub: 'критично',   tasks: map['1']    ?? [] },
        { key: 'p2', label: 'Приоритет 2', sub: 'важно',      tasks: map['2']    ?? [] },
        { key: 'p3', label: 'Приоритет 3', sub: 'обычно',     tasks: map['3']    ?? [] },
        { key: 'pn', label: 'Без приоритета', sub: '',         tasks: map['none'] ?? [] },
      ].filter(g => g.tasks.length > 0);
    }
    if (groupBy === 'project') {
      const map = {};
      for (const t of all) {
        const key = t.project_id ?? '__none__';
        if (!map[key]) map[key] = { label: t.project?.name ?? 'Без проекта', sub: '', tasks: [] };
        map[key].tasks.push(t);
      }
      return Object.entries(map).map(([k, v]) => ({ key: k, ...v }));
    }
    return [{ key: 'all', label: 'Все задачи', sub: `${all.filter(t => !t.done).length} незавершённых`, tasks: all }];
  }, [visibleTodayTasks, visibleUndatedTasks, groupBy]);

  /* Handlers */
  const handleContextMenu = (e, task) => {
    e.preventDefault();
    setContextMenu({ task, x: e.clientX, y: e.clientY });
  };
  const handleMoveTomorrow = (task) => {
    const d = task.due_at ? new Date(task.due_at) : new Date();
    d.setDate(d.getDate() + 1);
    if (!task.due_at) d.setHours(9, 0, 0, 0);
    update.mutate({ id: task.id, due_at: d.toISOString() });
  };
  const cycleGroupBy = () => {
    const idx = GROUP_CYCLE.indexOf(groupBy);
    setGroupBy(GROUP_CYCLE[(idx + 1) % GROUP_CYCLE.length]);
  };

  const showFrog = frogTask && !frogTask.done && filterPriority === null;

  return (
    <>
      {createOpen && <TaskModal onClose={() => setCreateOpen(false)} />}
      {editTask   && <TaskModal initialTask={editTask} onClose={() => setEditTask(null)} />}
      {contextMenu && (
        <ContextMenu
          task={contextMenu.task}
          pos={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onEdit={t => { setEditTask(t); setContextMenu(null); }}
          onMoveTomorrow={t => { handleMoveTomorrow(t); setContextMenu(null); }}
          onToggleDone={t => { toggle.mutate({ id: t.id, done: !t.done }); setContextMenu(null); }}
          onDelete={id => { remove.mutate(id); setContextMenu(null); }}
        />
      )}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            breadcrumb={new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
            title="Сегодня"
            sub={isLoading ? '…' : `${done} / ${totalAll} · ${pct}%`}
            right={<>
              <Button variant="ghost" size="sm" icon="filter"
                onClick={() => setShowFilters(f => !f)}
                style={showFilters ? { background: 'var(--bg-elev-2)', color: 'var(--text)' } : {}}>
                {showFilters ? 'Скрыть' : 'Фильтры'}{(filterPriority !== null || showDone) && !showFilters ? ' ·' : ''}
              </Button>
              <Button variant="ghost" size="sm" icon="sort" onClick={cycleGroupBy}>
                {GROUP_LABELS[groupBy]}
              </Button>
            </>}
          />

          {showFilters && (
            <FilterBar
              showDone={showDone} onToggleDone={() => setShowDone(d => !d)}
              filterPriority={filterPriority} onSetPriority={setFilterPriority}
            />
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: isCompact ? 'column' : 'row', gap: 16, padding: isCompact ? '14px 14px 18px' : '18px 24px 24px', minHeight: 0, overflowY: isCompact ? 'auto' : 'visible' }}>
            {/* ── Left: tasks ── */}
            <div className="ws-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minWidth: 0 }}>

              {/* Progress card */}
              <div style={{ padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text)', letterSpacing: '-0.02em' }}>{done} / {totalAll}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>задач выполнено</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: pct === 100 ? 'var(--success)' : 'var(--text-3)' }}>{pct}%</span>
                    {pct === 100 && totalAll > 0 && <span style={{ fontSize: 13 }}>🎉</span>}
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--p-openresto), var(--p-health))', borderRadius: 999, transition: 'width 400ms ease' }} />
                </div>
                {overdueTasks.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)' }}>
                    <Icon name="bell" size={12} />
                    {overdueTasks.length} просроченных задач
                  </div>
                )}
              </div>

              {/* Frog — главная задача */}
              {showFrog && <FrogCard task={frogTask} onEdit={setEditTask} />}

              {/* Overdue section */}
              {overdueTasks.length > 0 && (
                <OverdueSection tasks={overdueTasks} onEdit={setEditTask} onContextMenu={handleContextMenu} />
              )}

              {/* Loading skeletons */}
              {isLoading && (
                <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[80, 65, 90, 55].map((w, i) => (
                    <div key={i} style={{ height: 13, width: `${w}%`, borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                  ))}
                  <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && totalAll === 0 && overdueTasks.length === 0 && (
                <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 32 }}>✅</div>
                  <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-2)' }}>На сегодня всё чисто</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 260 }}>Добавь задачи ниже или перейди к планированию на другие дни</span>
                </div>
              )}

              {/* Task groups */}
              {!isLoading && groups.map(g => (
                <TodayGroup key={g.key} label={g.label} sub={g.sub} tasks={g.tasks} onEdit={setEditTask} onContextMenu={handleContextMenu} />
              ))}

              {/* Quick add */}
              <QuickAddTask />
            </div>

            {/* ── Right: timeline ── */}
            <DayTimeline />
          </div>
        </main>
      </div>
    </>
  );
}
