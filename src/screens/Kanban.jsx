import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, ProjectTag, Checkbox } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { useKanbanTasks, useMoveTask, useToggleTask, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks.js';
import { useProjects } from '../hooks/useProjects.js';
import { useSubtasks, useCreateSubtask, useToggleSubtask, useDeleteSubtask } from '../hooks/useSubtasks.js';

const COLUMNS = [
  { id: 'backlog',     title: 'Бэклог',       color: '--text-muted' },
  { id: 'todo',        title: 'К выполнению',  color: '--info' },
  { id: 'in_progress', title: 'В работе',       color: '--p-openresto' },
  { id: 'review',      title: 'Ревью',          color: '--warn' },
  { id: 'done',        title: 'Готово',         color: '--success' },
];

/* ---- Create task modal ---- */
function CreateTaskModal({ defaultStatus, onClose }) {
  const mousedownOnBackdrop = useRef(false);
  const { data: projects = [] } = useProjects();
  const create = useCreateTask();
  const [title, setTitle]   = useState('');
  const [projId, setProjId] = useState('');
  const [prio, setPrio]     = useState('');

  const submit = async () => {
    if (!title.trim()) return;
    await create.mutateAsync({
      title: title.trim(),
      project_id: projId || null,
      priority: prio ? parseInt(prio) : null,
      kanban_status: defaultStatus,
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 380, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
          Новая задача — {COLUMNS.find(c => c.id === defaultStatus)?.title}
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Название задачи…" autoFocus
          style={{ height: 38, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select value={projId} onChange={e => setProjId(e.target.value)}
            style={{ height: 34, padding: '0 8px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}>
            <option value="">— проект —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={prio} onChange={e => setPrio(e.target.value)}
            style={{ height: 34, padding: '0 8px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}>
            <option value="">— приоритет —</option>
            <option value="1">🔴 p1 — срочно</option>
            <option value="2">🟡 p2 — важно</option>
            <option value="3">🔵 p3 — обычно</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit} style={{ opacity: title.trim() ? 1 : 0.5 }}>Создать</Button>
        </div>
      </div>
    </div>
  );
}

const PRIORITY_OPTS = [
  { value: '',  label: '— без приоритета —' },
  { value: '1', label: '🔴 p1 — срочно' },
  { value: '2', label: '🟡 p2 — важно' },
  { value: '3', label: '🔵 p3 — обычно' },
];

const fieldSx = {
  height: 34, padding: '0 10px', background: 'var(--bg-elev-1)',
  border: '1px solid var(--border-subtle)', borderRadius: 8,
  fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box',
};

/* ---- Subtask row ---- */
function SubtaskRow({ sub, onToggle, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 2px' }}>
      <span onClick={() => onToggle(sub)} style={{ cursor: 'pointer', display: 'flex' }}>
        <Checkbox checked={sub.done} />
      </span>
      <span style={{ flex: 1, fontSize: 13, color: sub.done ? 'var(--text-muted)' : 'var(--text-2)', textDecoration: sub.done ? 'line-through' : 'none' }}>
        {sub.title}
      </span>
      <button onClick={() => onDelete(sub.id)} title="Удалить подзадачу"
        style={{ color: 'var(--text-muted)', display: 'flex', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <Icon name="x" size={13} />
      </button>
    </div>
  );
}

/* ---- Task detail modal (the real tracker view) ---- */
function TaskDetailModal({ task, projects, onClose }) {
  const update    = useUpdateTask();
  const del       = useDeleteTask();
  const toggle    = useToggleTask();
  const { data: subtasks = [] } = useSubtasks(task.id);
  const createSub = useCreateSubtask();
  const toggleSub = useToggleSubtask();
  const deleteSub = useDeleteSubtask();
  const mousedownOnBackdrop = useRef(false);

  const [title, setTitle]     = useState(task.title);
  const [notes, setNotes]     = useState(task.notes ?? '');
  const [newSub, setNewSub]   = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== task.title) update.mutate({ id: task.id, title: t });
    else setTitle(task.title);
  };
  const saveNotes = () => {
    if (notes !== (task.notes ?? '')) update.mutate({ id: task.id, notes: notes.trim() || null });
  };

  const addSub = () => {
    if (!newSub.trim()) return;
    createSub.mutate({ task_id: task.id, title: newSub.trim() });
    setNewSub('');
  };

  const doneCount = subtasks.filter(s => s.done).length;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Title + close */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span onClick={() => toggle.mutate({ id: task.id, done: !task.done })} style={{ cursor: 'pointer', marginTop: 6 }}>
            <Checkbox checked={task.done} priority={task.priority} />
          </span>
          <input value={title} onChange={e => setTitle(e.target.value)} onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{ flex: 1, fontSize: 16, fontWeight: 500, color: 'var(--text)', background: 'transparent', border: 'none', outline: 'none', padding: '4px 0', textDecoration: task.done ? 'line-through' : 'none' }} />
          <IconButton icon="x" onClick={onClose} />
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLUMNS.map(col => {
            const active = task.kanban_status === col.id;
            return (
              <button key={col.id} onClick={() => update.mutate({ id: task.id, kanban_status: col.id, done: col.id === 'done', done_at: col.id === 'done' ? new Date().toISOString() : null })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: active ? `color-mix(in oklab, var(${col.color}) 16%, transparent)` : 'var(--bg-elev-1)',
                  color: active ? `var(${col.color})` : 'var(--text-2)',
                  border: `1px solid ${active ? `color-mix(in oklab, var(${col.color}) 40%, transparent)` : 'var(--border-subtle)'}`,
                }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: `var(${col.color})` }} />
                {col.title}
              </button>
            );
          })}
        </div>

        {/* Priority / Project / Due date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Приоритет</label>
            <select value={task.priority ?? ''} onChange={e => update.mutate({ id: task.id, priority: e.target.value ? parseInt(e.target.value) : null })} style={{ ...fieldSx, appearance: 'auto' }}>
              {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Проект</label>
            <select value={task.project_id ?? ''} onChange={e => update.mutate({ id: task.id, project_id: e.target.value || null })} style={{ ...fieldSx, appearance: 'auto' }}>
              <option value="">— проект —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Дедлайн</label>
            <DatePicker
              value={task.due_at ? new Date(task.due_at).toISOString().slice(0, 10) : ''}
              onChange={(v) => update.mutate({ id: task.id, due_at: v ? new Date(v + 'T12:00:00').toISOString() : null })}
              placeholder="Без дедлайна" size="sm"
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Описание</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes}
            placeholder="Добавьте описание…" rows={3}
            style={{ ...fieldSx, height: 'auto', padding: '8px 10px', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }} />
        </div>

        {/* Subtasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Подзадачи</label>
            {subtasks.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{doneCount}/{subtasks.length}</span>}
          </div>
          {subtasks.length > 0 && (
            <div style={{ width: '100%', height: 3, borderRadius: 99, background: 'var(--border-subtle)', overflow: 'hidden', marginBottom: 2 }}>
              <div style={{ height: '100%', width: `${subtasks.length ? (doneCount / subtasks.length * 100) : 0}%`, background: 'var(--success)', borderRadius: 99, transition: 'width 150ms' }} />
            </div>
          )}
          <div>
            {subtasks.map(s => (
              <SubtaskRow key={s.id} sub={s}
                onToggle={(sub) => toggleSub.mutate({ id: sub.id, done: !sub.done })}
                onDelete={(id) => deleteSub.mutate(id)} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input value={newSub} onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSub()}
              placeholder="Добавить подзадачу…" style={fieldSx} />
            <Button variant="secondary" size="sm" onClick={addSub} style={{ opacity: newSub.trim() ? 1 : 0.5, flex: 'none' }}>Добавить</Button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          {confirmDel ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Удалить задачу?</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>Отмена</Button>
              <Button variant="danger" size="sm" onClick={() => { del.mutate(task.id); onClose(); }}>Удалить</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" icon="trash" onClick={() => setConfirmDel(true)}>Удалить задачу</Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  );
}

/* ---- Task card ---- */
function KanbanCard({ task, onDragStart, onOpen }) {
  const toggle = useToggleTask();
  const move   = useMoveTask();

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onClick={() => onOpen(task)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = ''; }}
      style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, userSelect: 'none', transition: 'border-color 120ms, box-shadow 150ms' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span onClick={e => { e.stopPropagation(); toggle.mutate({ id: task.id, done: !task.done }); }} style={{ cursor: 'pointer', marginTop: 1 }}>
          <Checkbox checked={task.done} priority={task.priority} />
        </span>
        <span style={{ fontSize: 13, color: task.done ? 'var(--text-muted)' : 'var(--text)', lineHeight: 1.4, flex: 1, textDecoration: task.done ? 'line-through' : 'none' }}>
          {task.title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {task.project && <ProjectTag projectToken={task.project.color_token} label={task.project.name} size="sm" />}
        {task.due_at && (
          <span style={{ fontSize: 11, color: new Date(task.due_at) < new Date() && !task.done ? 'var(--danger)' : 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {new Date(task.due_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {task.stuck && <Badge tone="danger" icon="flag">застряло</Badge>}
      </div>
    </div>
  );
}

/* ---- Column ---- */
function KanbanColumn({ col, tasks, dragId, onDragStart, onDrop, onAddClick, onOpenTask }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      style={{ width: 280, flex: 'none', display: 'flex', flexDirection: 'column' }}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop(col.id); }}
    >
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 10px', marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: `var(${col.color})` }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{col.title}</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{tasks.length}</span>
        <IconButton icon="plus" size="sm" onClick={() => onAddClick(col.id)} />
      </div>

      {/* Drop zone */}
      <div className="ws-scroll" style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 4,
        borderRadius: 10, padding: '4px',
        background: isDragOver ? 'color-mix(in oklab, var(--text) 3%, transparent)' : 'transparent',
        border: isDragOver ? '2px dashed var(--border)' : '2px dashed transparent',
        transition: 'background 120ms, border-color 120ms',
        minHeight: 120,
      }}>
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} onDragStart={onDragStart} onOpen={onOpenTask} />
        ))}
        <button
          onClick={() => onAddClick(col.id)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: 13, width: '100%', marginTop: 4, cursor: 'pointer', transition: 'border-color 120ms, color 120ms' }}
        >
          <Icon name="plus" size={14} /> Добавить
        </button>
      </div>
    </div>
  );
}

export default function Kanban() {
  const { data: allTasks = [], isLoading } = useKanbanTasks();
  const { data: projects = [] }           = useProjects();
  const move = useMoveTask();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dragId,     setDragId]     = useState(null);
  const [addModal,   setAddModal]   = useState(null); // status id
  const [filterProj, setFilterProj] = useState('');
  const [detailId,   setDetailId]   = useState(null); // open task id

  useEffect(() => {
    if (searchParams.get('new') === '1') setAddModal('todo');
  }, [searchParams]);

  const closeAddModal = () => {
    setAddModal(null);
    if (searchParams.get('new')) {
      const p = new URLSearchParams(searchParams);
      p.delete('new');
      setSearchParams(p, { replace: true });
    }
  };

  const filtered = filterProj ? allTasks.filter(t => t.project_id === filterProj) : allTasks;
  const detailTask = detailId ? allTasks.find(t => t.id === detailId) : null;

  const handleDrop = (status) => {
    if (dragId) {
      move.mutate({ id: dragId, kanban_status: status });
      setDragId(null);
    }
  };

  return (
    <>
      {addModal && <CreateTaskModal defaultStatus={addModal} onClose={closeAddModal} />}
      {detailTask && <TaskDetailModal task={detailTask} projects={projects} onClose={() => setDetailId(null)} />}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="Канбан"
            sub={isLoading ? '…' : `${allTasks.filter(t => !t.done).length} открытых`}
            right={<Button variant="ghost" size="sm" icon="filter">Фильтры</Button>}
          />

          {/* Project filter */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
            <button
              onClick={() => setFilterProj('')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: !filterProj ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)', color: !filterProj ? 'var(--text)' : 'var(--text-2)', border: `1px solid ${!filterProj ? 'var(--border)' : 'var(--border-subtle)'}` }}
            >
              Все проекты
            </button>
            {projects.map(p => (
              <button key={p.id} onClick={() => setFilterProj(p.id === filterProj ? '' : p.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: filterProj === p.id ? `color-mix(in oklab, var(${p.color_token}) 16%, transparent)` : 'var(--bg-elev-2)', color: filterProj === p.id ? `var(${p.color_token})` : 'var(--text-2)', border: `1px solid ${filterProj === p.id ? `color-mix(in oklab, var(${p.color_token}) 35%, transparent)` : 'var(--border-subtle)'}` }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 999, background: `var(${p.color_token})` }} />
                {p.name}
              </button>
            ))}
          </div>

          {/* Board */}
          <div className="ws-scroll" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '16px 16px 20px' }}>
            <div style={{ display: 'flex', gap: 12, height: '100%', minWidth: 'max-content' }}>
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  tasks={filtered.filter(t => t.kanban_status === col.id)}
                  dragId={dragId}
                  onDragStart={(id) => setDragId(id)}
                  onDrop={handleDrop}
                  onAddClick={(status) => setAddModal(status)}
                  onOpenTask={(task) => setDetailId(task.id)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
