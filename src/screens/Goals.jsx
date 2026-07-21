import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, Progress } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/useGoals.js';
import { useHabits, useHabitLogs, useToggleHabitLog, useCreateHabit, useDeleteHabit, calcStreak } from '../hooks/useHabits.js';
import { useOrders } from '../hooks/useOrders.js';
import { ru } from '../lib/plural.js';

const BUDGET_KEY = 'nexora-budget';

function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }

/* ---- Custom numeric field with –/+ buttons ---- */
const NO_SPINNER = `
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0 }
  input[type=number] { -moz-appearance:textfield }
`;

function NumericField({ value, onChange, unit, placeholder = '0' }) {
  const num  = parseFloat((value ?? '').toString().replace(/[\s]/g, '')) || 0;
  const step = num >= 100000 ? 10000 : num >= 10000 ? 1000 : num >= 1000 ? 100 : num >= 100 ? 10 : 1;
  const adj  = (d) => onChange(String(Math.max(0, num + d)));

  const btnStyle = (side) => ({
    width: 34, flex: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-elev-2)',
    borderRight:  side === 'left'  ? '1px solid var(--border-subtle)' : 'none',
    borderLeft:   side === 'right' ? '1px solid var(--border-subtle)' : 'none',
    color: 'var(--text-2)', cursor: 'pointer',
    fontSize: 17, lineHeight: 1, userSelect: 'none',
    transition: 'background 100ms',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: 36, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
        <button type="button" onClick={() => adj(-step)}
          style={btnStyle('left')}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elev-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elev-2)')}>−</button>
        <input
          type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, padding: '0 8px', background: 'none', border: 'none', fontSize: 13, color: 'var(--text)', outline: 'none', textAlign: 'center', minWidth: 0 }}
        />
        {unit && (
          <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-3)', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', whiteSpace: 'nowrap' }}>
            {unit}
          </span>
        )}
        <button type="button" onClick={() => adj(+step)}
          style={btnStyle('right')}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elev-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elev-2)')}>+</button>
      </div>
  );
}

function Skeleton({ h = 14, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
}

/* ---- Goal categories ---- */
const GOAL_CATS = [
  { id: 'financial',   label: 'Денежная',   icon: 'coin',      numeric: true,  defaultUnit: '₽',    desc: 'Доход, оборот, бюджет' },
  { id: 'savings',     label: 'Накопления', icon: 'landmark',  numeric: true,  defaultUnit: '₽',    desc: 'Копилка, первый взнос' },
  { id: 'sports',      label: 'Спортивная', icon: 'activity',  numeric: true,  defaultUnit: 'км',   desc: 'Дистанция, вес, повторения' },
  { id: 'educational', label: 'Обучение',   icon: 'book',      numeric: true,  defaultUnit: 'глав', desc: 'Книги, курсы, модули' },
  { id: 'project',     label: 'Проектная',  icon: 'zap',       numeric: true,  defaultUnit: 'задач',desc: 'Фичи, задачи, релизы' },
  { id: 'health',      label: 'Здоровье',   icon: 'heart',     numeric: false, defaultUnit: '',     desc: 'Сон, питание, медицина' },
  { id: 'career',      label: 'Карьерная',  icon: 'briefcase', numeric: false, defaultUnit: '',     desc: 'Должность, навык, проект' },
  { id: 'custom',      label: 'Кастомная',  icon: 'target',    numeric: false, defaultUnit: '',     desc: 'Произвольный прогресс' },
];

const GOAL_COLORS = ['--p-openresto','--p-youmin','--p-home','--p-girl','--p-health','--p-bots','--p-diploma','--p-sites','--p-car','--p-family'];
const HORIZONS   = ['Годовая', 'Квартальная', 'Месячная', 'Долгосрочная'];

function getCat(id) { return GOAL_CATS.find(c => c.id === id) ?? GOAL_CATS[GOAL_CATS.length - 1]; }

/* Auto-calculate progress for numeric categories */
function autoProgress(category, currentVal, targetVal) {
  const cat = getCat(category);
  if (!cat.numeric) return null;
  const curr = parseFloat((currentVal ?? '').replace(/[\s]/g, '').replace(',', '.'));
  const tgt  = parseFloat((targetVal  ?? '').replace(/[\s]/g, '').replace(',', '.'));
  if (isNaN(curr) || isNaN(tgt) || tgt === 0) return null;
  return Math.min(100, Math.max(0, Math.round((curr / tgt) * 100)));
}

/* Format number with spaces: 200000 → "200 000" */
function fmtNum(val) {
  const n = parseFloat((val ?? '').replace(/[\s]/g, '').replace(',', '.'));
  if (isNaN(n)) return val ?? '';
  return n.toLocaleString('ru');
}

/* Stable field wrapper — must be outside any component to avoid remount on re-render */
function F({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

/* ---- Goal modal ---- */
function GoalModal({ goal, onClose }) {
  const mousedownOnBackdrop = useRef(false);
  const isEdit = !!goal;
  const create = useCreateGoal();
  const update = useUpdateGoal();

  const [category, setCategory] = useState(goal?.category ?? 'custom');
  const [title,    setTitle]    = useState(goal?.title ?? '');
  const [horizon,  setHorizon]  = useState(goal?.goal_type ?? 'Годовая');
  const [color,    setColor]    = useState(goal?.color_token ?? '--p-openresto');
  const [current,  setCurrent]  = useState(goal?.current_value ?? '');
  const [target,   setTarget]   = useState(goal?.target_value ?? '');
  const [unit,     setUnit]     = useState(goal?.unit ?? getCat(goal?.category ?? 'custom').defaultUnit);
  const [progress, setProgress] = useState(String(goal?.progress ?? 0));
  const [notes,    setNotes]    = useState(goal?.notes ?? '');
  const [error,    setError]    = useState('');

  const cat = getCat(category);

  const handleCatChange = (id) => {
    setCategory(id);
    const c = getCat(id);
    if (!goal) setUnit(c.defaultUnit);
  };

  const computedProgress = cat.numeric ? (autoProgress(category, current, target) ?? parseInt(progress) ?? 0) : parseInt(progress) || 0;

  const submit = async () => {
    if (!title.trim()) { setError('Введи название цели'); return; }
    const payload = {
      title:         title.trim(),
      goal_type:     horizon,
      color_token:   color,
      current_value: current.trim() || null,
      target_value:  target.trim() || null,
      progress:      computedProgress,
      notes:         notes.trim() || null,
      category,
      unit:          unit.trim() || null,
    };
    if (isEdit) await update.mutateAsync({ id: goal.id, ...payload });
    else        await create.mutateAsync(payload);
    onClose();
  };

  const inputSx = { height: 36, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflow: 'auto' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <style>{NO_SPINNER}</style>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 22px 24px', width: '100%', maxWidth: 480, boxSizing: 'border-box', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{isEdit ? 'Редактировать цель' : 'Новая цель'}</div>

        {/* Category grid */}
        <F label="Тип цели">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
            {GOAL_CATS.map(c => {
              const active = category === c.id;
              return (
                <button key={c.id} onClick={() => handleCatChange(c.id)} style={{
                  padding: '10px 4px 8px', borderRadius: 9,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  background: active ? `color-mix(in oklab, var(${color}) 12%, var(--bg-elev-2))` : 'var(--bg-elev-1)',
                  border: `1.5px solid ${active ? `color-mix(in oklab, var(${color}) 50%, transparent)` : 'var(--border-subtle)'}`,
                  cursor: 'pointer', transition: 'all 120ms',
                  color: active ? `var(${color})` : 'var(--text-3)',
                }}>
                  <Icon name={c.icon} size={18} stroke={active ? 2 : 1.5} />
                  <span style={{ fontSize: 10, fontWeight: active ? 500 : 400, color: active ? 'var(--text)' : 'var(--text-3)', textAlign: 'center', lineHeight: 1.2 }}>{c.label}</span>
                </button>
              );
            })}
          </div>
          {cat.desc && <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{cat.desc}</span>}
        </F>

        {/* Title */}
        <F label="Название *">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Например: Вырасти до 200к/мес дохода" autoFocus style={{ ...inputSx, height: 38, fontSize: 14 }} />
        </F>

        {/* Horizon */}
        <F label="Горизонт">
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {HORIZONS.map(h => (
              <button key={h} onClick={() => setHorizon(h)} style={{
                padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: horizon === h ? 500 : 400,
                background: horizon === h ? 'var(--bg-elev-3)' : 'var(--bg-elev-1)',
                border: `1px solid ${horizon === h ? 'var(--border)' : 'var(--border-subtle)'}`,
                color: horizon === h ? 'var(--text)' : 'var(--text-2)', cursor: 'pointer',
              }}>{h}</button>
            ))}
          </div>
        </F>

        {/* Values */}
        {cat.numeric ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Unit first — affects the NumericField display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10, alignItems: 'end' }}>
              <F label="Текущее значение">
                <NumericField value={current} onChange={setCurrent} placeholder="0" />
              </F>
              <F label="Единица">
                <input value={unit} onChange={e => setUnit(e.target.value)} placeholder={cat.defaultUnit || '₽, км…'}
                  style={inputSx} />
              </F>
            </div>
            <F label="Цель">
              <NumericField value={target} onChange={setTarget} placeholder="100" />
            </F>
            {/* Progress preview */}
            <F label={`Прогресс — ${computedProgress}%`}>
              <input
                type="range" min={0} max={100} value={computedProgress}
                onChange={e => {
                  const pct = parseInt(e.target.value);
                  const tgt = parseFloat((target ?? '').toString().replace(/\s/g, ''));
                  if (!isNaN(tgt) && tgt > 0) setCurrent(String(Math.round(tgt * pct / 100)));
                }}
                style={{ width: '100%', accentColor: `var(${color})`, cursor: 'pointer' }}
              />
            </F>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <F label="Текущее состояние">
                <input value={current} onChange={e => setCurrent(e.target.value)} placeholder="Сейчас" style={inputSx} />
              </F>
              <F label="Целевое состояние">
                <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Хочу достичь" style={inputSx} />
              </F>
            </div>
            <F label={`Прогресс — ${progress}%`}>
              <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(e.target.value)}
                style={{ width: '100%', accentColor: `var(${color})`, cursor: 'pointer' }} />
            </F>
          </div>
        )}

        {/* Color */}
        <F label="Цвет">
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {GOAL_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: 6, background: `var(${c})`, border: `3px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />
            ))}
          </div>
        </F>

        {/* Notes */}
        <F label="Заметки">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Дополнительно…"
            style={{ padding: '8px 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'none', fontFamily: 'var(--font-sans)', width: '100%', boxSizing: 'border-box' }} />
        </F>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit} style={{ opacity: title.trim() ? 1 : 0.5 }}>
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---- Inline current value editor ---- */
function InlineEdit({ value, unit, color, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value ?? '');

  if (editing) {
    const num  = parseFloat((val ?? '').toString().replace(/\s/g, '')) || 0;
    const step = num >= 100000 ? 10000 : num >= 10000 ? 1000 : num >= 1000 ? 100 : num >= 100 ? 10 : 1;
    const adj  = (d) => setVal(String(Math.max(0, num + d)));
    const save = () => { onSave(val); setEditing(false); };

    const btnSx = (border) => ({
      width: 26, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-elev-2)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 16,
      borderRight: border === 'r' ? `1px solid color-mix(in oklab, var(${color}) 25%, var(--border-subtle))` : 'none',
      borderLeft:  border === 'l' ? `1px solid color-mix(in oklab, var(${color}) 25%, var(--border-subtle))` : 'none',
    });

    return (
      <span style={{ display: 'inline-flex', alignItems: 'stretch', height: 28, borderRadius: 7, border: `1.5px solid var(${color})`, overflow: 'hidden', background: 'var(--bg-elev-3)' }}>
        <style>{NO_SPINNER}</style>
        <button type="button" onClick={() => adj(-step)} style={btnSx('r')}>−</button>
        <input
          type="number" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          style={{ width: 72, padding: '0 6px', background: 'none', border: 'none', fontSize: 13, color: 'var(--text)', outline: 'none', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
        />
        <button type="button" onClick={() => adj(+step)} style={btnSx('l')}>+</button>
        <button type="button" onClick={save} style={{ ...btnSx('l'), color: `var(${color})`, fontWeight: 700, fontSize: 13 }}>✓</button>
      </span>
    );
  }

  return (
    <button onClick={() => { setVal(value ?? ''); setEditing(true); }} title="Нажми для обновления"
      style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 500, letterSpacing: '-0.02em', textDecoration: 'underline dotted', textUnderlineOffset: 3, textDecorationColor: `color-mix(in oklab, var(${color}) 50%, transparent)`, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
      {fmtNum(value)}
    </button>
  );
}

/* ---- Budget goal card (from Finances localStorage) ---- */
function BudgetGoalCard({ budget, orders }) {
  const now      = new Date();
  const year     = now.getFullYear();
  const month    = now.getMonth();
  const monthInc = orders
    .filter(o => o.paid)
    .filter(o => { const d = new Date(o.created_at); return d.getFullYear() === year && d.getMonth() === month; })
    .reduce((s, o) => s + Number(o.amount), 0);
  const pct      = Math.min(100, Math.round((monthInc / budget) * 100));
  const monthName = now.toLocaleDateString('ru', { month: 'long' });
  const fmtN = (n) => Number(n).toLocaleString('ru');

  return (
    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'color-mix(in oklab, var(--p-openresto) 14%, var(--bg-elev-2))', border: '1px solid color-mix(in oklab, var(--p-openresto) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name="wallet" size={15} style={{ color: 'var(--p-openresto)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Доход за месяц</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Месячная · {monthName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 500 }}>{fmtN(monthInc)} ₽</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>из {fmtN(budget)} ₽</div>
        </div>
      </div>
      <div>
        <div style={{ height: 5, background: 'var(--bg-elev-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--success)' : 'var(--p-openresto)', borderRadius: 999, transition: 'width 600ms ease-out' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 11, color: pct >= 100 ? 'var(--success)' : 'var(--text-muted)', fontWeight: pct >= 100 ? 600 : 400 }}>{pct}% выполнено</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Изменить цель в Финансах</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Goal card ---- */
function GoalCard({ goal, onEdit }) {
  const del    = useDeleteGoal();
  const update = useUpdateGoal();
  const cat    = getCat(goal.category ?? 'custom');

  // Numeric detection: use category if available, otherwise check if values parse as numbers
  const tgtNum = parseFloat((goal.target_value ?? '').toString().replace(/\s/g, ''));
  const curNum = parseFloat((goal.current_value ?? '').toString().replace(/\s/g, ''));
  const isNumeric = cat.numeric || (!isNaN(tgtNum) && tgtNum > 0 && !isNaN(curNum));

  const computedProg = isNumeric
    ? (autoProgress(goal.category, goal.current_value, goal.target_value) ?? goal.progress ?? 0)
    : (goal.progress ?? 0);

  const handleAdjust = (delta) => {
    const next = Math.min(100, Math.max(0, computedProg + delta));
    const patch = { id: goal.id, progress: next };
    // Back-calculate current_value for numeric goals
    if (isNumeric && !isNaN(tgtNum) && tgtNum > 0) {
      patch.current_value = String(Math.round(tgtNum * next / 100));
    }
    update.mutate(patch);
  };

  const handleUpdateCurrent = (newVal) => {
    const prog = autoProgress(goal.category, newVal, goal.target_value);
    update.mutate({ id: goal.id, current_value: newVal, ...(prog !== null && { progress: prog }) });
  };

  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.borderColor = `color-mix(in oklab, var(${goal.color_token}) 40%, var(--border-subtle))`; e.currentTarget.style.boxShadow = 'var(--shadow-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = ''; }}
      style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 18px', transition: 'border-color 150ms, box-shadow 150ms' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: `color-mix(in oklab, var(${goal.color_token}) 14%, transparent)`, color: `var(${goal.color_token})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name={cat.icon} size={16} stroke={1.5} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{goal.title}</span>
            <Badge tone="neutral">{cat.label}</Badge>
            <Badge tone="neutral">{goal.goal_type}</Badge>
            {goal.horizon && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{goal.horizon}</span>}
          </div>
          {goal.notes && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.notes}</p>}
        </div>
        <div style={{ display: 'flex', gap: 2, flex: 'none' }}>
          <IconButton icon="edit"  size="sm" onClick={onEdit}                                                                         title="Редактировать" />
          <IconButton icon="trash" size="sm" onClick={() => { if (confirm(`Удалить «${goal.title}»?`)) del.mutate(goal.id); }} title="Удалить" style={{ color: 'var(--danger)' }} />
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={computedProg} color={`var(${goal.color_token})`} height={5} />

      {/* Values row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
        {/* Left: current → target */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', minWidth: 0, flex: 1 }}>
          {isNumeric ? (
            <>
              <span>Сейчас:</span>
              <InlineEdit value={goal.current_value} unit={goal.unit ?? ''} color={goal.color_token} onSave={handleUpdateCurrent} />
              {goal.unit && <span>{goal.unit}</span>}
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{fmtNum(goal.target_value)}</span>
              {goal.unit && <span>{goal.unit}</span>}
            </>
          ) : (
            <>
              {goal.current_value && <span style={{ fontFamily: 'var(--font-mono)' }}>{goal.current_value}</span>}
              {goal.current_value && goal.target_value && <span style={{ color: 'var(--text-muted)' }}>→</span>}
              {goal.target_value && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{goal.target_value}</span>}
            </>
          )}
        </div>

        {/* Right: progress % with −/+ for all goal types */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 'none' }}>
          <button onClick={() => handleAdjust(-5)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', transition: 'background 100ms' }}>−</button>
          <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-mono)', color: `var(${goal.color_token})`, minWidth: 40, textAlign: 'center' }}>{computedProg}%</span>
          <button onClick={() => handleAdjust(+5)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', transition: 'background 100ms' }}>+</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Habits tracker ---- */
const WEEK_DAYS = ['пн','вт','ср','чт','пт','сб','вс'];

function currentWeek() {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return isoDate(d);
  });
}

function AddHabitModal({ onClose }) {
  const mousedownOnBackdrop = useRef(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('--p-health');
  const create = useCreateHabit();
  const COLORS = ['--p-health','--p-openresto','--p-youmin','--p-girl','--p-sites','--p-diploma','--p-bots','--p-home','--p-family'];

  const submit = async () => {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), color_token: color });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 360, maxWidth: '100%', boxSizing: 'border-box', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Новая привычка</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Название</label>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Например: Зарядка 15 мин" autoFocus
            style={{ height: 38, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Цвет</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 8, background: `var(${c})`, border: `3px solid ${color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit} style={{ opacity: name.trim() ? 1 : 0.5 }}>Создать</Button>
        </div>
      </div>
    </div>
  );
}

function HabitsTracker({ filteredIds = null }) {
  const [showAdd, setShowAdd] = useState(false);
  const { data: habitsAll = [], isLoading: habitsLoading } = useHabits();
  const { data: logsMap = {}, isLoading: logsLoading } = useHabitLogs(7);
  const habits = filteredIds ? habitsAll.filter(h => filteredIds.has(h.id)) : habitsAll;
  const toggle      = useToggleHabitLog();
  const deleteHabit = useDeleteHabit();
  const dates = currentWeek();
  const today = isoDate();
  const isLoading = habitsLoading || logsLoading;

  return (
    <>
      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} />}
      <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'auto' }}>
        {/* Фикс-px колонки (7 дней недели по 32px) — на узких экранах вместо
            сплющивания имени привычки карточка скроллится по горизонтали. */}
        <div style={{ minWidth: 480 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 32px) 56px 28px', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', gap: 4, alignItems: 'center' }}>
          <div>Привычка</div>
          {WEEK_DAYS.map(d => <div key={d} style={{ textAlign: 'center' }}>{d}</div>)}
          <div style={{ textAlign: 'center' }}>Стрик</div>
          <div />
        </div>

        {isLoading ? (
          <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <Skeleton key={i} h={12} w={`${60 + i * 8}%`} />)}
          </div>
        ) : habits.length === 0 ? (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Icon name="repeat" size={24} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Нет привычек — добавь первую</span>
          </div>
        ) : (
          habits.map((h, i) => {
            const streak = calcStreak(h.id, logsMap);
            const logs   = logsMap[h.id] ?? new Set();
            return (
              <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 32px) 56px 28px', padding: '10px 14px', borderBottom: i < habits.length - 1 ? '1px solid var(--border-subtle)' : 'none', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: `var(${h.color_token})`, flex: 'none' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                </div>
                {dates.map(date => {
                  const done     = logs.has(date);
                  const isToday  = date === today;
                  const isFuture = date > today;
                  return (
                    <div key={date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={() => !isFuture && toggle.mutate({ habitId: h.id, date, done: !done })}
                        disabled={isFuture}
                        style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: isFuture ? 'transparent'
                            : done ? `color-mix(in oklab, var(${h.color_token}) 24%, transparent)` : 'var(--bg-elev-2)',
                          border: `1px solid ${
                            isFuture ? 'var(--border-subtle)'
                            : done    ? `color-mix(in oklab, var(${h.color_token}) 45%, transparent)`
                            : isToday ? 'var(--border)' : 'var(--border-subtle)'
                          }`,
                          opacity: isFuture ? 0.25 : 1,
                          cursor: isFuture ? 'default' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 120ms',
                          outline: isToday ? `2px solid color-mix(in oklab, var(${h.color_token}) 30%, transparent)` : 'none',
                          outlineOffset: 1,
                        }}>
                        {done && !isFuture && <Icon name="check" size={11} style={{ color: `var(${h.color_token})` }} stroke={2.5} />}
                      </button>
                    </div>
                  );
                })}
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: streak >= 7 ? `var(${h.color_token})` : 'var(--text-2)', fontWeight: streak >= 7 ? 500 : 400 }}>
                    {streak > 0 ? `🔥${streak}` : '—'}
                  </span>
                </div>
                <button onClick={() => deleteHabit.mutate(h.id)} className="touch-reveal"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 120ms' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = 1)}
                  onMouseLeave={e => (e.currentTarget.style.opacity = 0)}>
                  <Icon name="x" size={12} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            );
          })
        )}

        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', color: 'var(--text-3)', fontSize: 13, borderTop: '1px solid var(--border-subtle)' }}>
          <Icon name="plus" size={14} /> Добавить привычку
        </button>
        </div>
      </div>
    </>
  );
}

/* ---- Analytics view ---- */
function GoalAnalytics({ goals, habits, logsMap }) {
  const today = isoDate();
  const week  = currentWeek();
  const daysElapsed = week.filter(d => d <= today).length;

  const total      = goals.length;
  const completed  = goals.filter(g => (g.progress ?? 0) >= 100).length;
  const inProgress = goals.filter(g => (g.progress ?? 0) > 0 && (g.progress ?? 0) < 100).length;
  const avgProg    = total ? Math.round(goals.reduce((a, g) => a + (g.progress ?? 0), 0) / total) : 0;

  const byCat = GOAL_CATS
    .map(c => ({ cat: c, items: goals.filter(g => (g.category ?? 'custom') === c.id) }))
    .filter(x => x.items.length > 0);

  const byHorizon = [...new Set(goals.map(g => g.goal_type))].map(h => {
    const items = goals.filter(g => g.goal_type === h);
    const avg   = Math.round(items.reduce((a, g) => a + (g.progress ?? 0), 0) / items.length);
    return { h, items, avg };
  });

  const habitStats = habits.map(h => {
    const logs   = logsMap[h.id] ?? new Set();
    const done   = week.filter(d => d <= today && logs.has(d)).length;
    const streak = calcStreak(h.id, logsMap);
    return { ...h, done, streak };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Overview */}
      <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { l: 'Всего целей',      v: total,         c: 'var(--text)' },
          { l: 'Выполнено',        v: completed,     c: 'var(--success)' },
          { l: 'В процессе',       v: inProgress,    c: 'var(--info)' },
          { l: 'Средний прогресс', v: `${avgProg}%`, c: 'var(--p-openresto)' },
        ].map(m => (
          <div key={m.l} style={{ padding: '16px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{m.l}</div>
            <div style={{ fontSize: 28, fontWeight: 500, fontFamily: 'var(--font-mono)', color: m.c, letterSpacing: '-0.02em' }}>{m.v}</div>
          </div>
        ))}
      </div>

      <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By category */}
        {byCat.length > 0 && (
          <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>По типу цели</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {byCat.map(({ cat: c, items }) => {
                const avg   = Math.round(items.reduce((a, g) => a + (g.progress ?? 0), 0) / items.length);
                const color = items[0]?.color_token ?? '--p-openresto';
                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name={c.icon} size={14} style={{ color: 'var(--text-3)', flex: 'none' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{c.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{items.length} · {avg}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${avg}%`, background: `var(${color})`, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* By horizon */}
        {byHorizon.length > 0 && (
          <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>По горизонту</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {byHorizon.map(({ h, items, avg }) => {
                const color = items[0]?.color_token ?? '--p-openresto';
                return (
                  <div key={h} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="target" size={14} style={{ color: 'var(--text-3)', flex: 'none' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{h}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{items.length} · {avg}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${avg}%`, background: `var(${color})`, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Habits */}
      {habitStats.length > 0 && (
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Привычки · эта неделя</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{daysElapsed} из 7 дней прошло</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {habitStats.map(h => {
              const rate = daysElapsed ? Math.round(h.done / daysElapsed * 100) : 0;
              return (
                <div key={h.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: `var(${h.color_token})`, flex: 'none' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{h.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {h.done}/{daysElapsed} · {h.streak > 0 ? `🔥${h.streak}` : '—'}
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${rate}%`, background: `var(${h.color_token})`, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {total === 0 && habitStats.length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Данных пока нет — добавь цели и привычки
        </div>
      )}
    </div>
  );
}

/* ---- Main ---- */
export default function Goals() {
  const { data: goals = [], isLoading, isError, error } = useGoals();
  const { data: habits = [] }    = useHabits();
  const { data: logsMap = {} }   = useHabitLogs(7);
  const { data: orders = [] }    = useOrders();
  const tableMissing = isError && (error?.code === 'PGRST205' || error?.message?.includes('goals'));
  const budget = +(localStorage.getItem(BUDGET_KEY) || 0);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterType    = searchParams.get('type') ?? '';
  const searchQuery   = searchParams.get('q')    ?? '';
  const sortBy        = searchParams.get('sort') ?? 'created';
  const hideCompleted = searchParams.get('hide') === 'done';

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [goalModal,     setGoalModal]     = useState(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setGoalModal(false);
      setSearchParams(p => { p.delete('new'); return p; }, { replace: true });
    }
  }, [searchParams]);

  const horizonTypes = [...new Set(goals.map(g => g.goal_type))];

  const filtered = goals
    .filter(g => !filterType    || g.goal_type === filterType)
    .filter(g => !searchQuery   || g.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(g => !hideCompleted || (g.progress ?? 0) < 100)
    .sort((a, b) => {
      if (sortBy === 'progress') return (b.progress ?? 0) - (a.progress ?? 0);
      if (sortBy === 'horizon')  return (a.goal_type ?? '').localeCompare(b.goal_type ?? '');
      return new Date(a.created_at) - new Date(b.created_at);
    });

  const filteredHabits = habits.filter(h =>
    !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {goalModal !== null && <GoalModal goal={goalModal || null} onClose={() => setGoalModal(null)} />}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title="Цели и привычки"
            sub={isLoading ? '…' : ru.goals(goals.length)}
            right={<>
              <Button
                variant={showAnalytics ? 'primary' : 'ghost'}
                size="sm" icon="trending_up"
                onClick={() => setShowAnalytics(a => !a)}
              >Аналитика</Button>
            </>}
          />

          {/* Active filter indicator */}
          {(searchQuery || hideCompleted || sortBy !== 'created') && !showAnalytics && (
            <div style={{ padding: '6px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
              <Icon name="filter" size={12} style={{ color: 'var(--text-muted)' }} />
              {searchQuery && <span style={{ background: 'var(--bg-elev-2)', padding: '2px 8px', borderRadius: 20 }}>«{searchQuery}»</span>}
              {hideCompleted && <span style={{ background: 'var(--bg-elev-2)', padding: '2px 8px', borderRadius: 20 }}>скрыты выполненные</span>}
              {sortBy !== 'created' && <span style={{ background: 'var(--bg-elev-2)', padding: '2px 8px', borderRadius: 20 }}>сортировка: {sortBy === 'progress' ? 'прогресс' : 'горизонт'}</span>}
              <button onClick={() => setSearchParams({})} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', fontSize: 12 }}>
                <Icon name="x" size={11} /> сбросить
              </button>
            </div>
          )}

          <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 32px' }}>
            {showAnalytics ? (
              <GoalAnalytics goals={goals} habits={habits} logsMap={logsMap} />
            ) : (
              <div className="dash-grid12" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
                {/* Goals column */}
                <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Header + filter chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Цели</span>
                    {horizonTypes.length > 1 && (
                      <>
                        <button onClick={() => setSearchParams({})} style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                          background: !filterType ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)',
                          color:      !filterType ? 'var(--text)'     : 'var(--text-3)',
                          border: `1px solid ${!filterType ? 'var(--border)' : 'var(--border-subtle)'}`,
                        }}>Все</button>
                        {horizonTypes.map(h => (
                          <button key={h} onClick={() => setSearchParams(filterType === h ? {} : { type: h })} style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                            background: filterType === h ? 'var(--bg-elev-3)' : 'var(--bg-elev-2)',
                            color:      filterType === h ? 'var(--text)'     : 'var(--text-3)',
                            border: `1px solid ${filterType === h ? 'var(--border)' : 'var(--border-subtle)'}`,
                          }}>{h}</button>
                        ))}
                      </>
                    )}
                    <span style={{ flex: 1 }} />
                    {!isLoading && goals.length > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                        {goals.filter(g => (g.progress ?? 0) >= 100).length} / {goals.length} выполнено
                      </span>
                    )}
                  </div>

                  {tableMissing ? (
                    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Нужна миграция базы данных</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.55 }}>
                        Запусти <strong>supabase/002_phase4.sql</strong> и <strong>supabase/004_goals_category.sql</strong> в Supabase SQL Editor.
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-elev-2)', borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>
                        Supabase Dashboard → SQL Editor → вставь файл → Run
                      </div>
                    </div>
                  ) : isLoading ? (
                    [1,2,3].map(i => (
                      <div key={i} style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Skeleton h={14} w="70%" /><Skeleton h={5} />
                      </div>
                    ))
                  ) : (
                    <>
                      {budget > 0 && <BudgetGoalCard budget={budget} orders={orders} />}
                      {filtered.length === 0 ? (
                        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <Icon name="target" size={26} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                            {searchQuery || filterType ? 'Ничего не найдено' : 'Нет целей — создай первую'}
                          </span>
                          {!searchQuery && !filterType && <Button variant="secondary" icon="plus" onClick={() => setGoalModal(false)}>Новая цель</Button>}
                        </div>
                      ) : (
                        filtered.map(g => <GoalCard key={g.id} goal={g} onEdit={() => setGoalModal(g)} />)
                      )}
                    </>
                  )}
                </div>

                {/* Habits column */}
                <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Привычки · эта неделя</span>
                    {searchQuery && filteredHabits.length !== habits.length && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{filteredHabits.length} из {habits.length}</span>
                    )}
                  </div>
                  <HabitsTracker filteredIds={searchQuery ? new Set(filteredHabits.map(h => h.id)) : null} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
