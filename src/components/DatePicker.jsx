import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons.jsx';

const WEEK_DAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const MARGIN = 8; // min gap from screen edges

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function fmtDisplay(s) {
  const d = parseISO(s);
  if (!d) return null;
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * DatePicker — кастомный выбор даты в стиле NexoraOS.
 *
 * Props:
 *   value       — строка YYYY-MM-DD или null/''
 *   onChange    — (value: string|null) => void
 *   placeholder — строка (default 'Выбрать дату')
 *   size        — 'sm' | 'md' (default 'md')
 *   disabled    — boolean
 */
export function DatePicker({ value, onChange, placeholder = 'Выбрать дату', size = 'md', disabled = false }) {
  const h  = size === 'sm' ? 28 : 36;
  const fs = size === 'sm' ? 12 : 13;

  const [open, setOpen]         = useState(false);
  const [visible, setVisible]   = useState(false); // two-phase: mount invisible → measure → show
  const [pos, setPos]           = useState({ top: 0, left: 0 });
  const [viewYear, setViewYear]   = useState(() => { const d = parseISO(value); return d ? d.getFullYear() : new Date().getFullYear(); });
  const [viewMonth, setViewMonth] = useState(() => { const d = parseISO(value); return d ? d.getMonth()     : new Date().getMonth(); });

  const triggerRef = useRef(null);
  const popupRef   = useRef(null);

  /* Sync viewMonth/Year when value changes externally */
  useEffect(() => {
    const d = parseISO(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [value]);

  /* Phase 1: open popup invisible */
  const openPicker = () => {
    if (disabled) return;
    setVisible(false);
    setOpen(true);
  };

  /* Phase 2: after popup renders, measure it and set final position */
  useLayoutEffect(() => {
    if (!open || !popupRef.current || !triggerRef.current) return;

    const trigger  = triggerRef.current.getBoundingClientRect();
    const popW     = popupRef.current.offsetWidth;
    const popH     = popupRef.current.offsetHeight;
    const vw       = window.innerWidth;
    const vh       = window.innerHeight;

    /* ── Horizontal ────────────────────────────────────────
       Prefer: align left edge of popup to left edge of trigger.
       Fallback: align right edge of popup to right edge of trigger.
       Always clamp to screen.
    ─────────────────────────────────────────────────────── */
    let left = trigger.left;
    if (left + popW > vw - MARGIN) {
      // Try right-aligning instead
      left = trigger.right - popW;
    }
    left = Math.max(MARGIN, Math.min(left, vw - popW - MARGIN));

    /* ── Vertical ──────────────────────────────────────────
       Prefer: below the trigger (4px gap).
       Fallback: above the trigger.
       Always clamp to screen.
    ─────────────────────────────────────────────────────── */
    const spaceBelow = vh - trigger.bottom - MARGIN;
    const spaceAbove = trigger.top - MARGIN;
    let top;

    if (spaceBelow >= popH) {
      top = trigger.bottom + 4;
    } else if (spaceAbove >= popH) {
      top = trigger.top - popH - 4;
    } else {
      // Not enough space either way — place where there's more room, then clamp
      top = spaceBelow >= spaceAbove
        ? trigger.bottom + 4
        : trigger.top - popH - 4;
      top = Math.max(MARGIN, Math.min(top, vh - popH - MARGIN));
    }

    setPos({ top, left });
    setVisible(true);
  }, [open]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  /* Close (and recompute) on scroll of any container */
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handler, { capture: true });
  }, [open]);

  /* ── Build days grid ──────────────────────────────────── */
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const lastOfMonth  = new Date(viewYear, viewMonth + 1, 0);
  let startDow = firstOfMonth.getDay() - 1; // Mon = 0
  if (startDow < 0) startDow = 6;

  const cells = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ date: new Date(viewYear, viewMonth, i - startDow + 1), curr: false });
  }
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), curr: true });
  }
  while (cells.length < 42) {
    cells.push({ date: new Date(viewYear, viewMonth + 1, cells.length - startDow - lastOfMonth.getDate() + 1), curr: false });
  }

  const todayStr    = isoDate(new Date());
  const selectedStr = value ? value.slice(0, 10) : null;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (d) => {
    onChange(isoDate(d));
    setOpen(false);
  };

  const clearDate = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const goToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    selectDay(today);
  };

  const monthLabel = firstOfMonth.toLocaleDateString('ru', { month: 'long', year: 'numeric' });

  return (
    <>
      {/* ── Trigger ─────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        onClick={openPicker}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: h, padding: '0 12px', width: '100%',
          background: 'var(--bg-elev-1)',
          border: `1px solid ${open ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
          borderRadius: 8, fontSize: fs, cursor: disabled ? 'default' : 'pointer',
          color: value ? 'var(--text)' : 'var(--text-muted)',
          transition: 'border-color 120ms', textAlign: 'left', boxSizing: 'border-box',
          opacity: disabled ? 0.5 : 1,
        }}>
        <Icon name="calendar" size={13} style={{ color: 'var(--text-3)', flex: 'none' }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fmtDisplay(value) ?? placeholder}
        </span>
        {value && !disabled && (
          <span
            onClick={clearDate}
            style={{ width: 18, height: 18, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            ×
          </span>
        )}
      </button>

      {/* ── Popup ───────────────────────────────────────────── */}
      {open && createPortal(
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            opacity: visible ? 1 : 0,          // invisible until positioned
            pointerEvents: visible ? 'auto' : 'none',
            width: 256,
            zIndex: 9999,
            background: 'var(--bg-elev-3)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '14px 12px 10px',
            boxShadow: '0 16px 48px -12px rgba(0,0,0,0.75), 0 4px 16px -4px rgba(0,0,0,0.45)',
            userSelect: 'none',
            transition: 'opacity 80ms',
          }}>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <NavBtn onClick={prevMonth} icon="chevron_left" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
              {monthLabel}
            </span>
            <NavBtn onClick={nextMonth} icon="chevron_right" />
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {WEEK_DAYS_SHORT.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '2px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((cell, i) => {
              const ds      = isoDate(cell.date);
              const isSel   = ds === selectedStr;
              const isToday = ds === todayStr;
              const isWE    = cell.date.getDay() === 0 || cell.date.getDay() === 6;
              return (
                <DayBtn
                  key={i}
                  label={cell.date.getDate()}
                  isSel={isSel}
                  isToday={isToday}
                  isWE={isWE}
                  isCurr={cell.curr}
                  onClick={() => selectDay(cell.date)}
                />
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FooterBtn label="Сегодня" onClick={goToday} />
            {value && <FooterBtn label="Очистить" onClick={clearDate} danger />}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ── Small internal components ──────────────────────────────── */

function NavBtn({ onClick, icon }) {
  return (
    <button onClick={onClick}
      style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'transparent', cursor: 'pointer', border: '1px solid transparent', flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
      <Icon name={icon} size={14} />
    </button>
  );
}

function DayBtn({ label, isSel, isToday, isWE, isCurr, onClick }) {
  const bgBase    = isSel ? 'var(--text)' : isToday ? 'color-mix(in oklab, var(--danger) 18%, transparent)' : 'transparent';
  const bgHover   = isSel ? 'var(--text)' : isToday ? 'color-mix(in oklab, var(--danger) 28%, transparent)' : 'var(--bg-active)';
  const textColor = isSel ? 'var(--bg)' : !isCurr ? 'var(--text-muted)' : isToday ? 'var(--danger)' : isWE ? 'var(--text-3)' : 'var(--text-2)';
  const borderCol = isToday && !isSel ? 'color-mix(in oklab, var(--danger) 38%, transparent)' : 'transparent';

  return (
    <button
      onClick={onClick}
      style={{ height: 30, borderRadius: 8, fontSize: 12, fontWeight: isSel ? 700 : isToday ? 600 : 400, cursor: 'pointer', background: bgBase, color: textColor, border: `1px solid ${borderCol}`, transition: 'background 80ms' }}
      onMouseEnter={e => { e.currentTarget.style.background = bgHover; }}
      onMouseLeave={e => { e.currentTarget.style.background = bgBase; }}>
      {label}
    </button>
  );
}

function FooterBtn({ label, onClick, danger }) {
  const color = danger ? 'var(--danger)' : 'var(--text-3)';
  const bgHover = danger ? 'color-mix(in oklab, var(--danger) 12%, transparent)' : 'var(--bg-active)';
  return (
    <button onClick={onClick}
      style={{ fontSize: 12, color, padding: '4px 10px', borderRadius: 6, background: 'transparent', cursor: 'pointer', border: '1px solid transparent' }}
      onMouseEnter={e => { e.currentTarget.style.background = bgHover; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
      {label}
    </button>
  );
}
