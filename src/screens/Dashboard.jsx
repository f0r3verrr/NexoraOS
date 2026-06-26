import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, ProjectTag, Checkbox, Tabs, Progress } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useTodayTasks, useFrogTask, useToggleTask, useCreateTask, parseTaskInput, useOverdueCount } from '../hooks/useTasks.js';
import { useProjects } from '../hooks/useProjects.js';
import { useDayEvents } from '../hooks/useEvents.js';
import { useQuickNotes, useAddQuickNote, useDeleteQuickNote } from '../hooks/useQuickNotes.js';
import { useJournalEntry, useUpsertJournalEntry } from '../hooks/useJournal.js';
import { useHabits, useHabitLogs, useToggleHabitLog, calcStreak } from '../hooks/useHabits.js';
import { useOrders } from '../hooks/useOrders.js';
import { useNotes } from '../hooks/useNotes.js';

function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }
function fmtTime(iso) { if (!iso) return '—'; const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function isOverdue(iso) { return iso && new Date(iso) < new Date(); }

function Sk({ w = '100%', h = 14, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
}

/* ---- Metric ---- */
function MetricCard({ label, value, unit, trend, sparkline, loading, accent }) {
  return (
    <div
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-2)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
      style={{ flex: 1, padding: '16px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, transition: 'box-shadow 150ms ease-out, border-color 150ms ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
        {trend && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: trend.dir === 'up' ? 'var(--success)' : 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <Icon name={trend.dir === 'up' ? 'trending_up' : 'arrow_down'} size={11} />{trend.value}
        </span>}
      </div>
      {loading ? <Sk h={28} w="60%" /> : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 500, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</span>
          {unit && <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{unit}</span>}
        </div>
      )}
      {sparkline && <svg viewBox="0 0 120 28" width="100%" height="22" preserveAspectRatio="none"><polyline points={sparkline} fill="none" stroke={accent ?? 'var(--text-3)'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity={accent ? 0.6 : 1} /></svg>}
    </div>
  );
}

/* ---- Task row ---- */
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

/* ---- Quick add ---- */
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
      <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Позвонить Ане в 15:00 !p1" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: v ? 'var(--text)' : 'var(--text-muted)' }} />
      {v && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>↵</span>}
    </div>
  );
}

/* ---- Quick notes widget ---- */
function QuickNotesWidget() {
  const { data: notes = [], isLoading } = useQuickNotes();
  const addNote = useAddQuickNote();
  const delNote = useDeleteQuickNote();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [color, setColor] = useState('--p-openresto');

  const COLORS = ['--p-openresto','--p-youmin','--p-home','--p-girl','--p-car','--p-bots','--p-diploma'];

  const submit = async () => {
    if (!text.trim()) return;
    await addNote.mutateAsync({ text: text.trim(), color_token: color });
    setText(''); setAdding(false);
  };

  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Быстрые заметки</span>
        <IconButton icon="plus" onClick={() => setAdding(a => !a)} />
      </div>

      {adding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: 'var(--bg-elev-2)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Текст заметки…" autoFocus
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 16, height: 16, borderRadius: 4, background: `var(${c})`, border: `2px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />)}
            <span style={{ flex: 1 }} />
            <button onClick={submit} style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Добавить ↵</button>
          </div>
        </div>
      )}

      {isLoading ? [1,2].map(i => <Sk key={i} h={56} radius={8} />) : notes.length === 0 ? (
        <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Нет заметок</div>
      ) : (
        notes.map(n => (
          <div key={n.id} style={{ position: 'relative', padding: '10px 12px', background: `color-mix(in oklab, var(${n.color_token}) 10%, var(--bg-elev-2))`, borderLeft: `2px solid var(${n.color_token})`, borderRadius: '0 8px 8px 0', display: 'flex', flexDirection: 'column', gap: 4 }}
            onMouseEnter={e => e.currentTarget.querySelector('.del-btn').style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.querySelector('.del-btn').style.opacity = '0'}>
            <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.45 }}>{n.text}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {new Date(n.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
            </span>
            <button className="del-btn" onClick={() => delNote.mutate(n.id)} style={{ position: 'absolute', top: 6, right: 6, opacity: 0, transition: 'opacity 120ms', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <Icon name="x" size={12} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

/* ---- Schedule from calendar events ---- */
function ScheduleWidget() {
  const { data: events = [], isLoading } = useDayEvents();
  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Расписание</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{isLoading ? '…' : `${events.length} событий`}</span>
      </div>
      <div style={{ padding: '0 18px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isLoading ? [1,2,3].map(i => <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 10, padding: '10px 0' }}><Sk h={12} w={40} /><Sk h={44} radius={8} /></div>) :
        events.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Нет событий сегодня</div>
        ) : (
          events.map((e, i) => {
            const now = new Date();
            const start = new Date(e.start_at);
            const end = new Date(e.end_at);
            const isNow = start <= now && now <= end;
            const color = e.project?.color_token || e.color_token || '--p-openresto';
            return (
              <div key={e.id}
                onMouseEnter={el => el.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 10, padding: '10px 4px', borderRadius: 8, background: 'transparent', transition: 'background 80ms', margin: '0 -4px' }}>
                <span style={{ fontSize: 12, color: isNow ? 'var(--text)' : 'var(--text-3)', fontFamily: 'var(--font-mono)', paddingTop: 1, fontWeight: isNow ? 500 : 400 }}>{fmtTime(e.start_at)}</span>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: `color-mix(in oklab, var(${color}) ${isNow ? 16 : 10}%, transparent)`, borderLeft: `2px solid var(${color})`, display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
                  {isNow && <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, color: `var(${color})`, fontFamily: 'var(--font-mono)', background: `color-mix(in oklab, var(${color}) 14%, var(--bg-elev-3))`, padding: '2px 6px', borderRadius: 4, animation: 'pulse 2.5s ease-in-out infinite', fontWeight: 600 }}>СЕЙЧАС</span>}
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{e.title}</span>
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

/* ---- Mood + energy from today's journal ---- */
function MoodWidget() {
  const date = isoDate();
  const { data: entry } = useJournalEntry(date);
  const upsert = useUpsertJournalEntry();
  const mood = entry?.mood ?? null;
  const energy = entry?.energy ?? null;

  return (
    <div style={{ gridColumn: 'span 3', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Как ты сейчас?</span>
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

/* ---- Habits from DB ---- */
function HabitsWidget() {
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
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет привычек — добавь в «Цели»</span>
    </div>
  );

  return (
    <div style={{ gridColumn: 'span 4', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Привычки</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>последние 14 дней</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {habits.map(h => {
          const logs = logsMap[h.id] ?? new Set();
          const streak = calcStreak(h.id, logsMap);
          const dates = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return isoDate(d); });
          const todayDone = logs.has(today);
          return (
            <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {dates.map((date, i) => (
                  <button key={date} onClick={() => toggle.mutate({ habitId: h.id, date, done: !logs.has(date) })}
                    style={{ width: 12, height: 12, borderRadius: 3, border: date === today ? `1px solid color-mix(in oklab, var(${h.color_token}) 50%, transparent)` : 'none', cursor: 'pointer', background: logs.has(date) ? `color-mix(in oklab, var(${h.color_token}) ${50 + i * 3}%, transparent)` : 'var(--bg-elev-3)' }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', minWidth: 32, textAlign: 'right' }}>{streak > 0 ? `🔥${streak}` : '—'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Recent items ---- */
function RecentWidget() {
  const { data: notes = [] } = useNotes();
  const { data: tasks = [] } = useTodayTasks();

  const recentNotes = [...notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 3)
    .map(n => ({ i: 'note', l: n.title, s: new Date(n.updated_at).toLocaleDateString('ru', { day:'numeric', month:'short' }), proj: n.project?.color_token ?? '--p-openresto' }));
  const doneTasks = tasks.filter(t => t.done && t.done_at).sort((a, b) => new Date(b.done_at) - new Date(a.done_at)).slice(0, 2)
    .map(t => ({ i: 'check', l: t.title, s: 'выполнено сегодня', proj: t.project?.color_token ?? '--p-openresto' }));
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

/* ---- Main ---- */
export default function Dashboard() {
  const { data: tasks = [], isLoading: tL } = useTodayTasks();
  const { data: frog }                       = useFrogTask();
  const { data: projects = [], isLoading: pL } = useProjects();
  const { data: overdueCount = 0 }           = useOverdueCount();
  const { data: orders = [] }                = useOrders();

  const doneTasks = tasks.filter(t => t.done);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  // Monthly income from paid orders
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const monthlyIncome = orders
    .filter(o => o.paid && new Date(o.created_at) >= monthStart)
    .reduce((a, o) => a + Number(o.amount), 0);

  // Deadlines this week
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekDeadlines = tasks.filter(t => !t.done && t.due_at && new Date(t.due_at) <= weekEnd).length;

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar title="Дашборд" sub="что мне сейчас важно" right={<>
          <Button variant="ghost" size="sm" icon="bell" />
          <Button variant="secondary" size="sm" icon="moon">Тема</Button>
        </>} />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <h1 style={{ fontSize: 30, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.025em', margin: 0, lineHeight: 1.15 }}>
                {greeting}.
                <span style={{ color: 'var(--text-3)' }}>
                  {' '}{tasks.length > 0 ? `${tasks.length - doneTasks.length} задач на сегодня.` : 'Задач нет — отличный день!'}
                </span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {overdueCount > 0 && <Badge tone="danger" icon="bell">{overdueCount} просрочено</Badge>}
              <Button variant="secondary" icon="plus">Добавить</Button>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <MetricCard label="Задач на сегодня" value={tL ? '…' : String(tasks.length)} unit={doneTasks.length ? `/ ${doneTasks.length} готово` : undefined} loading={tL} sparkline="0,20 12,18 24,16 36,14 48,16 60,12 72,10 84,12 96,8 108,10 120,6" accent="var(--p-openresto)" />
            <MetricCard label="Проектов" value={pL ? '…' : String(projects.length)} loading={pL} sparkline="0,14 12,12 24,16 36,14 48,10 60,12 72,8 84,10 96,6 108,8 120,4" accent="var(--p-youmin)" />
            <MetricCard label="Дедлайнов на неделе" value={String(weekDeadlines)} sparkline="0,18 12,16 24,14 36,16 48,14 60,10 72,12 84,8 96,10 108,6 120,8" accent="var(--warn)" />
            <MetricCard label="Доход в месяц" value={monthlyIncome ? monthlyIncome.toLocaleString('ru') : '—'} unit={monthlyIncome ? '₽' : undefined} sparkline="0,24 12,22 24,18 36,20 48,16 60,14 72,12 84,14 96,10 108,8 120,4" accent="var(--success)" />
          </div>

          {/* Frog */}
          {frog && (
            <div style={{ padding: '20px 22px', borderRadius: 12, marginBottom: 20, background: `linear-gradient(135deg, color-mix(in oklab, var(${frog.project?.color_token ?? '--p-openresto'}) 20%, var(--bg-elev-1)) 0%, var(--bg-elev-1) 65%)`, border: `1px solid color-mix(in oklab, var(${frog.project?.color_token ?? '--p-openresto'}) 38%, var(--border))`, display: 'flex', alignItems: 'center', gap: 18, boxShadow: `0 4px 20px -8px color-mix(in oklab, var(${frog.project?.color_token ?? '--p-openresto'}) 25%, transparent)` }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in oklab, var(${frog.project?.color_token ?? '--p-openresto'}) 24%, transparent)`, color: `var(${frog.project?.color_token ?? '--p-openresto'})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: `0 0 16px -4px color-mix(in oklab, var(${frog.project?.color_token ?? '--p-openresto'}) 40%, transparent)` }}>
                <Icon name="zap" size={20} stroke={1.5} />
              </span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: `var(${frog.project?.color_token ?? '--p-openresto'})`, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>Лягушка дня</span>
                  {frog.project && <ProjectTag projectToken={frog.project.color_token} label={frog.project.name} />}
                </div>
                <span style={{ fontSize: 18, color: 'var(--text)', fontWeight: 500, letterSpacing: '-0.01em' }}>{frog.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-3)' }}>
                  {frog.due_at && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={12} /> до {fmtTime(frog.due_at)}</span>}
                  {frog.priority && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="flag" size={12} style={{ color: 'var(--danger)' }} /> p{frog.priority}</span>}
                </div>
              </div>
              <Button variant="primary" icon="check" onClick={() => {}}>Начать</Button>
            </div>
          )}

          {/* Tasks + Schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: 'span 8', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Задачи на сегодня</span>
                  {!tL && <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{tasks.length} · {doneTasks.length} готово</span>}
                </div>
                <Tabs items={['Все', 'Работа', 'Личное']} active="Все" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 6px 8px', minHeight: 60 }}>
                {tL ? [1,2,3].map(i => <div key={i} style={{ padding: '10px 14px' }}><Sk h={14} w={`${60+i*10}%`} /></div>) :
                tasks.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, flexDirection: 'column' }}>
                    <Icon name="check" size={22} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Задач на сегодня нет</span>
                  </div>
                ) : tasks.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
              <QuickAddTask />
            </div>
            <ScheduleWidget />
          </div>

          {/* Projects + Quick notes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: 'span 8', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Активные проекты</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>всего {projects.length}</span>
              </div>
              {pL ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>{[1,2,3,4].map(i => <Sk key={i} h={88} r={10} />)}</div> :
              projects.length === 0 ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Нет проектов</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
                  {projects.slice(0,4).map(p => (
                    <div key={p.id}
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
            <QuickNotesWidget />
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
