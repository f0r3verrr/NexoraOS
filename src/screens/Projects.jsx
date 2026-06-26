import { useState, useRef } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, Progress } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects.js';
import { useAllTasks } from '../hooks/useTasks.js';
import { ru } from '../lib/plural.js';

const AREAS   = ['Работа', 'Подработки', 'Жизнь', 'Личное'];
const COLORS  = ['--p-openresto','--p-youmin','--p-diploma','--p-sites','--p-bots','--p-girl','--p-family','--p-car','--p-home','--p-health'];
const AREA_ORDER = ['Работа', 'Подработки', 'Жизнь', 'Личное'];

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
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Введи название проекта'); return; }
    if (isEdit) await update.mutateAsync({ id: project.id, name: name.trim(), color_token: color, area });
    else        await create.mutateAsync({ name: name.trim(), color_token: color, area });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxSizing: 'border-box', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{isEdit ? 'Редактировать проект' : 'Новый проект'}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Название *</label>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Например: OpenResto MVP" autoFocus
            style={{ height: 38, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Цвет</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 8, background: `var(${c})`, border: `3px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Область</label>
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

        {/* Preview */}
        <div style={{ padding: '10px 14px', background: `color-mix(in oklab, var(${color}) 8%, var(--bg-elev-1))`, border: `1px solid color-mix(in oklab, var(${color}) 30%, var(--border-subtle))`, borderLeft: `3px solid var(${color})`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${color})`, flex: 'none' }} />
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

/* ---- Project card ---- */
function ProjectCard({ project, taskStats, onEdit }) {
  const del = useDeleteProject();
  const { total = 0, done = 0 } = taskStats ?? {};
  const progress = total ? Math.round(done / total * 100) : 0;

  return (
    <div style={{
      background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12,
      borderLeft: `3px solid var(${project.color_token})`,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 120ms',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = `var(${project.color_token})`}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${project.color_token})`, flex: 'none', marginTop: 4 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{project.area}</div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconButton icon="edit"  size="sm" onClick={onEdit} title="Редактировать" />
          <IconButton icon="trash" size="sm" onClick={() => { if (confirm(`Архивировать «${project.name}»?`)) del.mutate(project.id); }} title="В архив" style={{ color: 'var(--danger)' }} />
        </div>
      </div>

      {total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Progress value={progress} color={`var(${project.color_token})`} height={4} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            <span>{done}/{total} задач</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {total === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет задач</div>
      )}
    </div>
  );
}

/* ---- Main ---- */
export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks    = [] }            = useAllTasks();
  const [modal, setModal] = useState(null); // null=closed, false=new, obj=edit

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

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="Проекты"
            sub={isLoading ? '…' : ru.projects(projects.length)}
            right={<>
              <Button variant="secondary" size="sm" icon="plus" onClick={() => setModal(false)}>Новый проект</Button>
            </>}
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
                          onEdit={() => setModal(p)}
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
