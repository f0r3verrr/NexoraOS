import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Tabs } from '../components/primitives.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useWeekEvents, useDayEvents, useMonthEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../hooks/useEvents.js';
import { useProjects } from '../hooks/useProjects.js';
import { ru } from '../lib/plural.js';

/* ─── Constants ──────────────────────────────────────────── */
const WEEK_DAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const WEEK_DAYS_FULL  = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const MONTH_GENITIVE  = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DOW_NAMES       = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const CAL_HOURS = Array.from({ length: 24 }, (_, i) => i); // 00–23
const COL_W = 64; // time-label column width (px)

/* ─── Helpers ────────────────────────────────────────────── */
function getMonday(d = new Date()) {
  const day = d.getDay();
  const m = new Date(d);
  m.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  m.setHours(0, 0, 0, 0);
  return m;
}
function isoDate(d) {
  // Use local date (not UTC) so midnight-local doesn't bleed into previous UTC day
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(s, n) { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDate(d); }
function fmtTime(iso) { if (!iso) return ''; const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function fmtShortDate(d) { return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }); }
function fmtDate(iso) { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' }); }

/* ─── EventModal (create + edit) ────────────────────────── */
function EventModal({ defaultDate, defaultHour, initialEvent, onClose }) {
  const mousedownOnBackdrop = useRef(false);
  const { data: projects = [] } = useProjects();
  const create = useCreateEvent();
  const update = useUpdateEvent();

  const pad = v => String(Math.max(0, Math.min(+v || 0, 23))).padStart(2, '0');
  const initDate = initialEvent
    ? initialEvent.start_at.slice(0, 10)
    : (defaultDate || isoDate(new Date()));
  const initH = initialEvent
    ? new Date(initialEvent.start_at).getHours()
    : (defaultHour ?? new Date().getHours());

  const fmtHM = (iso) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

  const [title,  setTitle]  = useState(initialEvent?.title ?? '');
  const [date,   setDate]   = useState(initDate);
  const [startT, setStartT] = useState(initialEvent ? fmtHM(initialEvent.start_at) : `${pad(initH)}:00`);
  const [endT,   setEndT]   = useState(initialEvent ? fmtHM(initialEvent.end_at)   : `${pad(Math.min(23, initH + 1))}:00`);
  const [allDay, setAllDay] = useState(initialEvent?.all_day ?? false);
  const [projId, setProjId] = useState(initialEvent?.project_id ?? '');
  const [url,    setUrl]    = useState(initialEvent?.url ?? '');
  const [recurrence, setRecurrence] = useState(initialEvent?.recurrence ?? 'none');
  const [error,  setError]  = useState('');

  // Recurrence options derived from selected date
  const dateObj = new Date(date + 'T12:00:00');
  const dayName = DOW_NAMES[dateObj.getDay()].toLowerCase();
  const dayNum  = dateObj.getDate();
  const monName = MONTH_GENITIVE[dateObj.getMonth()];
  const RECUR_OPTIONS = [
    { value: 'none',     label: 'Не повторяется' },
    { value: 'daily',    label: 'Ежедневно' },
    { value: 'weekly',   label: `Еженедельно — ${dayName}` },
    { value: 'weekdays', label: 'По будням (пн–пт)' },
    { value: 'monthly',  label: `Ежемесячно, ${dayNum} числа` },
    { value: 'yearly',   label: `Ежегодно, ${dayNum} ${monName}` },
  ];

  const submit = async () => {
    if (!title.trim()) { setError('Введи название'); return; }
    // Convert local datetime string to UTC ISO — "2026-07-08T10:00:00" is treated as local time by JS
    const start = allDay ? new Date(`${date}T00:00:00`).toISOString() : new Date(`${date}T${startT}:00`).toISOString();
    const end   = allDay ? new Date(`${date}T23:59:00`).toISOString() : new Date(`${date}T${endT}:00`).toISOString();
    if (!allDay && new Date(end) <= new Date(start)) { setError('Конец должен быть позже начала'); return; }
    const payload = { title: title.trim(), start_at: start, end_at: end, all_day: allDay, project_id: projId || null, url: url.trim() || null, recurrence };
    try {
      if (initialEvent) {
        await update.mutateAsync({ id: initialEvent.id, ...payload });
      } else {
        await create.mutateAsync({ ...payload, color_token: projId ? null : '--p-openresto' });
      }
      onClose();
    } catch (err) {
      setError(err?.message ?? 'Ошибка сохранения');
    }
  };

  const sx = { height: 36, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', width: '100%' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      {/* Hide browser time-input chrome */}
      <style>{`.cal-time::-webkit-calendar-picker-indicator{display:none;opacity:0}.cal-time::-webkit-inner-spin-button{display:none}`}</style>

      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 450, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{initialEvent ? 'Редактировать событие' : 'Новое событие'}</span>
          <button onClick={onClose} style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={16} /></button>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Название *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Standup, созвон с клиентом…" autoFocus
            style={{ ...sx, fontSize: 14, height: 40 }} />
        </div>

        {/* Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Дата</label>
          <DatePicker value={date} onChange={v => v && setDate(v)} />
        </div>

        {/* All day */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ width: 15, height: 15 }} />
          Весь день
        </label>

        {/* Time inputs */}
        {!allDay && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Начало</label>
              <input type="time" value={startT} onChange={e => setStartT(e.target.value)}
                className="cal-time"
                style={{ ...sx, fontFamily: 'var(--font-mono)', cursor: 'text' }} />
            </div>
            <span style={{ color: 'var(--text-muted)', marginTop: 20, fontSize: 13 }}>→</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Конец</label>
              <input type="time" value={endT} onChange={e => setEndT(e.target.value)}
                className="cal-time"
                style={{ ...sx, fontFamily: 'var(--font-mono)', cursor: 'text' }} />
            </div>
          </div>
        )}

        {/* Recurrence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Повторение</label>
          <select value={recurrence} onChange={e => setRecurrence(e.target.value)} style={{ ...sx }}>
            {RECUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Ссылка (опционально)</label>
          <div style={{ position: 'relative' }}>
            <Icon name="link" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://meet.google.com/…"
              style={{ ...sx, paddingLeft: 30 }} />
          </div>
        </div>

        {/* Project */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Проект (опционально)</label>
          <select value={projId} onChange={e => setProjId(e.target.value)} style={{ ...sx }}>
            <option value="">— нет —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit}>{initialEvent ? 'Сохранить' : 'Создать'}</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── EventDetailModal ───────────────────────────────────── */
const RECUR_LABELS = { none: null, daily: 'Ежедневно', weekly: 'Еженедельно', weekdays: 'По будням (пн–пт)', monthly: 'Ежемесячно', yearly: 'Ежегодно' };

function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  const mousedownOnBackdrop = useRef(false);
  const color = event.project?.color_token || event.color_token || '--p-openresto';
  const startDate = new Date(event.start_at);
  const endDate   = new Date(event.end_at);

  const dateStr = startDate.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = event.all_day ? 'Весь день' : `${fmtTime(event.start_at)} – ${fmtTime(event.end_at)}`;
  const recurLabel = RECUR_LABELS[event.recurrence];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', width: 380, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Color accent strip + header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: `var(${color})`, flex: 'none', marginTop: 3 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>{event.title}</div>
            {event.project && (
              <div style={{ fontSize: 12, color: `var(${color})`, marginTop: 2 }}>{event.project.name}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 2, flex: 'none' }}>
            <button onClick={onEdit} title="Редактировать"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <Icon name="edit" size={14} />
            </button>
            <button onClick={onDelete} title="Удалить"
              onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklab, var(--danger) 12%, transparent)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <Icon name="trash" size={14} />
            </button>
            <button onClick={onClose}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 26 }}>
          {/* Date + time */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Icon name="calendar" size={14} style={{ color: 'var(--text-muted)', flex: 'none', marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>{dateStr}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{timeStr}</div>
            </div>
          </div>

          {/* Recurrence */}
          {recurLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="refresh" size={14} style={{ color: 'var(--text-muted)', flex: 'none' }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{recurLabel}</span>
            </div>
          )}

          {/* URL */}
          {event.url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="link" size={14} style={{ color: 'var(--text-muted)', flex: 'none' }} />
              <a href={event.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: 'var(--p-openresto)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.url.replace(/^https?:\/\//, '')}</span>
                <Icon name="external" size={11} style={{ flex: 'none' }} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Event block (timed grid) ───────────────────────────── */
function EventBlock({ event, top, height, onClick, onDelete }) {
  const color = event.project?.color_token || event.color_token || '--p-openresto';
  return (
    <div onClick={onClick} style={{ position: 'absolute', top, height, left: 3, right: 3, padding: '4px 7px', background: `color-mix(in oklab, var(${color}) 18%, transparent)`, borderLeft: `2px solid var(${color})`, borderRadius: '0 6px 6px 0', overflow: 'hidden', zIndex: 1, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{event.title}</span>
        {event.url && (
          <a href={event.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--text-3)', display: 'flex', flex: 'none' }}>
            <Icon name="external" size={10} />
          </a>
        )}
        <button onClick={e => { e.stopPropagation(); onDelete(event.id); }} style={{ opacity: 0.5, color: 'var(--text-3)', display: 'flex', flex: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Icon name="x" size={10} />
        </button>
      </div>
      {height > 30 && <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtTime(event.start_at)}</span>}
      {event._recurring && height > 46 && <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block' }}>↻ повторяется</span>}
    </div>
  );
}

/* ─── All-day chip ───────────────────────────────────────── */
function AllDayChip({ event, onClick, onDelete }) {
  const color = event.project?.color_token || event.color_token || '--p-openresto';
  return (
    <div onClick={onClick} style={{ padding: '2px 7px', background: `color-mix(in oklab, var(${color}) 16%, transparent)`, borderLeft: `2px solid var(${color})`, borderRadius: '0 4px 4px 0', fontSize: 11, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginBottom: 1 }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{event.title}</span>
      {event.url && (
        <a href={event.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--text-3)', display: 'flex', flex: 'none' }}>
          <Icon name="external" size={10} />
        </a>
      )}
      <button onClick={e => { e.stopPropagation(); onDelete(event.id); }} style={{ opacity: 0.5, color: 'var(--text-3)', display: 'flex', flex: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Icon name="x" size={10} />
      </button>
    </div>
  );
}

/* ─── Timed grid ─────────────────────────────────────────── */
function TimedGrid({ dates, events, todayStr, slotH, onSlotClick, onDelete, onEventClick }) {
  const totalH = CAL_HOURS.length * slotH;
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowTop = (nowH - CAL_HOURS[0]) * slotH;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${COL_W}px repeat(${dates.length},1fr)` }}>
      {/* Hour label column */}
      <div style={{ position: 'relative', height: totalH }}>
        {CAL_HOURS.map((h, i) => (
          <span key={h} style={{ position: 'absolute', right: 8, top: i === 0 ? 2 : i * slotH - 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
            {String(h).padStart(2,'0')}:00
          </span>
        ))}
      </div>
      {/* Day columns */}
      {dates.map((d, di) => {
        const dayStr = isoDate(d);
        const isToday = dayStr === todayStr;
        const dayEvents = events.filter(e => !e.all_day && e.start_at.startsWith(dayStr));
        return (
          <div key={di} style={{ position: 'relative', borderLeft: '1px solid var(--border-subtle)', height: totalH, background: isToday ? 'color-mix(in oklab, var(--text) 1.5%, transparent)' : 'transparent' }}>
            {CAL_HOURS.map((h, hi) => (
              <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: hi * slotH, height: slotH, borderTop: '1px solid var(--border-subtle)', opacity: 0.5, cursor: 'pointer' }}
                onClick={() => onSlotClick({ date: dayStr, hour: h })} />
            ))}
            {dayEvents.map(e => {
              const s = new Date(e.start_at), en = new Date(e.end_at);
              const top = (s.getHours() + s.getMinutes() / 60 - CAL_HOURS[0]) * slotH + 1;
              const h = Math.max(22, ((en - s) / 3600000) * slotH - 2);
              return <EventBlock key={e.id + e.start_at} event={e} top={top} height={h} onClick={() => onEventClick(e)} onDelete={onDelete} />;
            })}
            {isToday && nowH >= CAL_HOURS[0] && nowH <= CAL_HOURS[CAL_HOURS.length - 1] && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: nowTop, zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ position: 'relative', height: 1, background: 'var(--danger)' }}>
                  <span style={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: 999, background: 'var(--danger)' }} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── WeekView ──────────────────────────────────────────── */
function WeekView({ weekStart, events, todayStr, onSlotClick, onDelete, onEventClick }) {
  const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const allDay = events.filter(e => e.all_day);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const h = new Date().getHours();
    scrollRef.current.scrollTop = Math.max(0, (h - 1) * 44);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `${COL_W}px repeat(7,1fr)`, borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
        <div />
        {dates.map((d, i) => {
          const isToday = isoDate(d) === todayStr;
          return (
            <div key={i} style={{ padding: '10px 12px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{WEEK_DAYS_SHORT[i]}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 28, height: 28, borderRadius: 999, background: isToday ? 'var(--text)' : 'transparent', color: isToday ? 'var(--bg)' : 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{d.getDate()}</span>
                {isToday && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>сегодня</span>}
              </span>
            </div>
          );
        })}
      </div>
      {/* All-day strip */}
      <div style={{ display: 'grid', gridTemplateColumns: `${COL_W}px repeat(7,1fr)`, borderBottom: '1px solid var(--border-subtle)', minHeight: 28, padding: '3px 0', flex: 'none' }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', padding: '5px 8px 0', letterSpacing: '0.04em', textAlign: 'right' }}>весь<br/>день</div>
        {dates.map((d, i) => {
          const dayStr = isoDate(d);
          return (
            <div key={i} style={{ borderLeft: '1px solid var(--border-subtle)', padding: '2px 3px', minHeight: 24, display: 'flex', flexDirection: 'column' }}>
              {allDay.filter(e => e.start_at.slice(0,10) === dayStr).map(e => (
                <AllDayChip key={e.id + e.start_at} event={e} onClick={() => onEventClick(e)} onDelete={onDelete} />
              ))}
            </div>
          );
        })}
      </div>
      <div ref={scrollRef} className="ws-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <TimedGrid dates={dates} events={events} todayStr={todayStr} slotH={44} onSlotClick={onSlotClick} onDelete={onDelete} onEventClick={onEventClick} />
      </div>
    </div>
  );
}

/* ─── DayView ────────────────────────────────────────────── */
function DayView({ dateStr, events, todayStr, onSlotClick, onDelete, onEventClick }) {
  const d = new Date(dateStr + 'T12:00:00');
  const dowIdx = (d.getDay() + 6) % 7;
  const allDayEvts = events.filter(e => e.all_day && e.start_at.slice(0,10) === dateStr);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const h = new Date().getHours();
    scrollRef.current.scrollTop = Math.max(0, (h - 1) * 60);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `${COL_W}px 1fr`, borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
        <div />
        <div style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{WEEK_DAYS_FULL[dowIdx]}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 36, height: 36, borderRadius: 999, background: dateStr === todayStr ? 'var(--text)' : 'transparent', color: dateStr === todayStr ? 'var(--bg)' : 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{d.getDate()}</span>
            {dateStr === todayStr && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>сегодня</span>}
          </span>
        </div>
      </div>
      {allDayEvts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `${COL_W}px 1fr`, borderBottom: '1px solid var(--border-subtle)', padding: '3px 0', flex: 'none' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', padding: '5px 8px 0', textAlign: 'right' }}>весь<br/>день</div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', padding: '2px 3px', display: 'flex', flexDirection: 'column' }}>
            {allDayEvts.map(e => <AllDayChip key={e.id + e.start_at} event={e} onClick={() => onEventClick(e)} onDelete={onDelete} />)}
          </div>
        </div>
      )}
      <div ref={scrollRef} className="ws-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <TimedGrid dates={[d]} events={events} todayStr={todayStr} slotH={60} onSlotClick={onSlotClick} onDelete={onDelete} onEventClick={onEventClick} />
      </div>
    </div>
  );
}

/* ─── MonthView ─────────────────────────────────────────── */
function MonthView({ year, month, events, todayStr, onDayClick, onDelete, onEventClick }) {
  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount   = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border-subtle)', flex: 'none' }}>
        {WEEK_DAYS_SHORT.map(d => (
          <div key={d} style={{ padding: '10px 12px', borderLeft: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>
      <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: 'minmax(90px, 1fr)' }}>
          {Array.from({ length: cellCount }, (_, i) => {
            const day = i - firstDow + 1;
            const valid = day >= 1 && day <= daysInMonth;
            const dateStr = valid ? `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : null;
            const isToday = dateStr === todayStr;
            const dayEvts = dateStr ? events.filter(e => e.start_at.slice(0,10) === dateStr) : [];
            return (
              <div key={i}
                onClick={() => valid && onDayClick(dateStr)}
                onMouseEnter={e => { if (valid) e.currentTarget.style.background = isToday ? 'color-mix(in oklab, var(--text) 5%, transparent)' : 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'color-mix(in oklab, var(--text) 2%, transparent)' : 'transparent'; }}
                style={{ borderLeft: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '6px 8px', background: isToday ? 'color-mix(in oklab, var(--text) 2%, transparent)' : 'transparent', cursor: valid ? 'pointer' : 'default', minHeight: 90 }}>
                {valid && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: isToday ? 'var(--text)' : 'transparent', color: isToday ? 'var(--bg)' : 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{day}</span>
                    </div>
                    {dayEvts.slice(0, 3).map(e => {
                      const c = e.project?.color_token || e.color_token || '--p-openresto';
                      return (
                        <div key={e.id + e.start_at} onClick={ev => { ev.stopPropagation(); onEventClick(e); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 5px', marginBottom: 1, background: `color-mix(in oklab, var(${c}) 14%, transparent)`, borderLeft: `2px solid var(${c})`, borderRadius: '0 4px 4px 0', fontSize: 10, color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                          {!e.all_day && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: 9, flex: 'none' }}>{fmtTime(e.start_at)}</span>}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                        </div>
                      );
                    })}
                    {dayEvts.length > 3 && <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 5px' }}>+{dayEvts.length - 3} ещё</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Project filter row ─────────────────────────────────── */
function CalProjRow({ label, color, checked, onToggle }) {
  return (
    <button onClick={onToggle}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 6px', borderRadius: 6, fontSize: 13, color: checked ? 'var(--text-2)' : 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', width: '100%', background: 'transparent', border: 'none', transition: 'background 80ms' }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, flex: 'none', background: checked ? `color-mix(in oklab, var(${color}) 28%, transparent)` : 'var(--bg-elev-3)', border: `1.5px solid ${checked ? `var(${color})` : 'var(--border)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}>
        {checked && <Icon name="check" size={9} style={{ color: `var(${color})` }} />}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

/* ─── Calendar ───────────────────────────────────────────── */
export default function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const today    = new Date();
  const todayStr = isoDate(today);

  const view      = searchParams.get('view')  || 'week';
  const dateParam = searchParams.get('date')  || todayStr;
  const hideParam = searchParams.get('hide')  || '';
  const hiddenSet = useMemo(() => new Set(hideParam ? hideParam.split(',') : []), [hideParam]);

  const [anchorDate, setAnchorDate] = useState(dateParam);
  const anchorObj  = new Date(anchorDate + 'T12:00:00');
  const weekStart  = getMonday(anchorObj);
  const monthYear  = { year: anchorObj.getFullYear(), month: anchorObj.getMonth() };

  // Modals
  const [showModal,   setShowModal]   = useState(null); // {date, hour} | null
  const [detailEvent, setDetailEvent] = useState(null); // event | null
  const [editEvent,   setEditEvent]   = useState(null); // event | null

  // Handle ?new=1 from sidebar button
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowModal({ date: todayStr, hour: today.getHours() });
      const p = new URLSearchParams(searchParams);
      p.delete('new');
      setSearchParams(p, { replace: true });
    }
  }, [searchParams.get('new')]);

  // Sync anchor from URL
  useEffect(() => {
    if (dateParam && dateParam !== anchorDate) setAnchorDate(dateParam);
  }, [dateParam]);

  const { data: projects = [] } = useProjects();
  const { data: weekEvents  = [], isLoading: wL } = useWeekEvents(weekStart);
  const { data: dayEvents   = [], isLoading: dL } = useDayEvents(anchorObj);
  const { data: monthEvents = [], isLoading: mL } = useMonthEvents(monthYear.year, monthYear.month);

  const rawEvents = view === 'day' ? dayEvents : view === 'month' ? monthEvents : weekEvents;
  const isLoading = view === 'day' ? dL : view === 'month' ? mL : wL;

  const deleteEvent = useDeleteEvent();

  const filteredEvents = useMemo(() => {
    if (hiddenSet.size === 0) return rawEvents;
    return rawEvents.filter(e => !hiddenSet.has(e.project_id ?? 'none'));
  }, [rawEvents, hiddenSet]);

  const setView = (v) => {
    const p = new URLSearchParams(searchParams);
    p.set('view', v); p.set('date', anchorDate);
    setSearchParams(p, { replace: true });
  };

  const updateAnchor = (d) => {
    setAnchorDate(d);
    const p = new URLSearchParams(searchParams);
    p.set('date', d);
    setSearchParams(p, { replace: true });
  };

  const goPrev = () => {
    if (view === 'day') updateAnchor(addDays(anchorDate, -1));
    else if (view === 'week') updateAnchor(addDays(anchorDate, -7));
    else { const d = new Date(anchorDate + 'T12:00:00'); d.setMonth(d.getMonth() - 1); updateAnchor(isoDate(d)); }
  };
  const goNext = () => {
    if (view === 'day') updateAnchor(addDays(anchorDate, 1));
    else if (view === 'week') updateAnchor(addDays(anchorDate, 7));
    else { const d = new Date(anchorDate + 'T12:00:00'); d.setMonth(d.getMonth() + 1); updateAnchor(isoDate(d)); }
  };
  const goToday = () => updateAnchor(todayStr);

  const toggleProject = (id) => {
    const p = new URLSearchParams(searchParams);
    const next = new Set(hiddenSet);
    if (next.has(id)) next.delete(id); else next.add(id);
    if (next.size === 0) p.delete('hide'); else p.set('hide', [...next].join(','));
    setSearchParams(p, { replace: true });
  };

  // Breadcrumb
  let breadcrumb = '';
  if (view === 'day') {
    breadcrumb = new Date(anchorDate + 'T12:00:00').toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });
  } else if (view === 'week') {
    const wDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
    breadcrumb = `${fmtShortDate(wDates[0])} – ${fmtShortDate(wDates[6])}`;
  } else {
    breadcrumb = new Date(monthYear.year, monthYear.month, 1).toLocaleDateString('ru', { month: 'long', year: 'numeric' });
  }

  const handleEventClick = (e) => setDetailEvent(e);
  const handleDelete = (id) => { deleteEvent.mutate(id); setDetailEvent(null); };

  return (
    <>
      {/* Create modal */}
      {showModal && (
        <EventModal defaultDate={showModal.date} defaultHour={showModal.hour} onClose={() => setShowModal(null)} />
      )}
      {/* Edit modal */}
      {editEvent && (
        <EventModal initialEvent={editEvent} onClose={() => setEditEvent(null)} />
      )}
      {/* Detail modal */}
      {detailEvent && !editEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={() => { setEditEvent(detailEvent); setDetailEvent(null); }}
          onDelete={() => handleDelete(detailEvent.id)}
        />
      )}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            breadcrumb={breadcrumb}
            title="Календарь"
            sub={isLoading ? '…' : ru.events(filteredEvents.length)}
            right={<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                <IconButton icon="chevron_left" onClick={goPrev} />
                <Button variant="ghost" size="sm" onClick={goToday}>Сегодня</Button>
                <IconButton icon="chevron_right" onClick={goNext} />
              </div>
              <Tabs
                items={['День', 'Неделя', 'Месяц']}
                active={view === 'day' ? 'День' : view === 'month' ? 'Месяц' : 'Неделя'}
                onSelect={label => setView(label === 'День' ? 'day' : label === 'Месяц' ? 'month' : 'week')}
              />
            </>}
          />

          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* Project filter sidebar */}
            {projects.length > 0 && (
              <aside style={{ width: 196, flex: 'none', borderRight: '1px solid var(--border-subtle)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--bg)', overflowY: 'auto' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '4px 6px 6px', fontWeight: 600 }}>Мои календари</span>
                <CalProjRow label="Личный" color="--p-openresto" checked={!hiddenSet.has('none')} onToggle={() => toggleProject('none')} />
                {projects.map(p => (
                  <CalProjRow key={p.id} label={p.name} color={p.color_token} checked={!hiddenSet.has(p.id)} onToggle={() => toggleProject(p.id)} />
                ))}
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 6px' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '2px 6px 4px', fontWeight: 600 }}>Другие календари</span>
                <button onClick={() => navigate('/settings?section=integrations')}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
                  <Icon name="plus" size={12} />
                  Добавить календарь
                </button>
              </aside>
            )}

            {view === 'week' && (
              <WeekView weekStart={weekStart} events={filteredEvents} todayStr={todayStr}
                onSlotClick={setShowModal} onDelete={handleDelete} onEventClick={handleEventClick} />
            )}
            {view === 'day' && (
              <DayView dateStr={anchorDate} events={filteredEvents} todayStr={todayStr}
                onSlotClick={setShowModal} onDelete={handleDelete} onEventClick={handleEventClick} />
            )}
            {view === 'month' && (
              <MonthView year={monthYear.year} month={monthYear.month} events={filteredEvents} todayStr={todayStr}
                onDayClick={dateStr => { updateAnchor(dateStr); setView('day'); }}
                onDelete={handleDelete} onEventClick={handleEventClick} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
