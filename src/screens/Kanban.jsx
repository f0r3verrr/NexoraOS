import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, ProjectTag, Checkbox } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { useKanbanTasks, useMoveTask, useToggleTask, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks.js';
import { useKanbanColumns, useCreateKanbanColumn, useUpdateKanbanColumn, useDeleteKanbanColumn } from '../hooks/useKanbanColumns.js';
import { useProjects } from '../hooks/useProjects.js';
import { useSubtasks, useCreateSubtask, useToggleSubtask, useDeleteSubtask } from '../hooks/useSubtasks.js';
import { useIsCompact } from '../hooks/useViewport.js';

const DEFAULT_COLUMNS = [
  { id: 'backlog',     title: 'Бэклог',       color: '--text-muted' },
  { id: 'todo',        title: 'К выполнению',  color: '--info' },
  { id: 'in_progress', title: 'В работе',       color: '--p-openresto' },
  { id: 'review',      title: 'Ревью',          color: '--warn' },
  { id: 'done',        title: 'Готово',         color: '--success' },
];

const COL_COLORS = [
  '--text-muted', '--info', '--p-openresto', '--warn', '--success', '--danger',
];

/* ---- Create task modal ---- */
function CreateTaskModal({ defaultStatus, columns = DEFAULT_COLUMNS, onClose }) {
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 380, maxWidth: '100%', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
          Новая задача — {columns.find(c => c.id === defaultStatus)?.title}
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
function TaskDetailModal({ task, projects, columns = DEFAULT_COLUMNS, onClose }) {
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 480, maxWidth: '100%', boxSizing: 'border-box', maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
          {columns.map(col => {
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
function KanbanCard({ task, onDragStart, onOpen, columns }) {
  const toggle = useToggleTask();
  const move   = useMoveTask();
  const isCompact = useIsCompact();
  const [moveOpen, setMoveOpen] = useState(false);
  const moveRef = useRef(null);

  useEffect(() => {
    if (!moveOpen) return;
    const handler = (e) => { if (!moveRef.current?.contains(e.target)) setMoveOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moveOpen]);

  const otherColumns = (columns ?? []).filter(c => c.id !== task.kanban_status);

  return (
    <div
      draggable={!isCompact}
      onDragStart={() => onDragStart(task.id)}
      onClick={() => onOpen(task)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = ''; }}
      style={{ position: 'relative', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, userSelect: 'none', transition: 'border-color 120ms, box-shadow 150ms' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span onClick={e => { e.stopPropagation(); toggle.mutate({ id: task.id, done: !task.done }); }} style={{ cursor: 'pointer', marginTop: 1 }}>
          <Checkbox checked={task.done} priority={task.priority} />
        </span>
        <span style={{ fontSize: 13, color: task.done ? 'var(--text-muted)' : 'var(--text)', lineHeight: 1.4, flex: 1, textDecoration: task.done ? 'line-through' : 'none' }}>
          {task.title}
        </span>
        {/* На тач-экранах перетаскивание между колонками недоступно (HTML5 DnD
            не работает без мыши) — вместо этого кнопка "Переместить в…" */}
        {isCompact && (
          <div ref={moveRef} style={{ position: 'relative', flex: 'none' }}>
            <button onClick={e => { e.stopPropagation(); setMoveOpen(o => !o); }}
              style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', borderRadius: 6, background: moveOpen ? 'var(--bg-elev-3)' : 'transparent' }}>
              <Icon name="more" size={14} />
            </button>
            {moveOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 40, background: 'var(--bg-elev-3)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '5px 10px 6px', fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Переместить в</div>
                {otherColumns.map(c => (
                  <button key={c.id} onClick={() => { move.mutate({ id: task.id, kanban_status: c.id }); setMoveOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', background: 'transparent' }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: `var(${c.color})`, flex: 'none' }} />
                    {c.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
function KanbanColumn({ col, tasks, dragId, onDragStart, onDrop, onAddClick, onOpenTask, onRename, onDelete, columns }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [renaming,   setRenaming]   = useState(false);
  const [renameVal,  setRenameVal]  = useState(col.title);
  const [confirmDel, setConfirmDel] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) { setMenuOpen(false); setConfirmDel(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const saveRename = () => {
    const v = renameVal.trim();
    if (v && v !== col.title && onRename) onRename(v);
    setRenaming(false);
  };

  return (
    <div
      style={{ width: 280, flex: 'none', display: 'flex', flexDirection: 'column' }}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop(col.id); }}
    >
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 10px', marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: `var(${col.color})`, flex: 'none' }} />
        {renaming ? (
          <input
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={saveRename}
            onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') { setRenameVal(col.title); setRenaming(false); } }}
            autoFocus
            style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)', background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', outline: 'none' }}
          />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{col.title}</span>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{tasks.length}</span>
        <IconButton icon="plus" size="sm" onClick={() => onAddClick(col.id)} />
        {!col.isDefault && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setMenuOpen(o => !o); setConfirmDel(false); }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
              onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
              style={{ width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: menuOpen ? 'var(--bg-elev-2)' : 'transparent', cursor: 'pointer', flex: 'none' }}>
              <Icon name="more" size={14} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 40, background: 'var(--bg-elev-3)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <button
                  onClick={() => { setRenaming(true); setMenuOpen(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', background: 'transparent', cursor: 'pointer' }}>
                  <Icon name="edit" size={13} />
                  Переименовать
                </button>
                {confirmDel ? (
                  <div style={{ padding: '6px 10px 4px' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>Удалить колонку?<br /><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Задачи перейдут в Бэклог</span></div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { onDelete?.(); setMenuOpen(false); setConfirmDel(false); }}
                        style={{ flex: 1, height: 26, borderRadius: 5, background: 'var(--danger)', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Удалить</button>
                      <button onClick={() => setConfirmDel(false)}
                        style={{ flex: 1, height: 26, borderRadius: 5, background: 'var(--bg-elev-2)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer' }}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDel(true)}
                    onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 10%, transparent)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 13, color: 'var(--danger)', background: 'transparent', cursor: 'pointer' }}>
                    <Icon name="trash" size={13} />
                    Удалить колонку
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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
          <KanbanCard key={task.id} task={task} onDragStart={onDragStart} onOpen={onOpenTask} columns={columns} />
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

/* ---- Add column card ---- */
function AddColumnCard({ onCreate }) {
  const [open,  setOpen]  = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('--text-muted');

  const submit = () => {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), color_token: color });
    setTitle('');
    setColor('--text-muted');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        style={{
          width: 240, height: 48, flex: 'none', borderRadius: 10,
          border: '2px dashed var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          transition: 'border-color 120ms, color 120ms', alignSelf: 'flex-start',
        }}>
        <Icon name="plus" size={15} />
        Добавить колонку
      </button>
    );
  }

  return (
    <div style={{
      width: 280, flex: 'none', background: 'var(--bg-elev-2)',
      border: '1px solid var(--border)', borderRadius: 12,
      padding: 14, display: 'flex', flexDirection: 'column', gap: 12,
      alignSelf: 'flex-start',
    }}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        placeholder="Название колонки…"
        autoFocus
        style={{
          height: 34, padding: '0 10px',
          background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none',
        }}
      />
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Цвет</div>
        <div style={{ display: 'flex', gap: 7 }}>
          {COL_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} title={c}
              style={{
                width: 26, height: 26, borderRadius: 999, cursor: 'pointer',
                background: `var(${c})`,
                border: color === c ? '3px solid var(--bg-elev-2)' : '2px solid transparent',
                outline: `2px solid ${color === c ? `var(${c})` : 'transparent'}`,
                transition: 'outline 80ms',
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setTitle(''); }}>Отмена</Button>
        <Button variant="primary" size="sm" onClick={submit} style={{ flex: 1, opacity: title.trim() ? 1 : 0.5 }}>Создать</Button>
      </div>
    </div>
  );
}

/* ---- Filter helpers ---- */
function ToggleRow({ label, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '6px 8px', borderRadius: 7, background: 'transparent',
        cursor: 'pointer', transition: 'background 80ms',
      }}>
      <span style={{
        width: 30, height: 17, borderRadius: 99, flex: 'none', position: 'relative',
        background: checked ? 'var(--p-openresto)' : 'var(--bg-elev-1)',
        border: `1.5px solid ${checked ? 'var(--p-openresto)' : 'var(--border)'}`,
        transition: 'background 120ms, border-color 120ms',
      }}>
        <span style={{
          position: 'absolute', top: 2, width: 11, height: 11, borderRadius: 999,
          left: checked ? 14 : 2,
          background: checked ? 'white' : 'var(--text-muted)',
          transition: 'left 120ms',
        }} />
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
    </button>
  );
}

function FilterPanel({ triggerRef, onClose, filterPrios, onTogglePrio, showDone, setShowDone, overdueOnly, setOverdueOnly, onClear }) {
  const popupRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!triggerRef.current || !popupRef.current) return;
    const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
    const r = triggerRef.current.getBoundingClientRect();
    const popW = popupRef.current.offsetWidth;
    const vw = window.innerWidth / zoom;
    let left = r.right / zoom - popW;
    left = Math.max(8, Math.min(left, vw - popW - 8));
    setPos({ top: r.bottom / zoom + 6, left });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current?.contains(e.target)) return;
      if (triggerRef.current?.contains(e.target)) return;
      onClose();
    };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  const PRIOS = [
    { key: '1',    label: '🔴 p1 — срочно' },
    { key: '2',    label: '🟡 p2 — важно' },
    { key: '3',    label: '🔵 p3 — обычно' },
    { key: 'none', label: 'Без приоритета' },
  ];

  const hasActive = filterPrios.size > 0 || !showDone || overdueOnly;

  const sectionLabel = (text) => (
    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px 6px' }}>
      {text}
    </div>
  );

  return createPortal(
    <div ref={popupRef} style={{
      position: 'fixed', top: pos.top, left: pos.left,
      width: 240, zIndex: 9999,
      background: 'var(--bg-elev-3)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      boxShadow: '0 16px 48px -12px rgba(0,0,0,0.65), 0 4px 16px rgba(0,0,0,0.25)',
      padding: '10px 8px',
    }}>
      {sectionLabel('Приоритет')}
      {PRIOS.map(p => {
        const active = filterPrios.has(p.key);
        return (
          <button key={p.key} onClick={() => onTogglePrio(p.key)}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '6px 8px', borderRadius: 7, fontSize: 13,
              background: active ? 'color-mix(in oklab, var(--p-openresto) 10%, var(--bg-elev-2))' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-2)',
              cursor: 'pointer', transition: 'background 80ms', textAlign: 'left',
            }}>
            <span style={{
              width: 16, height: 16, borderRadius: 4, flex: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? 'color-mix(in oklab, var(--p-openresto) 20%, transparent)' : 'var(--bg-elev-2)',
              border: `1px solid ${active ? 'color-mix(in oklab, var(--p-openresto) 50%, transparent)' : 'var(--border-subtle)'}`,
            }}>
              {active && <Icon name="check" size={10} style={{ color: 'var(--p-openresto)' }} />}
            </span>
            {p.label}
          </button>
        );
      })}

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />
      {sectionLabel('Задачи')}
      <ToggleRow label="Показать выполненные" checked={showDone}    onChange={setShowDone} />
      <ToggleRow label="Только просроченные"  checked={overdueOnly} onChange={setOverdueOnly} />

      {hasActive && (
        <>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />
          <button onClick={onClear}
            onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 8%, transparent)'; e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '6px 8px', borderRadius: 7, fontSize: 12, color: 'var(--text-muted)',
              background: 'transparent', cursor: 'pointer', transition: 'all 80ms',
            }}>
            <Icon name="x" size={12} />
            Сбросить фильтры
          </button>
        </>
      )}
    </div>,
    document.body
  );
}

export default function Kanban() {
  const { data: allTasks = [], isLoading } = useKanbanTasks();
  const { data: projects = [] }           = useProjects();
  const { data: customCols = [] }         = useKanbanColumns();
  const createCol = useCreateKanbanColumn();
  const updateCol = useUpdateKanbanColumn();
  const deleteCol = useDeleteKanbanColumn();
  const move = useMoveTask();

  const allColumns = [
    ...DEFAULT_COLUMNS.map(c => ({ ...c, isDefault: true })),
    ...customCols.map(c => ({ id: c.id, title: c.title, color: c.color_token, isDefault: false })),
  ];
  const [searchParams, setSearchParams] = useSearchParams();

  const [dragId,      setDragId]      = useState(null);
  const [addModal,    setAddModal]    = useState(null);
  const [filterProj,  setFilterProj]  = useState('');
  const [filterPrios, setFilterPrios] = useState(new Set());
  const [showDone,    setShowDone]    = useState(true);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [detailId,    setDetailId]    = useState(null);
  const filterBtnRef = useRef(null);

  const handleTogglePrio = (key) => {
    setFilterPrios(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setFilterPrios(new Set());
    setShowDone(true);
    setOverdueOnly(false);
  };

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

  const filterCol = searchParams.get('col') ?? '';

  const now = new Date();
  const filtered = allTasks.filter(t => {
    if (filterProj && t.project_id !== filterProj) return false;
    if (filterPrios.size > 0) {
      const pk = t.priority != null ? String(t.priority) : 'none';
      if (!filterPrios.has(pk)) return false;
    }
    if (!showDone && t.done) return false;
    if (overdueOnly && (t.done || !t.due_at || new Date(t.due_at) >= now)) return false;
    return true;
  });
  const detailTask = detailId ? allTasks.find(t => t.id === detailId) : null;

  const visibleColumns = filterCol ? allColumns.filter(c => c.id === filterCol) : allColumns;

  const handleDrop = (status) => {
    if (dragId) {
      move.mutate({ id: dragId, kanban_status: status });
      setDragId(null);
    }
  };

  return (
    <>
      {addModal && <CreateTaskModal defaultStatus={addModal} columns={allColumns} onClose={closeAddModal} />}
      {detailTask && <TaskDetailModal task={detailTask} projects={projects} columns={allColumns} onClose={() => setDetailId(null)} />}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="Канбан"
            sub={isLoading ? '…' : `${allTasks.filter(t => !t.done).length} открытых`}
            right={(() => {
              const activeCount = filterPrios.size + (!showDone ? 1 : 0) + (overdueOnly ? 1 : 0);
              return (
                <>
                  <div ref={filterBtnRef}>
                    <button
                      onClick={() => setFilterOpen(o => !o)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        height: 32, padding: '0 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        background: filterOpen || activeCount > 0
                          ? 'color-mix(in oklab, var(--p-openresto) 12%, var(--bg-elev-2))'
                          : 'var(--bg-elev-1)',
                        color: activeCount > 0 ? 'var(--text)' : 'var(--text-2)',
                        border: `1px solid ${filterOpen || activeCount > 0
                          ? 'color-mix(in oklab, var(--p-openresto) 35%, transparent)'
                          : 'var(--border-subtle)'}`,
                        cursor: 'pointer', transition: 'all 120ms',
                      }}>
                      <Icon name="filter" size={14} />
                      Фильтры
                      {activeCount > 0 && (
                        <span style={{
                          width: 18, height: 18, borderRadius: 999, marginLeft: 2,
                          background: 'var(--p-openresto)', color: 'white',
                          fontSize: 10, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>{activeCount}</span>
                      )}
                    </button>
                  </div>
                  {filterOpen && (
                    <FilterPanel
                      triggerRef={filterBtnRef}
                      onClose={() => setFilterOpen(false)}
                      filterPrios={filterPrios}
                      onTogglePrio={handleTogglePrio}
                      showDone={showDone}
                      setShowDone={setShowDone}
                      overdueOnly={overdueOnly}
                      setOverdueOnly={setOverdueOnly}
                      onClear={clearFilters}
                    />
                  )}
                </>
              );
            })()}
          />

          {/* Project + column filter strip */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto', alignItems: 'center' }}>
            <button
              onClick={() => setFilterProj('')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: !filterProj ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)', color: !filterProj ? 'var(--text)' : 'var(--text-2)', border: `1px solid ${!filterProj ? 'var(--border)' : 'var(--border-subtle)'}`, flex: 'none' }}
            >
              Все проекты
            </button>
            {projects.map(p => (
              <button key={p.id} onClick={() => setFilterProj(p.id === filterProj ? '' : p.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, flex: 'none', background: filterProj === p.id ? `color-mix(in oklab, var(${p.color_token}) 16%, transparent)` : 'var(--bg-elev-2)', color: filterProj === p.id ? `var(${p.color_token})` : 'var(--text-2)', border: `1px solid ${filterProj === p.id ? `color-mix(in oklab, var(${p.color_token}) 35%, transparent)` : 'var(--border-subtle)'}` }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 999, background: `var(${p.color_token})` }} />
                {p.name}
              </button>
            ))}
            {filterCol && (() => {
              const col = allColumns.find(c => c.id === filterCol);
              return col ? (
                <>
                  <div style={{ width: 1, height: 18, background: 'var(--border)', flex: 'none', margin: '0 2px' }} />
                  <button
                    onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.delete('col'); return n; }, { replace: true })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, flex: 'none', background: `color-mix(in oklab, var(${col.color}) 14%, transparent)`, color: `var(${col.color})`, border: `1px solid color-mix(in oklab, var(${col.color}) 35%, transparent)` }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: `var(${col.color})` }} />
                    {col.title}
                    <span style={{ fontSize: 14, lineHeight: 1, marginLeft: 2, opacity: 0.7 }}>×</span>
                  </button>
                </>
              ) : null;
            })()}
          </div>

          {/* Board — horizontal scroll */}
          <div className="ws-scroll" style={{
            flex: 1,
            minHeight: 0,       /* critical: lets flex child shrink so scroll triggers instead of expanding */
            overflow: 'auto',
            paddingTop: 16,
            paddingBottom: 20,
          }}>
            <div style={{
              display: 'flex',
              gap: 12,
              height: '100%',
              minWidth: 'max-content',  /* forces container wide enough to trigger h-scroll */
              paddingLeft: 16,
              paddingRight: 16,         /* moved here so right pad is visible after scrolling to end */
            }}>
              {visibleColumns.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  columns={allColumns}
                  tasks={filtered.filter(t => t.kanban_status === col.id)}
                  dragId={dragId}
                  onDragStart={(id) => setDragId(id)}
                  onDrop={handleDrop}
                  onAddClick={(status) => setAddModal(status)}
                  onOpenTask={(task) => setDetailId(task.id)}
                  onRename={col.isDefault ? undefined : (title) => updateCol.mutate({ id: col.id, title })}
                  onDelete={col.isDefault ? undefined : () => deleteCol.mutate(col.id)}
                />
              ))}
              {!filterCol && <AddColumnCard onCreate={(opts) => createCol.mutate(opts)} />}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
