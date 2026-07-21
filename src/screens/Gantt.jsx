import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton } from '../components/primitives.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useProjects, useUpdateProject } from '../hooks/useProjects.js';
import { useGanttTasks } from '../hooks/useTasks.js';
import {
  useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone,
  useTaskDependencies, useCreateDependency, useDeleteDependency,
  useUpdateTaskDates,
} from '../hooks/useGantt.js';

/* ═══════════════════════════════════════════════════════════════
   DATE UTILITIES
═══════════════════════════════════════════════════════════════ */
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function isoDate(d) {
  if (!(d instanceof Date)) return String(d).slice(0, 10);
  // Local calendar date, not UTC — .toISOString() would roll back a day for
  // any positive-UTC-offset timezone whenever `d` is a local-midnight Date
  // (e.g. colToDate() results), which broke drag/resize date saving.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseDate(s) { if (!s) return null; const d = new Date(s); d.setHours(12, 0, 0, 0); return d; }

function getMonday(d = new Date()) {
  const r = new Date(d); r.setHours(0, 0, 0, 0);
  const dow = r.getDay();
  r.setDate(r.getDate() - (dow === 0 ? 6 : dow - 1));
  return r;
}
function getMonthStart(d = new Date()) {
  const r = new Date(d); r.setDate(1); r.setHours(0, 0, 0, 0); return r;
}
function getQuarterStart(d = new Date()) {
  const r = new Date(d); r.setDate(1); r.setHours(0, 0, 0, 0);
  r.setMonth(Math.floor(r.getMonth() / 3) * 3); return r;
}
function getYearStart(d = new Date()) {
  const r = new Date(d); r.setMonth(0, 1); r.setHours(0, 0, 0, 0); return r;
}

/* ═══════════════════════════════════════════════════════════════
   SCALE CONFIGS
═══════════════════════════════════════════════════════════════ */
const SCALE_DEFS = {
  day: {
    cols: 60, colW: 34,
    unit: 'day',
    getStart: (o) => getMonday(addDays(new Date(), o * 14)),
    nav: 14,
  },
  week: {
    cols: 26, colW: 72,
    unit: 'week',
    getStart: (o) => getMonday(addDays(new Date(), o * 28)),
    nav: 28,
  },
  month: {
    cols: 18, colW: 96,
    unit: 'month',
    getStart: (o) => getMonthStart(addMonths(new Date(), o * 6)),
    nav: 6,
  },
  quarter: {
    cols: 12, colW: 80,
    unit: 'month',
    getStart: (o) => getQuarterStart(addMonths(new Date(), o * 12)),
    nav: 12,
  },
  year: {
    cols: 36, colW: 44,
    unit: 'month',
    getStart: (o) => getYearStart(addMonths(new Date(), o * 24)),
    nav: 24,
  },
};

function dateToCol(dateStr, viewStart, scaleKey) {
  const d = parseDate(dateStr); if (!d) return null;
  const s = new Date(viewStart); s.setHours(12, 0, 0, 0);
  const diff = d - s;
  if (scaleKey === 'day') return Math.floor(diff / 86400000);
  if (scaleKey === 'week') return Math.floor(diff / (7 * 86400000));
  // month/quarter/year: column = months offset
  return (d.getFullYear() - s.getFullYear()) * 12 + (d.getMonth() - s.getMonth());
}

function colToDate(col, viewStart, scaleKey) {
  const s = new Date(viewStart);
  if (scaleKey === 'day') return addDays(s, col);
  if (scaleKey === 'week') return addDays(s, col * 7);
  return addMonths(s, col);
}

/* Build column metadata array */
function buildColMeta(viewStart, scaleKey) {
  const { cols } = SCALE_DEFS[scaleKey];
  const today = isoDate(new Date());
  return Array.from({ length: cols }, (_, i) => {
    const d = colToDate(i, viewStart, scaleKey);
    if (scaleKey === 'day') {
      const dow = d.getDay();
      return { date: d, label: d.getDate(), isWeekend: dow === 0 || dow === 6, isToday: isoDate(d) === today };
    }
    if (scaleKey === 'week') {
      const end = addDays(d, 6);
      const todayD = new Date(); todayD.setHours(12);
      const isCurrentWeek = todayD >= d && todayD <= end;
      return { date: d, label: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }), isCurrentWeek };
    }
    // month / quarter / year
    const todayM = isoDate(new Date()).slice(0, 7);
    const colM = isoDate(d).slice(0, 7);
    return { date: d, label: d.toLocaleDateString('ru', { month: 'short' }), isCurrentMonth: colM === todayM };
  });
}

/* Build top-row spans (groupings above the column labels) */
function buildHeaderSpans(colMeta, scaleKey) {
  const spans = []; let cur = null;
  const getKey = (col) => {
    if (scaleKey === 'day' || scaleKey === 'week') {
      return col.date.getFullYear() + '-' + col.date.getMonth();
    }
    if (scaleKey === 'month') {
      const q = Math.floor(col.date.getMonth() / 3) + 1;
      return col.date.getFullYear() + '-Q' + q;
    }
    return String(col.date.getFullYear());
  };
  const getLabel = (col) => {
    if (scaleKey === 'day' || scaleKey === 'week') {
      return col.date.toLocaleDateString('ru', { month: 'long', year: 'numeric' });
    }
    if (scaleKey === 'month') {
      const q = Math.floor(col.date.getMonth() / 3) + 1;
      return 'Q' + q + ' ' + col.date.getFullYear();
    }
    return String(col.date.getFullYear());
  };
  colMeta.forEach((col, i) => {
    const key = getKey(col);
    if (key !== cur) {
      if (cur !== null) spans[spans.length - 1].count = i - spans[spans.length - 1].start;
      spans.push({ label: getLabel(col), start: i, count: 0, key });
      cur = key;
    }
  });
  if (spans.length) spans[spans.length - 1].count = colMeta.length - spans[spans.length - 1].start;
  return spans;
}

/* ═══════════════════════════════════════════════════════════════
   ROW HEIGHTS
═══════════════════════════════════════════════════════════════ */
const ROW_H = { project: 48, task: 36, milestone: 32 };
const HEADER_H = 48; // two rows: 22 + 26

/* ═══════════════════════════════════════════════════════════════
   SHARED STYLE
═══════════════════════════════════════════════════════════════ */
const inputSx = {
  height: 36, padding: '0 12px',
  background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)',
  borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

const PRIORITY_COLORS = [null, 'var(--danger)', 'var(--warn)', 'var(--text-muted)'];

const STATUS_META = {
  backlog:     { label: 'Backlog',    color: 'var(--text-muted)' },
  todo:        { label: 'To Do',      color: 'var(--text-3)' },
  in_progress: { label: 'В работе',  color: 'var(--info)' },
  review:      { label: 'Ревью',      color: 'var(--warn)' },
  done:        { label: 'Готово',     color: 'var(--success)' },
};

const DEP_TYPES = [
  { key: 'finish_to_start',  label: 'Finish → Start'  },
  { key: 'finish_to_finish', label: 'Finish → Finish' },
  { key: 'start_to_start',   label: 'Start → Start'   },
  { key: 'start_to_finish',  label: 'Start → Finish'  },
];

/* ═══════════════════════════════════════════════════════════════
   MODAL WRAPPER
═══════════════════════════════════════════════════════════════ */
function ModalWrap({ onClose, children }) {
  const ref = useRef(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}
      onMouseDown={e => { ref.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && ref.current) onClose(); }}>
      {children}
    </div>,
    document.body
  );
}

function ModalBox({ children, width = 380 }) {
  return (
    <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width, maxWidth: '100%', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MILESTONE MODAL
═══════════════════════════════════════════════════════════════ */
function MilestoneModal({ projects, milestone, onClose }) {
  const create = useCreateMilestone();
  const update = useUpdateMilestone();
  const remove = useDeleteMilestone();
  const [title, setTitle]     = useState(milestone?.title ?? '');
  const [date, setDate]       = useState(milestone?.date ?? '');
  const [desc, setDesc]       = useState(milestone?.description ?? '');
  const [pid, setPid]         = useState(milestone?.project_id ?? projects[0]?.id ?? '');
  const isEdit = !!milestone;

  const save = async () => {
    if (!title || !date || !pid) return;
    if (isEdit) await update.mutateAsync({ id: milestone.id, title, date, description: desc || null });
    else await create.mutateAsync({ project_id: pid, title, date, description: desc || null });
    onClose();
  };
  const del = async () => {
    await remove.mutateAsync(milestone.id);
    onClose();
  };

  return (
    <ModalWrap onClose={onClose}>
      <ModalBox>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{isEdit ? 'Редактировать веху' : 'Новая веха'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Название', node: <input style={inputSx} value={title} onChange={e => setTitle(e.target.value)} placeholder="Релиз 1.0" autoFocus /> },
            { label: 'Дата', node: <DatePicker value={date} onChange={setDate} placeholder="Выбрать дату" /> },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{f.label}</label>
              {f.node}
            </div>
          ))}
          {!isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Проект</label>
              <select value={pid} onChange={e => setPid(e.target.value)} style={{ ...inputSx, appearance: 'auto' }}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Описание</label>
            <textarea style={{ ...inputSx, height: 72, resize: 'vertical', padding: '8px 12px', lineHeight: 1.5 }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Необязательно" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {isEdit && <Button variant="danger" onClick={del}>Удалить</Button>}
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={save} disabled={!title || !date || !pid}>Сохранить</Button>
        </div>
      </ModalBox>
    </ModalWrap>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFIRM DATES MODAL (drag & drop)
═══════════════════════════════════════════════════════════════ */
function ConfirmDatesModal({ task, newStart, newEnd, onCancel, onSave }) {
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  return (
    <ModalWrap onClose={onCancel}>
      <ModalBox width={360}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Изменить сроки задачи?</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, padding: '4px 0' }}>
          <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 60, color: 'var(--text-3)', fontSize: 11 }}>Было</span>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{fmtDate(task.start_date || task.created_at)} → {fmtDate(task.due_at)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 60, color: 'var(--text-3)', fontSize: 11 }}>Стало</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{fmtDate(newStart)} → {fmtDate(newEnd)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>Отмена</Button>
          <Button variant="primary" onClick={onSave}>Сохранить</Button>
        </div>
      </ModalBox>
    </ModalWrap>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADD DEPENDENCY MODAL
═══════════════════════════════════════════════════════════════ */
function AddDepModal({ fromTask, tasks, onClose }) {
  const create = useCreateDependency();
  const [toId, setToId]       = useState('');
  const [depType, setDepType] = useState('finish_to_start');
  const [q, setQ]             = useState('');
  const filtered = tasks.filter(t => t.id !== fromTask.id && t.title.toLowerCase().includes(q.toLowerCase()));

  const save = async () => {
    if (!toId) return;
    await create.mutateAsync({ from_task: fromTask.id, to_task: toId, dep_type: depType });
    onClose();
  };

  return (
    <ModalWrap onClose={onClose}>
      <ModalBox>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Добавить зависимость</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Источник: <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{fromTask.title}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Тип зависимости</label>
          <select value={depType} onChange={e => setDepType(e.target.value)} style={{ ...inputSx, appearance: 'auto' }}>
            {DEP_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Целевая задача</label>
          <input style={inputSx} value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск задачи..." />
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            {filtered.slice(0, 30).map(t => (
              <button key={t.id} onClick={() => setToId(t.id)}
                style={{ padding: '7px 10px', borderRadius: 6, textAlign: 'left', fontSize: 12, color: 'var(--text-2)', background: toId === t.id ? 'var(--bg-active)' : 'transparent', border: toId === t.id ? '1px solid var(--border)' : '1px solid transparent', cursor: 'pointer' }}>
                {t.title}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" disabled={!toId} onClick={save}>Сохранить</Button>
        </div>
      </ModalBox>
    </ModalWrap>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDIT DATES MODAL (project dates via click)
═══════════════════════════════════════════════════════════════ */
function EditDatesModal({ project, onClose }) {
  const update = useUpdateProject();
  const [start, setStart] = useState(project.start_date ?? '');
  const [end, setEnd]     = useState(project.end_date ?? '');
  return (
    <ModalWrap onClose={onClose}>
      <ModalBox width={340}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${project.color_token})`, flex: 'none' }} />
          {project.name}
        </div>
        {[{ label: 'Дата начала', v: start, s: setStart }, { label: 'Дата окончания', v: end, s: setEnd }].map(f => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{f.label}</label>
            <DatePicker value={f.v} onChange={f.s} placeholder={f.label} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={async () => { await update.mutateAsync({ id: project.id, start_date: start || null, end_date: end || null }); onClose(); }}>Сохранить</Button>
        </div>
      </ModalBox>
    </ModalWrap>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTEXT MENU
═══════════════════════════════════════════════════════════════ */
function ContextMenu({ x, y, item, onClose, onAction }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const taskActions = [
    { key: 'open', label: 'Открыть', icon: 'arrow_right' },
    { key: 'dates', label: 'Изменить даты', icon: 'calendar' },
    { key: 'dep', label: 'Добавить зависимость', icon: 'link' },
    null,
    { key: 'delete', label: 'Удалить', icon: 'trash', danger: true },
  ];
  const milestoneActions = [
    { key: 'edit_ms', label: 'Редактировать', icon: 'edit' },
    null,
    { key: 'delete_ms', label: 'Удалить', icon: 'trash', danger: true },
  ];
  const actions = item?.type === 'milestone' ? milestoneActions : taskActions;

  // Позиция с учётом body zoom + не выходим за экран
  const menuW = 200; const menuH = actions.length * 32;
  const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
  const sx = Math.max(8, Math.min(x / zoom, window.innerWidth / zoom - menuW - 10));
  const sy = Math.max(8, Math.min(y / zoom, window.innerHeight / zoom - menuH - 10));

  return createPortal(
    <div ref={ref} style={{
      position: 'fixed', left: sx, top: sy, zIndex: 9999,
      background: 'var(--bg-elev-3)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '4px 0', width: menuW,
      boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6), 0 2px 8px -2px rgba(0,0,0,0.4)',
    }}>
      {actions.map((a, i) => a === null ? (
        <div key={i} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
      ) : (
        <button key={a.key} onClick={() => { onAction(a.key, item); onClose(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 14px', fontSize: 13,
            color: a.danger ? 'var(--danger)' : 'var(--text-2)',
            background: 'transparent', borderRadius: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-active)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon name={a.icon} size={14} />
          {a.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASK DRAWER
═══════════════════════════════════════════════════════════════ */
function TaskDrawer({ item, projects, deps = [], onAddDependency, onDeleteDependency, onClose }) {
  const updateDates = useUpdateTaskDates();
  const updateMs    = useUpdateMilestone();
  const [localStart, setLocalStart] = useState('');
  const [localDue, setLocalDue]     = useState('');
  const [localDone, setLocalDone]   = useState(false);

  useEffect(() => {
    if (!item) return;
    if (item.type === 'task') {
      setLocalStart(item.data.start_date ?? '');
      setLocalDue(item.data.due_at ? isoDate(new Date(item.data.due_at)) : '');
      setLocalDone(item.data.done);
    } else if (item.type === 'milestone') {
      setLocalStart(item.data.date ?? '');
      setLocalDone(item.data.done);
    }
  }, [item]);

  if (!item) return null;
  const isTask = item.type === 'task';
  const isMs   = item.type === 'milestone';
  const d      = item.data;
  const proj   = item.project;
  const sm     = STATUS_META[d.kanban_status] ?? STATUS_META.todo;

  const saveDates = async () => {
    if (isTask) {
      await updateDates.mutateAsync({ id: d.id, start_date: localStart || null, due_at: localDue ? new Date(localDue + 'T12:00:00').toISOString() : null });
    } else if (isMs) {
      await updateMs.mutateAsync({ id: d.id, date: localStart });
    }
  };

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(360px, 100vw)', zIndex: 46,
        background: 'var(--bg-elev-1)', borderLeft: '1px solid var(--border)',
        boxShadow: '-8px 0 32px -8px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 180ms ease-out',
      }}>
        <style>{`@keyframes slideInRight{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {proj && <div style={{ width: 3, height: 40, background: `var(${proj.color_token})`, borderRadius: 2, flex: 'none', marginTop: 2 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isMs && <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: proj ? `var(${proj.color_token})` : 'var(--text-3)', transform: 'rotate(45deg)', borderRadius: 1 }} />
              Веха
            </div>}
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{d.title}</div>
            {proj && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{proj.name}</div>}
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>

        {/* Body */}
        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isTask && (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: `color-mix(in oklab, ${sm.color} 14%, transparent)`, color: sm.color, border: `1px solid color-mix(in oklab, ${sm.color} 30%, transparent)` }}>
                  {sm.label}
                </span>
                {d.priority > 0 && (
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: `color-mix(in oklab, ${PRIORITY_COLORS[d.priority]} 14%, transparent)`, color: PRIORITY_COLORS[d.priority], border: `1px solid color-mix(in oklab, ${PRIORITY_COLORS[d.priority]} 30%, transparent)` }}>
                    P{d.priority}
                  </span>
                )}
              </div>
              {d.notes && <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg-elev-2)', borderRadius: 8 }}>{d.notes}</div>}
            </>
          )}

          {/* Dates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Даты</div>
            {isTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ label: 'Начало', v: localStart, set: setLocalStart }, { label: 'Дедлайн', v: localDue, set: setLocalDue }].map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 64, fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{f.label}</span>
                    <DatePicker value={f.v} onChange={f.set} placeholder={f.label} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 64, fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>Дата</span>
                <DatePicker value={localStart} onChange={setLocalStart} placeholder="Дата вехи" size="sm" />
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={saveDates}>Сохранить даты</Button>
          </div>

          {isMs && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Статус</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={localDone} onChange={async e => {
                  setLocalDone(e.target.checked);
                  await updateMs.mutateAsync({ id: d.id, done: e.target.checked });
                }} />
                Веха выполнена
              </label>
            </div>
          )}

          {isTask && d.project && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Проект</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: `var(${proj?.color_token})`, flex: 'none' }} />
                {d.project.name}
              </div>
            </div>
          )}

          {isTask && (
            <TaskDependencies task={d} deps={deps} onAdd={onAddDependency} onDelete={onDeleteDependency} />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" icon="arrow_right" onClick={onClose}>
            {isMs ? 'Закрыть' : 'Закрыть'}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASK DEPENDENCIES (list + add, shown inside TaskDrawer)
═══════════════════════════════════════════════════════════════ */
function TaskDependencies({ task, deps, onAdd, onDelete }) {
  const incoming = deps.filter(dep => dep.to_task === task.id);   // this task depends on others
  const outgoing = deps.filter(dep => dep.from_task === task.id); // this task blocks others
  const depTypeLabel = (key) => DEP_TYPES.find(t => t.key === key)?.label ?? key;

  const row = (dep, label, relatedTitle, flip) => (
    <div key={dep.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', padding: '6px 8px', background: 'var(--bg-elev-2)', borderRadius: 6 }}>
      <Icon name="arrow_right" size={12} style={{ color: 'var(--text-muted)', flex: 'none', transform: flip ? 'rotate(180deg)' : 'none' }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label} «{relatedTitle ?? '—'}» ({depTypeLabel(dep.dep_type)})
      </span>
      <button onClick={() => onDelete(dep.id)} title="Удалить зависимость"
        style={{ color: 'var(--text-muted)', flex: 'none', cursor: 'pointer', display: 'flex' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <Icon name="x" size={12} />
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Зависимости</div>
        <button onClick={() => onAdd(task)} style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
          <Icon name="link" size={12} /> Добавить
        </button>
      </div>
      {incoming.length === 0 && outgoing.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет связей</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {incoming.map(dep => row(dep, 'Зависит от', dep.fromTask?.title, true))}
          {outgoing.map(dep => row(dep, 'Блокирует', dep.toTask?.title, false))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DEPENDENCY ARROWS SVG OVERLAY
═══════════════════════════════════════════════════════════════ */
function DepsOverlay({ deps, barRects, colMeta, colW, totalHeight }) {
  if (!deps.length) return null;
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: totalHeight, pointerEvents: 'none', zIndex: 5, overflow: 'visible' }}>
      <defs>
        <marker id="dep-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.35)" />
        </marker>
      </defs>
      {deps.map(dep => {
        const fromR = barRects[dep.from_task];
        const toR   = barRects[dep.to_task];
        if (!fromR || !toR) return null;
        // fromR.y / toR.y are already the bar's vertical CENTER (see onBarRectUpdate),
        // so no extra "+ h/2" here — that was double-offsetting the endpoint downward.
        let sx, sy, ex, ey;
        if (dep.dep_type === 'finish_to_start' || dep.dep_type === 'finish_to_finish') {
          sx = fromR.x + fromR.w; sy = fromR.y;
        } else {
          sx = fromR.x; sy = fromR.y;
        }
        if (dep.dep_type === 'finish_to_start' || dep.dep_type === 'start_to_start') {
          ex = toR.x; ey = toR.y;
        } else {
          ex = toR.x + toR.w; ey = toR.y;
        }
        const cx = (sx + ex) / 2;
        return (
          <path key={dep.id}
            d={`M${sx},${sy} C${cx},${sy} ${cx},${ey} ${ex},${ey}`}
            fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"
            strokeDasharray="4 3" markerEnd="url(#dep-arrow)"
          />
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN GANTT COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Gantt() {
  const navigate                   = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ─── Data ─────────────────────────────────────────────── */
  const { data: projects = [], isLoading: projLoading } = useProjects();
  const { data: tasks = [],    isLoading: taskLoading  } = useGanttTasks();
  const { data: milestones = [] } = useMilestones();
  const { data: deps = [] }       = useTaskDependencies();
  const deleteDep = useDeleteDependency();

  /* ─── URL params ────────────────────────────────────────── */
  const scaleKey  = SCALE_DEFS[searchParams.get('scale')] ? searchParams.get('scale') : 'week';
  const viewMode  = searchParams.get('view') ?? 'all'; // 'all' | 'project'
  const focusPid  = searchParams.get('pid') ?? null;
  const showMs    = searchParams.get('milestone') === '1';

  const scale = SCALE_DEFS[scaleKey];

  /* ─── Local state ───────────────────────────────────────── */
  const [offset, setOffset]         = useState(0);
  const [expanded, setExpanded]     = useState(() => new Set());
  const [search, setSearch]         = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDone, setFilterDone] = useState(true);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [selected, setSelected]     = useState(new Set());
  const [drawer, setDrawer]         = useState(null);   // { type, data, project }
  const [ctxMenu, setCtxMenu]       = useState(null);   // { x, y, item }
  const [editProject, setEditProject] = useState(null);
  const [milestoneModal, setMilestoneModal] = useState(null); // null | 'new' | milestone-obj
  const [confirmDrag, setConfirmDrag] = useState(null);  // { task, newStart, newEnd }
  const [addDepModal, setAddDepModal] = useState(null);  // task
  const [barRects, setBarRects]     = useState({});

  /* ─── Scroll sync ───────────────────────────────────────── */
  const leftPanelRef  = useRef(null);
  const timelineRef   = useRef(null);
  const isSyncingRef  = useRef(false);

  const handleLeftScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (timelineRef.current) timelineRef.current.scrollTop = leftPanelRef.current.scrollTop;
    isSyncingRef.current = false;
  }, []);

  const handleTimelineScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (leftPanelRef.current) leftPanelRef.current.scrollTop = timelineRef.current.scrollTop;
    isSyncingRef.current = false;
  }, []);

  /* ─── Ctrl+wheel zoom ───────────────────────────────────── */
  const SCALE_ORDER = ['day', 'week', 'month', 'quarter', 'year'];
  useEffect(() => {
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const cur = SCALE_ORDER.indexOf(scaleKey);
      const next = e.deltaY > 0 ? Math.min(cur + 1, SCALE_ORDER.length - 1) : Math.max(cur - 1, 0);
      if (next !== cur) {
        const p = new URLSearchParams(searchParams);
        p.set('scale', SCALE_ORDER[next]);
        setSearchParams(p);
        setOffset(0);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [scaleKey, searchParams, setSearchParams]);

  /* ─── Escape closes milestone modal ───────────────────── */
  const closeMilestoneModal = useCallback(() => {
    const p = new URLSearchParams(searchParams);
    p.delete('milestone');
    setSearchParams(p);
    setMilestoneModal(null);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (showMs) setMilestoneModal('new');
  }, [showMs]);

  /* ─── Scale / view ─────────────────────────────────────── */
  const viewStart = scale.getStart(offset);
  const { cols: COLS, colW } = scale;
  const colMeta   = useMemo(() => buildColMeta(viewStart, scaleKey), [viewStart, scaleKey]);
  const hdrSpans  = useMemo(() => buildHeaderSpans(colMeta, scaleKey), [colMeta, scaleKey]);

  /* ─── Left panel columns ────────────────────────────────── */
  const LABEL_W  = 220;
  const STATUS_W = 80;
  const PROG_W   = 52;
  const DATE_W   = 88;
  const LEFT_W   = LABEL_W + STATUS_W + PROG_W + DATE_W;

  /* ─── Project filter for single-project view ─────────────── */
  const visibleProjects = useMemo(() => {
    if (viewMode === 'project' && focusPid) return projects.filter(p => p.id === focusPid);
    return projects;
  }, [projects, viewMode, focusPid]);

  /* ─── Flat rows array ───────────────────────────────────── */
  const rows = useMemo(() => {
    const result = [];
    const now = new Date();
    for (const p of visibleProjects) {
      const pTasks = tasks.filter(t => t.project_id === p.id);
      const pMs    = milestones.filter(m => m.project_id === p.id);
      const progress = pTasks.length ? Math.round(pTasks.filter(t => t.done).length / pTasks.length * 100) : 0;
      result.push({ type: 'project', data: p, project: p, progress, taskCount: pTasks.length, doneCount: pTasks.filter(t => t.done).length });

      if (!expanded.has(p.id)) continue;

      const filteredTasks = pTasks
        .filter(t => {
          if (!filterDone && t.done) return false;
          if (filterOverdue && (t.done || !t.due_at || new Date(t.due_at) >= now)) return false;
          if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        })
        .sort((a, b) => {
          const da = a.due_at ? new Date(a.due_at) : new Date(9e15);
          const db = b.due_at ? new Date(b.due_at) : new Date(9e15);
          return da - db;
        });

      for (const t of filteredTasks) {
        result.push({ type: 'task', data: t, project: p });
      }

      for (const m of pMs) {
        result.push({ type: 'milestone', data: m, project: p });
      }
    }
    return result;
  }, [visibleProjects, tasks, milestones, expanded, filterDone, filterOverdue, search]);

  /* ─── Toggle expand ─────────────────────────────────────── */
  const toggle = useCallback((id) => {
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  /* ─── Set scale helper ──────────────────────────────────── */
  const setScale = useCallback((key) => {
    const p = new URLSearchParams(searchParams);
    p.set('scale', key);
    setSearchParams(p);
    setOffset(0);
  }, [searchParams, setSearchParams]);

  /* ─── View mode helpers ─────────────────────────────────── */
  const setViewAll = () => {
    const p = new URLSearchParams(searchParams);
    p.set('view', 'all'); p.delete('pid');
    setSearchParams(p);
  };
  const setViewProject = (pid) => {
    const p = new URLSearchParams(searchParams);
    p.set('view', 'project'); p.set('pid', pid);
    setSearchParams(p);
    setExpanded(s => { const n = new Set(s); n.add(pid); return n; });
  };

  /* ─── Context menu actions ──────────────────────────────── */
  const handleCtxAction = useCallback((key, item) => {
    if (key === 'open') { setDrawer(item); }
    else if (key === 'dates') {
      if (item.type === 'task') setDrawer(item);
    }
    else if (key === 'dep') { setAddDepModal(item.data); }
    else if (key === 'edit_ms') { setMilestoneModal(item.data); }
    else if (key === 'delete_ms') { /* handled inline */ }
    else if (key === 'delete') { /* future: delete task */ }
  }, []);

  /* ─── Bar drag & drop ───────────────────────────────────── */
  const dragRef      = useRef(null);
  const dragGhostRef = useRef(null); // avoid stale closure
  const [dragGhost, setDragGhost] = useState(null); // { id, left, width, ns, ne }

  const handleBarMouseDown = useCallback((e, task, dragType) => {
    e.stopPropagation();
    const origStart = task.start_date ? parseDate(task.start_date) : parseDate(isoDate(new Date(task.created_at)));
    const origEnd   = task.due_at ? parseDate(isoDate(new Date(task.due_at))) : null;
    if (!origEnd) return;
    const startCol = dateToCol(isoDate(origStart), viewStart, scaleKey) ?? 0;
    const endCol   = dateToCol(isoDate(origEnd), viewStart, scaleKey) ?? 0;

    dragRef.current = {
      task, dragType, startX: e.clientX, colW,
      origStartCol: startCol, origEndCol: endCol,
      viewStart, scaleKey, COLS,
    };
    dragGhostRef.current = null;

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dr    = dragRef.current;
      const dx    = ev.clientX - dr.startX;
      const delta = Math.round(dx / dr.colW);
      let ns = dr.origStartCol, ne = dr.origEndCol;
      if (dr.dragType === 'move') { ns += delta; ne += delta; }
      else if (dr.dragType === 'resize-start') { ns = Math.min(ns + delta, ne - 1); }
      else if (dr.dragType === 'resize-end')   { ne = Math.max(ne + delta, ns + 1); }
      const left  = Math.max(0, ns) * dr.colW;
      const width = Math.max(dr.colW * 0.8, (ne - Math.max(0, ns)) * dr.colW - 6);
      const ghost = { id: task.id, left, width, ns, ne };
      dragGhostRef.current = ghost;
      setDragGhost(ghost);
    };

    const onUp = () => {
      const dr    = dragRef.current;
      const ghost = dragGhostRef.current;
      if (dr && ghost) {
        const newStartDate = colToDate(ghost.ns, dr.viewStart, dr.scaleKey);
        const newEndDate   = colToDate(ghost.ne, dr.viewStart, dr.scaleKey);
        setConfirmDrag({
          task: dr.task,
          newStart: isoDate(newStartDate),
          newEnd: isoDate(newEndDate),
        });
      }
      dragRef.current      = null;
      dragGhostRef.current = null;
      setDragGhost(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [viewStart, scaleKey, colW, COLS]);

  /* ─── Update bar rects (for dependency arrows) ──────────── */
  const updateBarRect = useCallback((id, rect) => {
    setBarRects(prev => {
      if (prev[id] && prev[id].x === rect.x && prev[id].y === rect.y && prev[id].w === rect.w) return prev;
      return { ...prev, [id]: rect };
    });
  }, []);

  /* ─── today col ─────────────────────────────────────────── */
  const todayCol = useMemo(() => dateToCol(isoDate(new Date()), viewStart, scaleKey), [viewStart, scaleKey]);

  /* ─── Total timeline height for today line ──────────────── */
  const totalRowsH = useMemo(() => rows.reduce((s, r) => s + ROW_H[r.type], 0), [rows]);
  const totalH = HEADER_H + totalRowsH;

  /* ─── Cumulative row top offsets (row heights vary by type,
     so a row's on-screen Y is NOT idx * rowH) — used for dependency arrows. ── */
  const rowTops = useMemo(() => {
    let acc = 0;
    return rows.map(r => { const top = acc; acc += ROW_H[r.type]; return top; });
  }, [rows]);

  /* ─── Render column backgrounds ─────────────────────────── */
  const renderColBgs = (rowH, lineOpacity = 0.4) => (
    <>
      {colMeta.map((c, i) => {
        const isTodayCol = scaleKey === 'day' && c.isToday;
        const isWE = scaleKey === 'day' && c.isWeekend;
        const isCurW = scaleKey === 'week' && c.isCurrentWeek;
        const isCurM = (scaleKey === 'month' || scaleKey === 'quarter' || scaleKey === 'year') && c.isCurrentMonth;
        if (!isTodayCol && !isWE && !isCurW && !isCurM) return null;
        return (
          <div key={i} style={{
            position: 'absolute', left: i * colW, top: 0, bottom: 0, width: colW, pointerEvents: 'none',
            background: isTodayCol ? 'color-mix(in oklab, var(--danger) 8%, transparent)'
              : (isWE || isCurM) ? 'color-mix(in oklab, var(--text) 2.5%, transparent)'
              : isCurW ? 'color-mix(in oklab, var(--danger) 5%, transparent)' : 'transparent',
          }} />
        );
      })}
      {colMeta.map((c, i) => (
        <div key={'l' + i} style={{
          position: 'absolute', left: i * colW, top: 0, bottom: 0, width: 1, pointerEvents: 'none',
          background: (scaleKey === 'day' && c.isToday) ? 'transparent'
            : (scaleKey === 'week' && c.isCurrentWeek) ? 'var(--danger)' : 'var(--border-subtle)',
          opacity: (scaleKey === 'week' && c.isCurrentWeek) ? 0.5 : lineOpacity,
        }} />
      ))}
    </>
  );

  /* ─── Loading state ─────────────────────────────────────── */
  const isLoading = projLoading || taskLoading;

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
      {/* Modals */}
      {(milestoneModal || showMs) && projects.length > 0 && (
        <MilestoneModal
          projects={projects}
          milestone={milestoneModal && milestoneModal !== 'new' ? milestoneModal : null}
          onClose={closeMilestoneModal}
        />
      )}
      {confirmDrag && (
        <ConfirmDatesModalConnected
          task={confirmDrag.task}
          newStart={confirmDrag.newStart}
          newEnd={confirmDrag.newEnd}
          onCancel={() => setConfirmDrag(null)}
          onClose={() => setConfirmDrag(null)}
        />
      )}
      {addDepModal && (
        <AddDepModal fromTask={addDepModal} tasks={tasks} onClose={() => setAddDepModal(null)} />
      )}
      {editProject && (
        <EditDatesModal project={editProject} onClose={() => setEditProject(null)} />
      )}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} item={ctxMenu.item} onClose={() => setCtxMenu(null)} onAction={handleCtxAction} />
      )}
      {drawer && (
        <TaskDrawer item={drawer} projects={projects} deps={deps}
          onAddDependency={(task) => setAddDepModal(task)}
          onDeleteDependency={(id) => deleteDep.mutate(id)}
          onClose={() => setDrawer(null)} />
      )}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)', overflow: 'hidden' }}>

          {/* ── TOP BAR ──────────────────────────────────────── */}
          <TopBar
            title="Гантт"
            sub={viewMode === 'project' && focusPid
              ? projects.find(p => p.id === focusPid)?.name ?? ''
              : `${visibleProjects.length} проектов`}
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Icon name="search" size={14} style={{ position: 'absolute', left: 9, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
                    style={{ height: 28, paddingLeft: 30, paddingRight: 10, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text)', width: 160, outline: 'none' }} />
                </div>

                {/* Filters toggle */}
                <Button variant={showFilters ? 'secondary' : 'ghost'} size="sm" icon="filter" onClick={() => setShowFilters(f => !f)}>
                  Фильтры
                </Button>

                <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

                {/* Scale buttons */}
                {[
                  { key: 'day', label: 'День' },
                  { key: 'week', label: 'Нед' },
                  { key: 'month', label: 'Мес' },
                  { key: 'quarter', label: 'Кв' },
                  { key: 'year', label: 'Год' },
                ].map(s => (
                  <button key={s.key} onClick={() => setScale(s.key)}
                    style={{
                      height: 28, padding: '0 10px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      background: scaleKey === s.key ? 'var(--bg-elev-3)' : 'transparent',
                      border: scaleKey === s.key ? '1px solid var(--border)' : '1px solid transparent',
                      color: scaleKey === s.key ? 'var(--text)' : 'var(--text-3)',
                    }}>
                    {s.label}
                  </button>
                ))}

                <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

                {/* Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton icon="chevron_left" size="sm" onClick={() => setOffset(o => o - 1)} />
                  <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>Сегодня</Button>
                  <IconButton icon="chevron_right" size="sm" onClick={() => setOffset(o => o + 1)} />
                </div>

                <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

                <Button variant="secondary" size="sm" icon="flag"
                  onClick={() => { const p = new URLSearchParams(searchParams); p.set('milestone', '1'); setSearchParams(p); }}>
                  Веха
                </Button>

                {/* Fullscreen */}
                <IconButton icon="maximize" size="sm" title="Полный экран"
                  onClick={() => document.documentElement.requestFullscreen?.() } />
              </div>
            }
          />

          {/* ── FILTERS PANEL ────────────────────────────────── */}
          {showFilters && (
            <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elev-1)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Фильтры:</span>
              {[
                { label: 'Показать завершённые', value: filterDone, set: setFilterDone },
                { label: 'Только просроченные', value: filterOverdue, set: setFilterOverdue },
              ].map(f => (
                <label key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={f.value} onChange={e => f.set(e.target.checked)} />
                  {f.label}
                </label>
              ))}
              {/* View mode */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Вид:</span>
                <button onClick={setViewAll}
                  style={{ height: 26, padding: '0 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: viewMode === 'all' ? 'var(--bg-elev-3)' : 'transparent', border: viewMode === 'all' ? '1px solid var(--border)' : '1px solid transparent', color: viewMode === 'all' ? 'var(--text)' : 'var(--text-3)' }}>
                  Все проекты
                </button>
                <select value={focusPid ?? ''} onChange={e => e.target.value ? setViewProject(e.target.value) : setViewAll()}
                  style={{ height: 26, padding: '0 8px', borderRadius: 6, fontSize: 12, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text)', appearance: 'auto' }}>
                  <option value="">— Один проект</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ── MAIN CONTENT: LEFT + TIMELINE ────────────────── */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* LEFT PANEL */}
            <div style={{ width: LEFT_W, flex: 'none', display: 'flex', flexDirection: 'column', borderRight: '2px solid var(--border)', background: 'var(--bg)' }}>

              {/* Left header */}
              <div style={{ height: HEADER_H, flex: 'none', borderBottom: '2px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'stretch', zIndex: 10 }}>
                <div style={{ width: LABEL_W, padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: '1px solid var(--border-subtle)' }}>Название</div>
                <div style={{ width: STATUS_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: '1px solid var(--border-subtle)' }}>Статус</div>
                <div style={{ width: PROG_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: '1px solid var(--border-subtle)' }}>%</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Срок</div>
              </div>

              {/* Left rows */}
              <div ref={leftPanelRef} onScroll={handleLeftScroll} className="ws-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ height: 40, margin: '6px 12px', borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                  ))
                ) : rows.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    {projects.length === 0 ? 'Нет проектов' : 'Нет задач'}
                  </div>
                ) : rows.map((row, idx) => (
                  <LeftRow key={row.type + '-' + row.data.id}
                    row={row} expanded={expanded} toggle={toggle}
                    selected={selected} setSelected={setSelected}
                    LABEL_W={LABEL_W} STATUS_W={STATUS_W} PROG_W={PROG_W} DATE_W={DATE_W}
                    onRowClick={(r) => {
                      if (r.type === 'project') setEditProject(r.data);
                      else setDrawer(r);
                    }}
                    onContextMenu={(e, r) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, item: r }); }}
                    setViewProject={setViewProject}
                  />
                ))}
              </div>
            </div>

            {/* TIMELINE PANEL */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

              {/* Timeline header (sticky) */}
              <div style={{ height: HEADER_H, flex: 'none', borderBottom: '2px solid var(--border)', background: 'var(--bg)', zIndex: 10, overflow: 'hidden', position: 'relative' }}>
                {/* We mirror horizontal scroll via a wrapper */}
                <HdrScrollMirror timelineRef={timelineRef} colMeta={colMeta} colW={colW} hdrSpans={hdrSpans} scaleKey={scaleKey} COLS={COLS} />
              </div>

              {/* Timeline rows */}
              <div ref={timelineRef} onScroll={handleTimelineScroll}
                className="ws-scroll"
                style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', position: 'relative' }}>

                <div style={{ minWidth: COLS * colW, position: 'relative' }}>
                  {/* Today line — spans full height */}
                  {todayCol !== null && todayCol >= 0 && todayCol < COLS && (
                    <div style={{
                      position: 'absolute',
                      left: todayCol * colW + (scaleKey === 'day' ? colW / 2 : 0),
                      top: 0, bottom: 0, width: 2,
                      background: 'var(--danger)', opacity: 0.7,
                      zIndex: 4, pointerEvents: 'none',
                    }} />
                  )}

                  {/* Dependency arrows */}
                  <DepsOverlay deps={deps} barRects={barRects} colMeta={colMeta} colW={colW} totalHeight={totalH} />

                  {/* Loading */}
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} style={{ height: 40, position: 'relative', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', height: 16, width: '40%', borderRadius: 4, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                      </div>
                    ))
                  ) : rows.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      {projects.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontSize: 32, opacity: 0.4 }}>📋</div>
                          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>Нет проектов</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Создайте первый проект в разделе «Проекты»</div>
                          <Button variant="primary" size="sm" onClick={() => navigate('/projects?new=1')}>Создать проект</Button>
                        </div>
                      ) : 'Нет задач с датами'}
                    </div>
                  ) : rows.map((row, idx) => (
                    <TimelineRow key={row.type + '-' + row.data.id}
                      row={row} idx={idx} top={rowTops[idx]}
                      colMeta={colMeta} colW={colW} COLS={COLS}
                      viewStart={viewStart} scaleKey={scaleKey}
                      renderColBgs={renderColBgs}
                      dragGhost={dragGhost}
                      onBarMouseDown={handleBarMouseDown}
                      onBarRectUpdate={updateBarRect}
                      onContextMenu={(e, r) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, item: r }); }}
                      onClick={(r) => setDrawer(r)}
                      setEditProject={setEditProject}
                      onMilestoneClick={(m) => setMilestoneModal(m)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── BULK ACTION BAR ───────────────────────────────── */}
          {selected.size > 0 && (
            <div style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-elev-3)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center',
              gap: 10, boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6)', zIndex: 30,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                Выделено {selected.size}
              </span>
              <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
              <Button variant="ghost" size="sm">Изменить статус</Button>
              <Button variant="ghost" size="sm">Изменить даты</Button>
              <Button variant="danger" size="sm">Удалить</Button>
              <IconButton icon="x" size="sm" onClick={() => setSelected(new Set())} />
            </div>
          )}

        </main>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEADER SCROLL MIRROR
   Syncs horizontal scroll of timeline header with timeline body
═══════════════════════════════════════════════════════════════ */
function HdrScrollMirror({ timelineRef, colMeta, colW, hdrSpans, scaleKey, COLS }) {
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [timelineRef]);

  return (
    <div style={{ overflow: 'hidden', height: '100%' }}>
      <div style={{ transform: `translateX(-${scrollLeft}px)`, minWidth: COLS * colW, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Row 1: spans */}
        <div style={{ height: 22, display: 'flex', position: 'relative', borderBottom: '1px solid var(--border-subtle)' }}>
          {hdrSpans.map((span, i) => (
            <div key={i} style={{
              position: 'absolute', left: span.start * colW, width: span.count * colW, top: 0, bottom: 0,
              display: 'flex', alignItems: 'center', paddingLeft: 8,
              borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
              fontSize: 11, fontWeight: 500, color: 'var(--text-2)',
              textTransform: 'capitalize', overflow: 'hidden', whiteSpace: 'nowrap',
            }}>
              {span.label}
            </div>
          ))}
        </div>
        {/* Row 2: column labels */}
        <div style={{ height: 26, display: 'flex' }}>
          {colMeta.map((c, i) => (
            <div key={i} style={{
              width: colW, flex: 'none', height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: i > 0 ? '1px solid var(--border-subtle)' : 'none',
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: (scaleKey === 'day' && c.isToday) ? 'var(--danger)' : (scaleKey === 'day' && c.isWeekend) ? 'var(--text-muted)' : 'var(--text-3)',
              fontWeight: (scaleKey === 'day' && c.isToday) ? 700 : 400,
              background: (scaleKey === 'day' && c.isToday) ? 'color-mix(in oklab, var(--danger) 12%, transparent)' : 'transparent',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEFT PANEL ROW
═══════════════════════════════════════════════════════════════ */
function LeftRow({ row, expanded, toggle, selected, setSelected, LABEL_W, STATUS_W, PROG_W, DATE_W, onRowClick, onContextMenu, setViewProject }) {
  const { type, data: d, project: p } = row;
  const isExp = type === 'project' && expanded.has(d.id);
  const isSel = selected.has(d.id);

  const h = ROW_H[type];
  const indent = type === 'project' ? 0 : 14;

  const sm = STATUS_META[d.kanban_status] ?? STATUS_META.todo;
  const pColors = [null, 'var(--danger)', 'var(--warn)', 'var(--text-muted)'];

  const fmtDate = (s) => {
    if (!s) return null;
    return new Date(s).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  };

  let statusLabel = '', statusColor = '';
  let dueStr = '';
  let progress = 0;

  if (type === 'project') {
    statusLabel = d.status === 'completed' ? 'Завершён' : d.status === 'paused' ? 'Пауза' : 'Активный';
    statusColor = d.status === 'completed' ? 'var(--success)' : d.status === 'paused' ? 'var(--warn)' : 'var(--info)';
    progress = row.progress;
    dueStr = d.end_date ? fmtDate(d.end_date) : '';
  } else if (type === 'task') {
    statusLabel = sm.label;
    statusColor = sm.color;
    dueStr = d.due_at ? fmtDate(d.due_at) : '';
    const isOverdue = !d.done && d.due_at && new Date(d.due_at) < new Date();
    if (isOverdue) statusColor = 'var(--danger)';
    progress = d.done ? 100 : (d.kanban_status === 'in_progress' ? 50 : d.kanban_status === 'review' ? 75 : 0);
  } else if (type === 'milestone') {
    statusLabel = d.done ? 'Выполнено' : 'Ожидает';
    statusColor = d.done ? 'var(--success)' : 'var(--text-3)';
    dueStr = d.date ? fmtDate(d.date) : '';
  }

  return (
    <div
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          setSelected(s => { const n = new Set(s); n.has(d.id) ? n.delete(d.id) : n.add(d.id); return n; });
        } else {
          onRowClick(row);
        }
      }}
      onContextMenu={(e) => onContextMenu(e, row)}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'var(--bg-active)' : 'transparent'; }}
      style={{
        height: h, display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
        background: isSel ? 'var(--bg-active)' : type === 'project' ? 'var(--bg-elev-1)' : 'transparent',
        borderLeft: type === 'project' ? `3px solid var(${d.color_token})` : '3px solid transparent',
        transition: 'background 80ms',
        opacity: (type === 'task' && d.done) ? 0.65 : 1,
        userSelect: 'none',
      }}>

      {/* Name column */}
      <div style={{ width: LABEL_W - (type === 'project' ? 3 : 3), flex: 'none', paddingLeft: 8 + indent, paddingRight: 8, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', borderRight: '1px solid var(--border-subtle)', height: '100%' }}>
        {type === 'project' && (
          <button onClick={e => { e.stopPropagation(); toggle(d.id); }}
            style={{ width: 18, height: 18, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--text-3)', background: 'transparent', transition: 'transform 150ms', transform: isExp ? 'rotate(90deg)' : 'none' }}>
            <Icon name="chevron_right" size={12} />
          </button>
        )}
        {type === 'task' && (
          <span style={{ fontSize: 12, color: d.done ? 'var(--success)' : 'var(--text-muted)', flex: 'none', width: 14 }}>{d.done ? '✓' : '○'}</span>
        )}
        {type === 'milestone' && (
          <span style={{ width: 10, height: 10, background: p ? `var(${p.color_token})` : 'var(--text-3)', transform: 'rotate(45deg)', borderRadius: 2, flex: 'none', display: 'inline-block' }} />
        )}
        {d.priority > 0 && type === 'task' && (
          <span style={{ width: 5, height: 5, borderRadius: 999, background: pColors[d.priority] || 'var(--text-muted)', flex: 'none' }} />
        )}
        {d.emoji && type === 'project' && <span style={{ fontSize: 13, flex: 'none' }}>{d.emoji}</span>}
        <span style={{ fontSize: 12, fontWeight: type === 'project' ? 600 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textDecoration: (type === 'task' && d.done) ? 'line-through' : 'none' }}>
          {d.title ?? d.name}
        </span>
        {type === 'project' && (
          <button onClick={e => { e.stopPropagation(); setViewProject(d.id); }}
            title="Открыть этот проект"
            style={{ width: 18, height: 18, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <Icon name="arrow_right" size={11} />
          </button>
        )}
      </div>

      {/* Status column */}
      <div style={{ width: STATUS_W, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-subtle)', height: '100%' }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: statusColor, padding: '2px 7px', borderRadius: 99, background: `color-mix(in oklab, ${statusColor} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${statusColor} 25%, transparent)`, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: STATUS_W - 10, textOverflow: 'ellipsis' }}>
          {statusLabel}
        </span>
      </div>

      {/* Progress column */}
      <div style={{ width: PROG_W, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-subtle)', height: '100%', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{progress}%</span>
        {type !== 'milestone' && (
          <div style={{ width: 32, height: 3, borderRadius: 99, background: 'var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'var(--success)' : `var(${p?.color_token ?? '--info'})`, borderRadius: 99 }} />
          </div>
        )}
      </div>

      {/* Due date column */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', height: '100%' }}>
        {dueStr}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TIMELINE ROW
═══════════════════════════════════════════════════════════════ */
function TimelineRow({ row, idx, top, colMeta, colW, COLS, viewStart, scaleKey, renderColBgs, dragGhost, onBarMouseDown, onBarRectUpdate, onContextMenu, onClick, setEditProject, onMilestoneClick }) {
  const { type, data: d, project: p } = row;
  const rowH = ROW_H[type];
  const barRef = useRef(null);

  /* Compute bar position */
  const barPos = useMemo(() => {
    if (type === 'milestone') {
      const col = dateToCol(d.date, viewStart, scaleKey);
      if (col === null || col < 0 || col >= COLS) return null;
      return { isMilestone: true, col, left: col * colW + colW / 2 - 7 };
    }

    const startStr = type === 'task' ? (d.start_date || isoDate(new Date(d.created_at))) : d.start_date;
    const endStr   = type === 'task' ? (d.due_at ? isoDate(new Date(d.due_at)) : null) : d.end_date;

    if (!endStr) {
      if (type === 'project') return null;
      return null;
    }

    const startCol = startStr ? (dateToCol(startStr, viewStart, scaleKey) ?? 0) : 0;
    const endCol   = dateToCol(endStr, viewStart, scaleKey);
    if (endCol === null) return null;

    const rawStart = Math.max(0, startCol);
    const rawEnd   = Math.min(COLS, endCol + 1);
    if (rawEnd <= 0 || rawStart >= COLS) return null;

    const left  = rawStart * colW + 3;
    const width = Math.max(colW * 0.8, (rawEnd - rawStart) * colW - 6);

    let pct = 0;
    if (type === 'project') {
      pct = row.progress ?? 0;
    } else if (type === 'task') {
      pct = d.done ? 100 : (d.kanban_status === 'in_progress' ? 50 : d.kanban_status === 'review' ? 75 : 0);
    }

    return { left, width, pct, startCol, endCol };
  }, [type, d, viewStart, scaleKey, colW, COLS, row]);

  /* Notify parent of bar rect */
  useEffect(() => {
    if (!barPos || barPos.isMilestone) return;
    onBarRectUpdate(d.id, {
      x: barPos.left,
      y: top + rowH / 2,
      w: barPos.width,
      h: type === 'project' ? 22 : 16,
    });
  }, [barPos, top, rowH, d.id, type, onBarRectUpdate]);

  const isOverdue = type === 'task' && !d.done && d.due_at && new Date(d.due_at) < new Date();
  const isDone    = type === 'task' && d.done;

  const barColor = isDone
    ? 'var(--success)'
    : isOverdue
      ? 'var(--danger)'
      : p ? `var(${p.color_token})` : 'var(--info)';

  /* Ghost overlay when dragging this bar */
  const ghost = dragGhost && dragGhost.id === d.id ? dragGhost : null;

  const handleContextMenu = (e) => { e.preventDefault(); onContextMenu(e, row); };
  const handleClick = (e) => {
    e.stopPropagation();
    if (type === 'milestone') onMilestoneClick(d);
    else if (type === 'project') setEditProject(d);
    else onClick(row);
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{
        height: rowH, position: 'relative', borderBottom: '1px solid var(--border-subtle)',
        background: 'transparent', transition: 'background 80ms',
        opacity: isDone ? 0.7 : 1,
      }}>

      {/* Column backgrounds */}
      {renderColBgs(rowH)}

      {/* Milestone diamond */}
      {barPos?.isMilestone && (
        <div
          onClick={handleClick}
          title={`${d.title} · ${d.date}`}
          style={{
            position: 'absolute', left: barPos.left, top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            width: 14, height: 14,
            background: d.done ? 'var(--success)' : (p ? `var(${p.color_token})` : 'var(--text-3)'),
            borderRadius: 3, cursor: 'pointer', zIndex: 3,
            boxShadow: `0 0 10px 2px color-mix(in oklab, ${d.done ? 'var(--success)' : (p ? `var(${p.color_token})` : 'var(--text-3)')} 50%, transparent)`,
            opacity: d.done ? 0.6 : 1,
          }} />
      )}

      {/* Project / task bar */}
      {barPos && !barPos.isMilestone && (
        <div ref={barRef}
          title={`${d.title ?? d.name}${isOverdue ? ' · Просрочено' : ''}`}
          style={{
            position: 'absolute',
            left: ghost ? ghost.left : barPos.left,
            width: ghost ? ghost.width : barPos.width,
            top: '50%',
            transform: 'translateY(-50%)',
            height: type === 'project' ? 22 : 16,
            borderRadius: type === 'project' ? 6 : 4,
            overflow: 'hidden',
            background: `color-mix(in oklab, ${barColor} ${type === 'project' ? 22 : 28}%, transparent)`,
            border: `1.5px solid color-mix(in oklab, ${barColor} 60%, transparent)`,
            cursor: type === 'task' ? 'grab' : 'pointer',
            zIndex: 3,
            transition: ghost ? 'none' : 'left 80ms, width 80ms',
            boxSizing: 'border-box',
          }}
          onClick={handleClick}>

          {/* Progress fill */}
          {barPos.pct > 0 && (
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barPos.pct}%`, background: `color-mix(in oklab, ${barColor} 40%, transparent)` }} />
          )}

          {/* Label inside bar */}
          {barPos.width >= 80 && (
            <span style={{ position: 'absolute', inset: '0 6px', display: 'flex', alignItems: 'center', fontSize: 10, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>
              {d.title ?? d.name}
            </span>
          )}

          {/* Resize handles (tasks only) */}
          {type === 'task' && (
            <>
              <div onMouseDown={e => onBarMouseDown(e, d, 'resize-start')}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 4 }} />
              <div onMouseDown={e => onBarMouseDown(e, d, 'move')}
                style={{ position: 'absolute', left: 6, right: 6, top: 0, bottom: 0, cursor: 'grab', zIndex: 3 }} />
              <div onMouseDown={e => onBarMouseDown(e, d, 'resize-end')}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 4 }} />
            </>
          )}
        </div>
      )}

      {/* No-date hint for projects */}
      {type === 'project' && !barPos && (
        <div onClick={() => setEditProject(d)}
          style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', cursor: 'pointer' }}>
          Нажмите, чтобы добавить даты
        </div>
      )}
    </div>
  );
}

/* Fix: ConfirmDatesModal needs the update hook — use inline wrapper */
function ConfirmDatesModalConnected({ task, newStart, newEnd, onCancel, onClose }) {
  const updateDates = useUpdateTaskDates();
  const save = async () => {
    await updateDates.mutateAsync({
      id: task.id,
      start_date: newStart,
      due_at: newEnd ? new Date(newEnd + 'T12:00:00').toISOString() : null,
    });
    onClose();
  };
  return <ConfirmDatesModal task={task} newStart={newStart} newEnd={newEnd} onCancel={onCancel} onSave={save} />;
}
