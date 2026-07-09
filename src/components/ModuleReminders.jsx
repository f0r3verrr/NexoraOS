import { Icon } from '../icons.jsx';
import { usePersonalReminders } from '../hooks/usePersonalReminders.js';

/*
 * Amber-плашка со срочными напоминаниями модуля.
 * Вставляется в начало скролл-области страниц Машина / Отношения / Дом.
 */
export function ModuleReminderBanner({ module }) {
  const reminders = usePersonalReminders().filter(r => r.module === module);
  if (reminders.length === 0) return null;

  const hasDanger = reminders.some(r => r.tone === '--danger');
  const accent = hasDanger ? '--danger' : '--warn';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px', marginBottom: 16,
      background: `color-mix(in oklab, var(${accent}) 8%, var(--bg-elev-1))`,
      border: `1px solid color-mix(in oklab, var(${accent}) 30%, transparent)`,
      borderRadius: 12,
    }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in oklab, var(${accent}) 16%, transparent)`, color: `var(${accent})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>
        <Icon name="bell" size={14} />
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: `var(${accent})` }}>
          {reminders.length === 1 ? 'Требует внимания' : `Требуют внимания · ${reminders.length}`}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 18, rowGap: 4 }}>
          {reminders.map((r, i) => (
            <span key={i} style={{ fontSize: 13, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: 'var(--text)' }}>{r.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{r.sub}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
