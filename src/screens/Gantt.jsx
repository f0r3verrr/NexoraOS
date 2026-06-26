import { useState, useRef } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Progress } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useProjects, useUpdateProject } from '../hooks/useProjects.js';
import { useAllTasks } from '../hooks/useTasks.js';

function isoDate(d) { return d.toISOString().slice(0, 10); }

function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

/* Map date to column index (0-based from today's Monday) */
function dateToCol(date, weekStart) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return Math.round((d - weekStart) / 86400000 / 7);
}

function getMonday(d = new Date()) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0,0,0,0);
  return m;
}

/* ---- Edit project dates modal ---- */
function EditDatesModal({ project, onClose }) {
  const mousedownOnBackdrop = useRef(false);
  const update = useUpdateProject();
  const [start, setStart] = useState(project.start_date ?? '');
  const [end,   setEnd]   = useState(project.end_date ?? '');

  const submit = async () => {
    await update.mutateAsync({ id: project.id, start_date: start || null, end_date: end || null });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 360, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(${project.color_token})`, display: 'inline-block', marginRight: 8 }} />
          {project.name}
        </div>
        {[
          { label: 'Начало', value: start, set: setStart },
          { label: 'Конец',  value: end,   set: setEnd },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{f.label}</label>
            <input type="date" value={f.value} onChange={e => f.set(e.target.value)}
              style={{ height: 36, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit}>Сохранить</Button>
        </div>
      </div>
    </div>
  );
}

export default function Gantt() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] }              = useAllTasks();
  const [weekOffset, setWeekOffset]       = useState(0);
  const [editProject, setEditProject]     = useState(null);

  const WEEKS = 16;
  const weekStart = getMonday(addDays(new Date(), weekOffset * 7));
  const weekHeaders = Array.from({ length: WEEKS }, (_, i) => {
    const d = addDays(weekStart, i * 7);
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  });

  const today = new Date();
  today.setHours(0,0,0,0);
  const todayWeekCol = dateToCol(today, weekStart);
  const colW = 64;
  const labelW = 240;
  const rowH = 56;

  // For each project: derive bar position from start_date/end_date or task dates
  function getProjectBar(p) {
    if (p.start_date && p.end_date) {
      return {
        start: dateToCol(p.start_date, weekStart),
        end:   dateToCol(p.end_date, weekStart) + 1,
      };
    }
    // Derive from tasks
    const pTasks = tasks.filter(t => t.project_id === p.id && t.due_at);
    if (pTasks.length === 0) return null;
    const minDue = new Date(Math.min(...pTasks.map(t => new Date(t.due_at))));
    const maxDue = new Date(Math.max(...pTasks.map(t => new Date(t.due_at))));
    return {
      start: dateToCol(minDue, weekStart),
      end:   dateToCol(maxDue, weekStart) + 1,
    };
  }

  // Task progress per project
  function getProgress(p) {
    const pTasks = tasks.filter(t => t.project_id === p.id);
    if (!pTasks.length) return 0;
    return Math.round(pTasks.filter(t => t.done).length / pTasks.length * 100);
  }

  return (
    <>
      {editProject && <EditDatesModal project={editProject} onClose={() => setEditProject(null)} />}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="Гантт"
            sub={`${projects.length} проектов · горизонт 16 недель`}
            right={<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconButton icon="chevron_left" onClick={() => setWeekOffset(w => w - 1)} />
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Сегодня</Button>
                <IconButton icon="chevron_right" onClick={() => setWeekOffset(w => w + 1)} />
              </div>
              <Button variant="secondary" size="sm" icon="plus">Проект</Button>
            </>}
          />

          <div className="ws-scroll" style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
            <div style={{ minWidth: labelW + WEEKS * colW + 32 }}>
              {/* Header */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 2 }}>
                <div style={{ width: labelW, flex: 'none', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Проект</div>
                {weekHeaders.map((w, i) => (
                  <div key={i} style={{ width: colW, flex: 'none', padding: '12px 6px', fontSize: 10, color: i === (weekOffset === 0 ? 0 : -weekOffset) ? 'var(--text)' : 'var(--text-3)', fontFamily: 'var(--font-mono)', textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', background: i === (0 - weekOffset) && weekOffset <= 0 ? 'color-mix(in oklab, var(--text) 2%, transparent)' : 'transparent', fontWeight: i === 0 && weekOffset === 0 ? 500 : 400 }}>{w}</div>
                ))}
              </div>

              {/* Rows */}
              {isLoading ? (
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3].map(i => <div key={i} style={{ height: rowH, borderRadius: 8, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style></div>)}
                </div>
              ) : projects.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  Нет проектов — создай первый в разделе «Проекты»
                </div>
              ) : (
                projects.map((p, pi) => {
                  const bar = getProjectBar(p);
                  const progress = getProgress(p);
                  const pTasks = tasks.filter(t => t.project_id === p.id);
                  return (
                    <div key={p.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', position: 'relative', background: 'transparent', transition: 'background 80ms' }}>
                      {/* Label */}
                      <div style={{ width: labelW, flex: 'none', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 4, background: 'transparent', cursor: 'pointer' }}
                        onClick={() => setEditProject(p)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: `var(${p.color_token})`, flex: 'none' }} />
                          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.area}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                            {pTasks.filter(t => t.done).length}/{pTasks.length} задач
                          </span>
                        </div>
                        <Progress value={progress} color={`var(${p.color_token})`} height={2} />
                      </div>

                      {/* Timeline */}
                      <div style={{ flex: 1, position: 'relative', height: rowH }}>
                        {/* Grid lines */}
                        {Array.from({ length: WEEKS }, (_, i) => (
                          <div key={i} style={{ position: 'absolute', left: i * colW, top: 0, bottom: 0, width: 1, background: 'var(--border-subtle)', opacity: 0.6 }} />
                        ))}

                        {/* Today marker */}
                        {todayWeekCol >= 0 && todayWeekCol < WEEKS && (
                          <div style={{ position: 'absolute', left: todayWeekCol * colW, top: 0, bottom: 0, width: 2, background: 'var(--danger)', opacity: 0.6, zIndex: 1 }} />
                        )}

                        {/* Project bar */}
                        {bar && bar.end > bar.start && (
                          <div style={{
                            position: 'absolute',
                            left: Math.max(0, bar.start) * colW + 4,
                            top: 14,
                            width: Math.min(WEEKS, bar.end - Math.max(0, bar.start)) * colW - 8,
                            height: 26,
                            borderRadius: 6,
                            background: `color-mix(in oklab, var(${p.color_token}) 20%, transparent)`,
                            border: `1px solid color-mix(in oklab, var(${p.color_token}) 45%, transparent)`,
                            overflow: 'hidden', display: 'flex', alignItems: 'center',
                          }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: `color-mix(in oklab, var(${p.color_token}) 55%, transparent)`, borderRadius: 5 }} />
                          </div>
                        )}

                        {/* No dates hint */}
                        {!bar && (
                          <div style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Нажми для добавления дат →
                          </div>
                        )}

                        {/* Task deadline dots */}
                        {tasks.filter(t => t.project_id === p.id && t.due_at).map(t => {
                          const col = dateToCol(t.due_at, weekStart);
                          if (col < 0 || col >= WEEKS) return null;
                          return (
                            <div key={t.id} title={t.title} style={{
                              position: 'absolute',
                              left: col * colW + colW / 2 - 3,
                              top: 44,
                              width: 6, height: 6, borderRadius: 999,
                              background: t.done ? 'var(--success)' : t.priority === 1 ? 'var(--danger)' : `var(${p.color_token})`,
                            }} />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Milestones row */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: labelW, flex: 'none', padding: '10px 20px', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--bg)' }}>Вехи</div>
                <div style={{ flex: 1, position: 'relative', height: 36 }}>
                  {projects.filter(p => p.end_date).map(p => {
                    const col = dateToCol(p.end_date, weekStart);
                    if (col < 0 || col >= WEEKS) return null;
                    return (
                      <div key={p.id} style={{ position: 'absolute', left: col * colW - 1, top: 0, bottom: 0, width: 2, background: `var(${p.color_token})`, opacity: 0.6 }}>
                        <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, color: `var(${p.color_token})`, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{p.name.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
