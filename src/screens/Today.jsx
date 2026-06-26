import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, ProjectTag, Checkbox, Tabs, Kbd } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useTodayTasks, useUndatedTasks, useToggleTask, useCreateTask, parseTaskInput } from '../hooks/useTasks.js';
import { useDayEvents } from '../hooks/useEvents.js';

function fmtTime(due_at) {
  if (!due_at) return '—';
  const d = new Date(due_at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTimeGroup(due_at) {
  if (!due_at) return 'undated';
  const h = new Date(due_at).getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
}

const GROUP_META = {
  morning: { title: 'Утро',   sub: 'до 12:00' },
  day:     { title: 'День',   sub: '12:00 – 18:00' },
  evening: { title: 'Вечер',  sub: 'после 18:00' },
  undated: { title: 'Без времени', sub: 'задачи без дедлайна' },
};

function Skeleton({ h = 14, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
}

function TodayTaskRow({ task }) {
  const toggle = useToggleTask();
  const overdue = task.due_at && new Date(task.due_at) < new Date() && !task.done;
  return (
    <div
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', transition: 'background 80ms', background: 'transparent' }}
    >
      <span onClick={() => toggle.mutate({ id: task.id, done: !task.done })} style={{ cursor: 'pointer' }}>
        <Checkbox checked={task.done} priority={task.priority} />
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: 14, color: task.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-3)' }}>
          {task.project && <ProjectTag projectToken={task.project.color_token} label={task.project.name} size="sm" />}
          {task.recurring && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="repeat" size={11} /> ежедневно</span>}
          {task.stuck && <Badge tone="warn" icon="flag">застряло</Badge>}
          {overdue && <Badge tone="danger" icon="bell">просрочено</Badge>}
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{fmtTime(task.due_at)}</span>
      <IconButton icon="more" size="sm" />
    </div>
  );
}

function TodayGroup({ group, tasks }) {
  const meta = GROUP_META[group];
  const remaining = tasks.filter(t => !t.done).length;
  return (
    <section style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <header style={{ padding: '14px 18px 10px 18px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{meta.title}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{meta.sub}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{remaining} осталось</span>
      </header>
      <div>{tasks.map(t => <TodayTaskRow key={t.id} t={t} task={t} />)}</div>
    </section>
  );
}

function QuickAddTask() {
  const [value, setValue] = useState('');
  const create = useCreateTask();

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    await create.mutateAsync(parseTaskInput(trimmed));
    setValue('');
  };

  return (
    <div style={{ padding: '12px 14px', background: 'var(--bg-elev-1)', border: '1px dashed var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name="plus" size={15} style={{ color: 'var(--text-3)', flex: 'none' }} />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        placeholder="Например: «Сдать диплом Анны пт в 18 !p1»"
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: value ? 'var(--text)' : 'var(--text-muted)' }}
      />
      <Kbd>↵</Kbd>
    </div>
  );
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7–20

function DayTimeline() {
  const { data: events = [] } = useDayEvents();
  const slotH = 44;
  const totalH = HOURS.length * slotH;
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const nowTop = Math.max(0, (nowH - HOURS[0]) * slotH);
  const nowVisible = nowH >= HOURS[0] && nowH <= HOURS[HOURS.length - 1];

  return (
    <aside style={{ width: 320, flex: 'none', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>День</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{events.length} событий</span>
      </header>
      <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 18px' }}>
        <div style={{ position: 'relative', height: totalH }}>
          {HOURS.map((h, i) => <div key={h} style={{ position: 'absolute', left: 36, right: 0, top: i * slotH, borderTop: '1px solid var(--border-subtle)' }} />)}
          {HOURS.map((h, i) => <span key={'l'+h} style={{ position: 'absolute', left: 0, top: i * slotH - 7, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{String(h).padStart(2,'0')}:00</span>)}
          {events.filter(e => !e.all_day).map((e, i) => {
            const s = new Date(e.start_at); const en = new Date(e.end_at);
            const sH = s.getHours() + s.getMinutes() / 60;
            const eH = en.getHours() + en.getMinutes() / 60;
            const top = (sH - HOURS[0]) * slotH + 1;
            const h = Math.max(22, (eH - sH) * slotH - 2);
            const color = e.project?.color_token || e.color_token || '--p-openresto';
            return (
              <div key={e.id} style={{ position: 'absolute', top, height: h, left: 40, right: 4, padding: '6px 10px', background: `color-mix(in oklab, var(${color}) 14%, transparent)`, borderLeft: `2px solid var(${color})`, borderRadius: '0 8px 8px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, overflow: 'hidden' }}>
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                {h > 30 && <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtTime(e.start_at)} – {fmtTime(e.end_at)}</span>}
              </div>
            );
          })}
          {events.filter(e => e.all_day).map(e => {
            const color = e.project?.color_token || e.color_token || '--p-openresto';
            return (
              <div key={e.id} style={{ position: 'absolute', top: 4, left: 40, right: 4, padding: '4px 8px', background: `color-mix(in oklab, var(${color}) 16%, transparent)`, borderLeft: `2px solid var(${color})`, borderRadius: '0 6px 6px 0', fontSize: 11, color: 'var(--text)' }}>
                {e.title} (весь день)
              </div>
            );
          })}
          {nowVisible && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: nowTop, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--danger)', fontFamily: 'var(--font-mono)', background: 'var(--bg-elev-1)', padding: '0 2px' }}>{fmtTime(new Date().toISOString())}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--danger)' }} />
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--danger)' }} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function Today() {
  const { data: timedTasks = [], isLoading: timedLoading } = useTodayTasks();
  const { data: undatedTasks = [], isLoading: undatedLoading } = useUndatedTasks();
  const isLoading = timedLoading || undatedLoading;

  const allTasks = [...timedTasks, ...undatedTasks];
  const done = allTasks.filter(t => t.done).length;

  // Group timed tasks by morning/day/evening
  const groups = { morning: [], day: [], evening: [], undated: [] };
  for (const t of timedTasks) groups[getTimeGroup(t.due_at)].push(t);
  groups.undated = undatedTasks;

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          breadcrumb={new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
          title="Сегодня"
          sub={isLoading ? '…' : `${allTasks.length} задач · ${done} готово`}
          right={<>
            <Button variant="ghost" size="sm" icon="filter">Фильтры</Button>
            <Button variant="ghost" size="sm" icon="sort">Группа: время</Button>
            <Button variant="secondary" size="sm" icon="plus">Задача</Button>
          </>}
        />
        <div style={{ flex: 1, display: 'flex', gap: 16, padding: '20px 24px 24px 24px', minHeight: 0 }}>
          <div className="ws-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', minWidth: 0 }}>
            {/* Progress bar */}
            <div style={{ padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>День в работе</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                    {done} / {allTasks.length} <span style={{ color: 'var(--text-3)', fontSize: 14 }}>· {allTasks.length ? Math.round(done / allTasks.length * 100) : 0}%</span>
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  <Icon name="clock" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: allTasks.length ? `${done / allTasks.length * 100}%` : '0%', background: 'linear-gradient(90deg, var(--p-openresto), var(--p-health))', borderRadius: 999, transition: 'width 300ms ease' }} />
              </div>
            </div>

            {isLoading ? (
              <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4].map(i => <Skeleton key={i} h={14} w={`${50 + i * 10}%`} />)}
              </div>
            ) : allTasks.length === 0 ? (
              <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Icon name="check" size={28} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 15, color: 'var(--text-2)', fontWeight: 500 }}>Задач нет</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Добавь первую задачу ниже</span>
              </div>
            ) : (
              ['morning','day','evening','undated'].map(group =>
                groups[group].length > 0 ? <TodayGroup key={group} group={group} tasks={groups[group]} /> : null
              )
            )}

            <QuickAddTask />
          </div>
          <DayTimeline />
        </div>
      </main>
    </div>
  );
}
