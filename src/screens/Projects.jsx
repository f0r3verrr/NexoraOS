import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, Progress } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects.js';
import { useAllTasks } from '../hooks/useTasks.js';
import { ru } from '../lib/plural.js';

const STATUS_LABELS = { active: 'Активный', paused: 'Пауза', completed: 'Завершён' };
const STATUS_COLORS = { active: 'success', paused: 'warn', completed: 'info' };

const AREAS   = ['Работа', 'Подработки', 'Жизнь', 'Личное'];
const COLORS  = ['--p-openresto','--p-youmin','--p-diploma','--p-sites','--p-bots','--p-girl','--p-family','--p-car','--p-home','--p-health'];
const AREA_ORDER = ['Работа', 'Подработки', 'Жизнь', 'Личное'];

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
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(s => !s)}
        style={{ width: 56, height: 38, borderRadius: 8, background: 'var(--bg-elev-1)', border: `1px solid ${open ? 'var(--border-strong)' : 'var(--border-subtle)'}`, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: value ? 'inherit' : 'var(--text-muted)' }}>
        {value || '📁'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 60, background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-2)', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(8, 32px)', gap: 2 }}>
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            style={{ width: 32, height: 32, borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', background: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            ✕
          </button>
          {EMOJI_LIST.map(em => (
            <button type="button" key={em} onClick={() => { onChange(em); setOpen(false); }}
              style={{ width: 32, height: 32, borderRadius: 6, fontSize: 18, background: value === em ? 'var(--bg-elev-3)' : 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
              onMouseLeave={e => e.currentTarget.style.background = value === em ? 'var(--bg-elev-3)' : 'none'}>
              {em}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Skeleton({ h = 14, w = '100%', r = 6 }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
}

/* ---- Create / Edit modal ---- */
function ProjectModal({ project, onClose }) {
  const mousedownOnBackdrop = useRef(false);
  const isEdit = !!project;
  const create = useCreateProject();
  const update = useUpdateProject();

  const [name,  setName]  = useState(project?.name        ?? '');
  const [color, setColor] = useState(project?.color_token ?? '--p-openresto');
  const [area,  setArea]  = useState(project?.area        ?? 'Личное');
  const [emoji, setEmoji] = useState(project?.emoji       ?? '');
  const [desc,  setDesc]  = useState(project?.description ?? '');
  const [status, setStatus] = useState(project?.status   ?? 'active');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Введи название проекта'); return; }
    const payload = { name: name.trim(), color_token: color, area, emoji: emoji || null, description: desc || null };
    if (isEdit) await update.mutateAsync({ id: project.id, ...payload, status });
    else        await create.mutateAsync(payload);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxSizing: 'border-box', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{isEdit ? 'Редактировать проект' : 'Новый проект'}</div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Emoji</label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Название *</label>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Например: OpenResto MVP" autoFocus
              style={{ height: 38, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Описание</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Краткое описание проекта…" rows={2}
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
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                fontWeight: area === a ? 500 : 400,
                background: area === a ? `color-mix(in oklab, var(${color}) 16%, var(--bg-elev-3))` : 'var(--bg-elev-1)',
                border: `1px solid ${area === a ? `color-mix(in oklab, var(${color}) 45%, transparent)` : 'var(--border-subtle)'}`,
                color: area === a ? 'var(--text)' : 'var(--text-2)',
              }}>{a}</button>
            ))}
          </div>
        </div>

        {isEdit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Статус</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(STATUS_LABELS).map(([k, l]) => (
                <button key={k} onClick={() => setStatus(k)} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  fontWeight: status === k ? 500 : 400,
                  background: status === k ? `color-mix(in oklab, var(${color}) 16%, var(--bg-elev-3))` : 'var(--bg-elev-1)',
                  border: `1px solid ${status === k ? `color-mix(in oklab, var(${color}) 45%, transparent)` : 'var(--border-subtle)'}`,
                  color: status === k ? 'var(--text)' : 'var(--text-2)',
                }}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div style={{ padding: '10px 14px', background: `color-mix(in oklab, var(${color}) 8%, var(--bg-elev-1))`, border: `1px solid color-mix(in oklab, var(${color}) 30%, var(--border-subtle))`, borderLeft: `3px solid var(${color})`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          {emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}
          <span style={{ fontSize: 13, color: name ? 'var(--text)' : 'var(--text-muted)', fontWeight: 500 }}>{name || 'Название проекта'}</span>
          <Badge tone="neutral">{area}</Badge>
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit} style={{ opacity: name.trim() ? 1 : 0.5 }}>
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
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

/* ---- Project card ---- */
function ProjectCard({ project, taskStats, onEdit, onArchive }) {
  const navigate = useNavigate();
  const { total = 0, done = 0 } = taskStats ?? {};
  const progress = total ? Math.round(done / total * 100) : 0;

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{
        background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12,
        borderLeft: `3px solid var(${project.color_token})`,
        padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'border-color 120ms, box-shadow 120ms', cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `var(${project.color_token})`; e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = ''; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {project.emoji
          ? <span style={{ fontSize: 18, flex: 'none', lineHeight: 1, marginTop: 2 }}>{project.emoji}</span>
          : <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${project.color_token})`, flex: 'none', marginTop: 5 }} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{project.area}</span>
            {project.status && project.status !== 'active' && (
              <Badge tone={STATUS_COLORS[project.status]}>{STATUS_LABELS[project.status]}</Badge>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
          <IconButton icon="edit"  size="sm" onClick={onEdit} title="Редактировать" />
          <IconButton icon="trash" size="sm" onClick={onArchive} title="В архив" style={{ color: 'var(--danger)' }} />
        </div>
      </div>

      {project.description && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>
          {project.description}
        </div>
      )}

      {total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Progress value={progress} color={`var(${project.color_token})`} height={4} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            <span>{done}/{total} задач</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {total === 0 && !project.description && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет задач</div>
      )}
    </div>
  );
}

/* ---- Main ---- */
export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks    = [] }            = useAllTasks();
  const del = useDeleteProject();
  const [modal, setModal]         = useState(null); // null=closed, false=new, obj=edit
  const [archiving, setArchiving] = useState(null); // project to archive
  const [searchParams, setSearchParams] = useSearchParams();

  // Open create modal when ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModal(false);
      setSearchParams(p => { p.delete('new'); return p; }, { replace: true });
    }
  }, [searchParams]);

  // Task stats per project
  const taskStats = tasks.reduce((acc, t) => {
    if (!t.project_id) return acc;
    if (!acc[t.project_id]) acc[t.project_id] = { total: 0, done: 0 };
    acc[t.project_id].total++;
    if (t.done) acc[t.project_id].done++;
    return acc;
  }, {});

  // Group by area
  const grouped = projects.reduce((acc, p) => {
    const a = p.area || 'Личное';
    if (!acc[a]) acc[a] = [];
    acc[a].push(p);
    return acc;
  }, {});
  const areas = [...new Set([...AREA_ORDER, ...Object.keys(grouped)])].filter(a => grouped[a]);

  return (
    <>
      {modal !== null && <ProjectModal project={modal || null} onClose={() => setModal(null)} />}
      {archiving && (
        <ArchiveModal
          name={archiving.name}
          onConfirm={() => { del.mutate(archiving.id); setArchiving(null); }}
          onClose={() => setArchiving(null)}
        />
      )}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="Проекты"
            sub={isLoading ? '…' : ru.projects(projects.length)}
          />

          <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 32px' }}>
            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Skeleton h={15} w="70%" /><Skeleton h={11} w="30%" /><Skeleton h={4} />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 80 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-elev-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="briefcase" size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-2)' }}>Нет проектов</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Создай первый проект чтобы начать</span>
                </div>
                <Button variant="primary" icon="plus" onClick={() => setModal(false)}>Новый проект</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {areas.map(area => (
                  <div key={area}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{area}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{grouped[area].length}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                      {grouped[area].map(p => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          taskStats={taskStats[p.id]}
                          onEdit={e => { e?.stopPropagation?.(); setModal(p); }}
                          onArchive={e => { e?.stopPropagation?.(); setArchiving(p); }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
