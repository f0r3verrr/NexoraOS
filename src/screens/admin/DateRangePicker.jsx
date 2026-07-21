import { useState } from 'react';
import { Icon } from '../../icons.jsx';

/*
 * Postgres на сервере хранит/группирует created_at::date в UTC (SHOW
 * timezone = UTC). Раньше здесь считали границы в ЛОКАЛЬНОМ времени
 * браузера (getDate/setDate/getHours), а потом сериализовали в
 * "YYYY-MM-DD" через toISOString() (UTC) — для часовых поясов восточнее
 * UTC (Москва и т.д.) локальная полночь оказывается предыдущим днём в
 * UTC, и весь диапазон/подписи сдвигались на сутки относительно
 * реальных данных. Поэтому вся арифметика здесь — в UTC.
 */
function utcMidnight(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
function addDaysUTC(d, n) { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; }
function startOfWeekUTC(d) {
  const x = utcMidnight(d);
  const dow = x.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow; // неделя с понедельника
  return addDaysUTC(x, diff);
}
function endOfWeekUTC(d) { return addDaysUTC(startOfWeekUTC(d), 6); }
function startOfMonthUTC(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function endOfMonthUTC(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)); }
function daysAgoUTC(n) { return addDaysUTC(utcMidnight(new Date()), -n); }

const nowUTC = () => new Date();

export const PRESETS = [
  { id: 'today',     label: 'Сегодня',        range: () => ({ start: daysAgoUTC(0), end: nowUTC() }) },
  { id: 'week',      label: 'Текущая неделя', range: () => ({ start: startOfWeekUTC(nowUTC()), end: nowUTC() }) },
  { id: 'lastWeek',  label: 'Прошлая неделя', range: () => { const w = startOfWeekUTC(daysAgoUTC(7)); return { start: w, end: endOfWeekUTC(w) }; } },
  { id: 'month',     label: 'Текущий месяц',  range: () => ({ start: startOfMonthUTC(nowUTC()), end: nowUTC() }) },
  { id: 'lastMonth', label: 'Прошлый месяц',  range: () => { const m = new Date(Date.UTC(nowUTC().getUTCFullYear(), nowUTC().getUTCMonth() - 1, 1)); return { start: startOfMonthUTC(m), end: endOfMonthUTC(m) }; } },
  { id: '7d',        label: '7 дней',         range: () => ({ start: daysAgoUTC(6), end: nowUTC() }) },
  { id: '30d',       label: '30 дней',        range: () => ({ start: daysAgoUTC(29), end: nowUTC() }) },
  { id: '90d',       label: '90 дней',        range: () => ({ start: daysAgoUTC(89), end: nowUTC() }) },
];

function fmt(d) { return d.toLocaleDateString('ru', { day: 'numeric', month: 'short', timeZone: 'UTC' }); }

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
