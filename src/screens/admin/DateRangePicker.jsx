import { useState } from 'react';
import { Icon } from '../../icons.jsx';

function startOfWeek(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // неделя с понедельника
  x.setDate(x.getDate() + diff);
  return x;
}
function endOfWeek(d) { const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate() + 6); return e; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d; }

const now = () => new Date();

export const PRESETS = [
  { id: 'today',     label: 'Сегодня',        range: () => ({ start: daysAgo(0), end: now() }) },
  { id: 'week',      label: 'Текущая неделя', range: () => ({ start: startOfWeek(now()), end: now() }) },
  { id: 'lastWeek',  label: 'Прошлая неделя', range: () => { const w = startOfWeek(daysAgo(7)); return { start: w, end: endOfWeek(w) }; } },
  { id: 'month',     label: 'Текущий месяц',  range: () => ({ start: startOfMonth(now()), end: now() }) },
  { id: 'lastMonth', label: 'Прошлый месяц',  range: () => { const m = new Date(now().getFullYear(), now().getMonth() - 1, 1); return { start: startOfMonth(m), end: endOfMonth(m) }; } },
  { id: '7d',        label: '7 дней',         range: () => ({ start: daysAgo(6), end: now() }) },
  { id: '30d',       label: '30 дней',        range: () => ({ start: daysAgo(29), end: now() }) },
  { id: '90d',       label: '90 дней',        range: () => ({ start: daysAgo(89), end: now() }) },
];

function fmt(d) { return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }); }

export function DateRangePicker({ presetId, onChange }) {
  const [open, setOpen] = useState(false);
  const active = PRESETS.find(p => p.id === presetId) ?? PRESETS[6];
  const range = active.range();

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 9,
        border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-1)', color: 'var(--text-2)',
        fontSize: 12.5, cursor: 'pointer',
      }}>
        <Icon name="calendar" size={14} />
        {fmt(range.start)} – {fmt(range.end)}
        <Icon name="chevron_down" size={13} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 20, minWidth: 180,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 5,
          boxShadow: 'var(--shadow-modal)',
        }}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => { onChange(p.id); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7,
                background: p.id === presetId ? 'var(--bg-elev-3)' : 'transparent', color: 'var(--text-2)',
                border: 'none', fontSize: 12.5, cursor: 'pointer',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function resolvePreset(id) {
  return (PRESETS.find(p => p.id === id) ?? PRESETS[6]).range();
}
