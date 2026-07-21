import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, Progress } from '../components/primitives.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { useProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects.js';
import { useFiles, useUploadFile, useDeleteFile } from '../hooks/useFiles.js';
import { supabase } from '../lib/supabase.js';

const COLORS  = ['--p-openresto','--p-youmin','--p-diploma','--p-sites','--p-bots','--p-girl','--p-family','--p-car','--p-home','--p-health'];
const AREAS   = ['Работа', 'Подработки', 'Жизнь', 'Личное'];

const STATUS_LABELS = { active: 'Активный', paused: 'Пауза', completed: 'Завершён' };
const STATUS_COLORS = { active: 'success', paused: 'warn', completed: 'info' };

const EMOJI_LIST = [
  '📁','📂','🗂️','📋','📊','📈','📉','💼','🏢','🎯',
  '🚀','⚡','🔥','💡','🌟','✨','🎨','🖥️','📱','🤝',
  '🌐','📝','🔑','💰','📦','🛠️','⚙️','🎓','🏆','❤️',
  '🌿','🏠','🚗','✈️','🎵','📸','🔬','🧪','🎮','🌈',
];

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(s => !s)}
        style={{ width: 56, height: 38, borderRadius: 8, background: 'var(--bg-elev-1)', border: `1px solid ${open ? 'var(--border-strong)' : 'var(--border-subtle)'}`, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {value || '📁'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 60, background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-2)', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(8, 32px)', gap: 2 }}>
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            style={{ width: 32, height: 32, borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', background: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>✕</button>
          {EMOJI_LIST.map(em => (
            <button type="button" key={em} onClick={() => { onChange(em); setOpen(false); }}
              style={{ width: 32, height: 32, borderRadius: 6, fontSize: 18, background: value === em ? 'var(--bg-elev-3)' : 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
              onMouseLeave={e => e.currentTarget.style.background = value === em ? 'var(--bg-elev-3)' : 'none'}>{em}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

function fmtSize(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} Б`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} КБ`;
  return `${(b / 1024 / 1024).toFixed(1)} МБ`;
}

function fmtRelDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso), diff = Date.now() - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн`;
  return `${Math.floor(days / 7)} нед`;
}

function getExt(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

const EXT_COLOR = {
  pdf: '--p-diploma', doc: '--p-openresto', docx: '--p-openresto',
  xls: '--p-health', xlsx: '--p-health',
  jpg: '--p-girl', jpeg: '--p-girl', png: '--p-girl', gif: '--p-girl', webp: '--p-girl',
  md: '--p-bots', txt: '--p-bots',
  zip: '--p-car', rar: '--p-car',
};

/* ---- Edit modal ---- */
function EditModal({ project, onClose }) {
  const mdb = useRef(false);
  const update = useUpdateProject();
  const [name,  setName]  = useState(project.name ?? '');
  const [color, setColor] = useState(project.color_token ?? '--p-openresto');
  const [area,  setArea]  = useState(project.area ?? 'Личное');
  const [emoji, setEmoji] = useState(project.emoji ?? '');
  const [desc,  setDesc]  = useState(project.description ?? '');
  const [err,   setErr]   = useState('');

  const submit = async () => {
    if (!name.trim()) { setErr('Введи название'); return; }
    await update.mutateAsync({ id: project.id, name: name.trim(), color_token: color, area, emoji: emoji || null, description: desc || null });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={e => { mdb.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mdb.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Редактировать проект</div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Emoji</label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Название *</label>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus
              style={{ height: 38, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Описание</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Краткое описание проекта…" rows={3}
            style={{ padding: '8px 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', resize: 'none', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Цвет</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: 7, background: `var(${c})`, border: `3px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Область</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {AREAS.map(a => (
              <button key={a} onClick={() => setArea(a)} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: area === a ? 500 : 400,
                background: area === a ? `color-mix(in oklab, var(${color}) 16%, var(--bg-elev-3))` : 'var(--bg-elev-1)',
                border: `1px solid ${area === a ? `color-mix(in oklab, var(${color}) 45%, transparent)` : 'var(--border-subtle)'}`,
                color: area === a ? 'var(--text)' : 'var(--text-2)',
              }}>{a}</button>
            ))}
          </div>
        </div>

        {err && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit}>Сохранить</Button>
        </div>
      </div>
    </div>
  );
}

/* ---- Archive confirm modal ---- */
function ArchiveModal({ name, onConfirm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Архивировать проект?</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>«{name}» будет скрыт из списка. Задачи, заметки и файлы сохранятся.</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="danger" onClick={onConfirm}>Архивировать</Button>
        </div>
      </div>
    </div>
  );
}

/* ---- Tasks Tab ---- */
function TasksTab({ projectId }) {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks')
        .select('id, title, done, priority, due_at, created_at')
        .eq('project_id', projectId)
        .order('done', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleDone = async (task) => {
    await supabase.from('tasks').update({ done: !task.done, done_at: !task.done ? new Date().toISOString() : null }).eq('id', task.id);
    qc.invalidateQueries({ queryKey: ['tasks', 'project', projectId] });
    qc.invalidateQueries({ queryKey: ['tasks'] });
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('tasks').insert({ user_id: user.id, project_id: projectId, title: newTitle.trim() });
    setNewTitle('');
    qc.invalidateQueries({ queryKey: ['tasks', 'project', projectId] });
    qc.invalidateQueries({ queryKey: ['tasks'] });
  };

  const todo = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);
  const [showDone, setShowDone] = useState(false);

  const PRIORITY_COLOR = { 1: 'var(--danger)', 2: 'var(--warn)', 3: 'var(--text-3)' };

  const TaskRow = ({ task }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'transparent', transition: 'background 80ms' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <button onClick={() => toggleDone(task)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? 'var(--success)' : 'var(--border-strong)'}`, background: task.done ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', cursor: 'pointer' }}>
        {task.done && <Icon name="check" size={11} style={{ color: 'var(--bg)' }} />}
      </button>
      <span style={{ flex: 1, fontSize: 14, color: task.done ? 'var(--text-3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
      {task.priority && <span style={{ width: 6, height: 6, borderRadius: 2, background: PRIORITY_COLOR[task.priority], flex: 'none' }} />}
      {task.due_at && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDate(task.due_at)}</span>}
    </div>
  );

  return (
    <div>
      {/* Add task input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input ref={inputRef} value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Новая задача… (Enter)"
          style={{ flex: 1, height: 36, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }} />
        <Button variant="secondary" size="sm" icon="plus" onClick={addTask}>Добавить</Button>
      </div>

      <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Загрузка…</div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Нет задач — создай первую выше</div>
        ) : (
          <>
            {todo.map(t => <TaskRow key={t.id} task={t} />)}
            {done.length > 0 && (
              <>
                <button onClick={() => setShowDone(s => !s)} style={{ width: '100%', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', background: 'var(--bg-elev-2)', borderTop: todo.length > 0 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
                  <Icon name={showDone ? 'chevron_down' : 'chevron_right'} size={12} />
                  Выполнено ({done.length})
                </button>
                {showDone && done.map(t => <TaskRow key={t.id} task={t} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Notes Tab ---- */
function NotesTab({ projectId }) {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', 'project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('notes')
        .select('id, title, body, pinned, updated_at')
        .eq('project_id', projectId)
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const stripMd = t => t.replace(/#{1,6}\s/g, '').replace(/\*\*|__/g, '').replace(/[*_~`>]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/^-\s/gm, '').trim();

  if (isLoading) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка…</div>;
  if (notes.length === 0) return (
    <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Icon name="note" size={28} style={{ color: 'var(--text-muted)' }} />
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Нет заметок для этого проекта</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Открой страницу Заметок и прикрепи заметку к проекту</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
      {notes.map(n => (
        <div key={n.id} style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {n.pinned && <Icon name="star_filled" size={12} style={{ color: '#F5C518', flex: 'none' }} />}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{n.title || 'Без названия'}</span>
          </div>
          {n.body && <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{stripMd(n.body)}</div>}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{fmtRelDate(n.updated_at)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---- Files Tab ---- */
function FilesTab({ projectId }) {
  const folder = `projects/${projectId}`;
  const { data: result = { items: [], bucketMissing: false }, isLoading } = useFiles(folder);
  const { items = [], bucketMissing } = result;
  const upload = useUploadFile();
  const deleteFile = useDeleteFile();
  const fileInput = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await upload.mutateAsync({ file, folder }); }
    catch (err) { alert(`Ошибка загрузки: ${err?.message ?? err}`); }
    e.target.value = '';
  };

  if (bucketMissing) return (
    <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      Создай бакет <code>user-files</code> в Supabase Storage
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <input ref={fileInput} type="file" style={{ display: 'none' }} onChange={handleUpload} />
        <Button variant="secondary" size="sm" icon="paperclip" onClick={() => fileInput.current?.click()}>Загрузить файл</Button>
      </div>
      <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Загрузка…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <Icon name="file" size={24} style={{ color: 'var(--text-muted)' }} />
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>Нет файлов — загрузи первый</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 80px 80px 60px', padding: '8px 14px', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
              <div /><div>Имя</div><div>Размер</div><div>Добавлен</div><div />
            </div>
            {items.map(f => {
              const ext = getExt(f.name);
              const color = EXT_COLOR[ext] ?? '--text-3';
              const displayName = f.name.replace(/^\d{10,}_/, '');
              return (
                <div key={f.id ?? f.name}
                  style={{ display: 'grid', gridTemplateColumns: '28px 1fr 80px 80px 60px', padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', background: 'transparent', transition: 'background 80ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.querySelectorAll('.fa').forEach(b => b.style.opacity = '1'); }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.querySelectorAll('.fa').forEach(b => b.style.opacity = '0'); }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: `color-mix(in oklab, var(${color}) 14%, transparent)`, color: `var(${color})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="file" size={12} />
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }} title={displayName}>{displayName}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtSize(f.metadata?.size)}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtRelDate(f.created_at)}</span>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <button className="fa touch-reveal" onClick={() => { if (!f.url) return; const a = document.createElement('a'); a.href = f.url; a.download = displayName; a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                      style={{ opacity: 0, transition: 'opacity 120ms', width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)' }}>
                      <Icon name="download" size={11} />
                    </button>
                    <button className="fa touch-reveal" onClick={() => deleteFile.mutateAsync(f.fullPath)}
                      style={{ opacity: 0, transition: 'opacity 120ms', width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)' }}>
                      <Icon name="trash" size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Contacts Tab ---- */
function ContactsTab({ projectId }) {
  const STATUS_TONE = { 'Новый': 'neutral', 'В работе': 'info', 'Готово': 'success', 'Переговоры': 'warn', 'Архив': 'neutral' };

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', 'project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts')
        .select('id, name, email, phone, status')
        .eq('project_id', projectId)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка…</div>;
  if (contacts.length === 0) return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      <Icon name="users" size={24} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
      <div>Нет контактов для этого проекта</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {contacts.map(c => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-elev-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', flex: 'none' }}>
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{c.name}</div>
            {(c.email || c.phone) && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{c.email || c.phone}</div>}
          </div>
          <Badge tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Badge>
        </div>
      ))}
    </div>
  );
}

/* ---- Finances Tab ---- */
function FinancesTab({ projectId }) {
  const STATUS_TONE = { 'Новый': 'neutral', 'В работе': 'info', 'Готово': 'success', 'Переговоры': 'warn' };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', 'project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders')
        .select('id, description, amount, status, paid, deadline, contact:contacts(id,name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка…</div>;

  const total   = orders.reduce((s, o) => s + Number(o.amount), 0);
  const paid    = orders.filter(o => o.paid).reduce((s, o) => s + Number(o.amount), 0);
  const waiting = total - paid;

  const fmtMoney = (n) => n.toLocaleString('ru', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

  if (orders.length === 0) return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      <Icon name="wallet" size={24} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
      <div>Нет заказов для этого проекта</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {[{ l: 'Всего', v: fmtMoney(total), c: 'var(--text)' }, { l: 'Получено', v: fmtMoney(paid), c: 'var(--success)' }, { l: 'Ожидает', v: fmtMoney(waiting), c: 'var(--warn)' }].map(s => (
          <div key={s.l} style={{ flex: 1, padding: '12px 14px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{s.l}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: s.c, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {orders.map(o => (
          <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.description}</div>
              {o.contact?.name && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{o.contact.name}</div>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: o.paid ? 'var(--success)' : 'var(--text)', whiteSpace: 'nowrap' }}>{fmtMoney(Number(o.amount))}</div>
            <Badge tone={STATUS_TONE[o.status] ?? 'neutral'}>{o.status}</Badge>
            {o.paid && <Badge tone="success">Оплачен</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Main ---- */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const archiveProject = useDeleteProject();

  const [tab, setTab] = useState('tasks');
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const { data: taskStats = { total: 0, done: 0 } } = useQuery({
    queryKey: ['tasks', 'stats', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('done').eq('project_id', id);
      if (error) throw error;
      const total = data.length, done = data.filter(t => t.done).length;
      return { total, done };
    },
    enabled: !!id,
  });

  const { data: counts = {} } = useQuery({
    queryKey: ['project_counts', id],
    queryFn: async () => {
      const [{ count: notes }, { count: contacts }, { count: orders }] = await Promise.all([
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('project_id', id),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('project_id', id),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('project_id', id),
      ]);
      return { notes: notes ?? 0, contacts: contacts ?? 0, orders: orders ?? 0 };
    },
    enabled: !!id,
  });

  const setStatus = async (status) => {
    await updateProject.mutateAsync({ id, status });
    setStatusOpen(false);
  };

  const handleArchive = async () => {
    await archiveProject.mutateAsync(id);
    navigate('/projects');
  };

  const progress = taskStats.total > 0 ? Math.round(taskStats.done / taskStats.total * 100) : 0;

  const TABS = [
    { key: 'tasks',    label: 'Задачи',   count: taskStats.total },
    { key: 'notes',    label: 'Заметки',  count: counts.notes },
    { key: 'files',    label: 'Файлы',    count: null },
    { key: 'contacts', label: 'Контакты', count: counts.contacts },
    { key: 'finances', label: 'Финансы',  count: counts.orders },
  ];

  if (isLoading) return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Загрузка…</main>
    </div>
  );

  if (!project) return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ fontSize: 15, color: 'var(--text-2)' }}>Проект не найден</div>
        <Button variant="secondary" onClick={() => navigate('/projects')}>← Проекты</Button>
      </main>
    </div>
  );

  return (
    <>
      {showEdit    && <EditModal project={project} onClose={() => setShowEdit(false)} />}
      {showArchive && <ArchiveModal name={project.name} onConfirm={handleArchive} onClose={() => setShowArchive(false)} />}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main className="ws-scroll" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

          {/* Top nav bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px 0', flexShrink: 0 }}>
            <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 6px', borderRadius: 6 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; }}>
              <Icon name="chevron_left" size={13} /> Проекты
            </button>
            <div style={{ flex: 1 }} />
            {/* Status dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setStatusOpen(s => !s)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: project.status === 'completed' ? 'var(--info)' : project.status === 'paused' ? 'var(--warn)' : 'var(--success)', flex: 'none' }} />
                {STATUS_LABELS[project.status ?? 'active']}
                <Icon name="chevron_down" size={11} />
              </button>
              {statusOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-2)', zIndex: 20, minWidth: 140, padding: 4 }}>
                  {Object.entries(STATUS_LABELS).map(([k, l]) => (
                    <button key={k} onClick={() => setStatus(k)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 13, color: 'var(--text)', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="secondary" size="sm" icon="edit" onClick={() => setShowEdit(true)}>Редактировать</Button>
            <IconButton icon="trash" size="sm" title="Архивировать" style={{ color: 'var(--danger)' }} onClick={() => setShowArchive(true)} />
          </div>

          {/* Project header */}
          <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
            <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderLeft: `4px solid var(${project.color_token})`, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {project.emoji && <span style={{ fontSize: 28, flex: 'none', lineHeight: 1 }}>{project.emoji}</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{project.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <Badge tone="neutral">{project.area}</Badge>
                    <Badge tone={STATUS_COLORS[project.status ?? 'active']}>{STATUS_LABELS[project.status ?? 'active']}</Badge>
                    {(project.start_date || project.end_date) && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {fmtDate(project.start_date)} {project.start_date && project.end_date ? '→' : ''} {fmtDate(project.end_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress */}
              {taskStats.total > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <Progress value={progress} color={`var(${project.color_token})`} height={5} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    <span>{taskStats.done}/{taskStats.total} задач</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {project.description && (
                <div className="md-preview" style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 2 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.description}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ padding: '8px 14px', fontSize: 13, fontWeight: tab === t.key ? 500 : 400, color: tab === t.key ? 'var(--text)' : 'var(--text-3)', background: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === t.key ? `var(${project.color_token})` : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', marginBottom: -1 }}>
                  {t.label}
                  {t.count != null && t.count > 0 && (
                    <span style={{ fontSize: 11, background: 'var(--bg-elev-3)', borderRadius: 10, padding: '1px 6px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, padding: '20px 28px 40px' }}>
            {tab === 'tasks'    && <TasksTab    projectId={id} />}
            {tab === 'notes'    && <NotesTab    projectId={id} />}
            {tab === 'files'    && <FilesTab    projectId={id} />}
            {tab === 'contacts' && <ContactsTab projectId={id} />}
            {tab === 'finances' && <FinancesTab projectId={id} />}
          </div>

        </main>
      </div>

      {/* Close status dropdown on outside click */}
      {statusOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 15 }} onClick={() => setStatusOpen(false)} />}
    </>
  );
}
