import { useState, useRef } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Tabs } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useWeekEvents, useCreateEvent, useDeleteEvent } from '../hooks/useEvents.js';
import { useProjects } from '../hooks/useProjects.js';

const WEEK_DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

function getMonday(d = new Date()) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function fmtShortDate(d) {
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

/* ---- Create event modal ---- */
function EventModal({ defaultDate, defaultHour, onClose }) {
  const mousedownOnBackdrop = useRef(false);
  const { data: projects = [] } = useProjects();
  const create = useCreateEvent();

  const pad = v => String(v).padStart(2, '0');
  const initDate = defaultDate ? new Date(defaultDate) : new Date();
  const initH = defaultHour ?? initDate.getHours();

  const [title, setTitle]     = useState('');
  const [date, setDate]       = useState(initDate.toISOString().slice(0, 10));
  const [startH, setStartH]   = useState(pad(initH));
  const [startM, setStartM]   = useState('00');
  const [endH, setEndH]       = useState(pad(initH + 1));
  const [endM, setEndM]       = useState('00');
  const [allDay, setAllDay]   = useState(false);
  const [projId, setProjId]   = useState('');
  const [error, setError]     = useState('');

  const submit = async () => {
    if (!title.trim()) { setError('Введи название'); return; }
    const start = allDay ? `${date}T00:00:00` : `${date}T${startH}:${startM}:00`;
    const end   = allDay ? `${date}T23:59:00` : `${date}T${endH}:${endM}:00`;
    if (!allDay && new Date(end) <= new Date(start)) { setError('Время конца должно быть позже начала'); return; }
    await create.mutateAsync({
      title: title.trim(), start_at: start, end_at: end, all_day: allDay,
      project_id: projId || null,
      color_token: projId ? null : '--p-openresto',
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 420, boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Новое событие</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Название *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Standup, созвон с клиентом…" autoFocus
            style={{ height: 38, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Дата</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ height: 38, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ width: 16, height: 16 }} />
            Весь день
          </label>
        </div>

        {!allDay && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Начало</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input type="number" min="0" max="23" value={startH} onChange={e => setStartH(String(e.target.value).padStart(2,'0'))}
                  style={{ flex: 1, height: 36, padding: '0 8px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', textAlign: 'center' }} />
                <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>:</span>
                <input type="number" min="0" max="59" step="5" value={startM} onChange={e => setStartM(String(e.target.value).padStart(2,'0'))}
                  style={{ flex: 1, height: 36, padding: '0 8px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', textAlign: 'center' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Конец</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input type="number" min="0" max="23" value={endH} onChange={e => setEndH(String(e.target.value).padStart(2,'0'))}
                  style={{ flex: 1, height: 36, padding: '0 8px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', textAlign: 'center' }} />
                <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>:</span>
                <input type="number" min="0" max="59" step="5" value={endM} onChange={e => setEndM(String(e.target.value).padStart(2,'0'))}
                  style={{ flex: 1, height: 36, padding: '0 8px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', textAlign: 'center' }} />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Проект (опционально)</label>
          <select value={projId} onChange={e => setProjId(e.target.value)}
            style={{ height: 36, padding: '0 10px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}>
            <option value="">— нет —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={submit}>Создать</Button>
        </div>
      </div>
    </div>
  );
}

const CAL_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8–20

export default function Calendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal]   = useState(null); // null | { date, hour }

  const weekStart = getMonday(new Date(Date.now() + weekOffset * 7 * 86400000));
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const { data: events = [], isLoading } = useWeekEvents(weekStart);
  const deleteEvent = useDeleteEvent();

  const slotH = 44;
  const totalH = CAL_HOURS.length * slotH;
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const nowTop = (nowH - CAL_HOURS[0]) * slotH;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const PROJECT_COLORS = [
    { token: '--p-youmin', name: 'Youmin' }, { token: '--p-openresto', name: 'OpenResto' },
    { token: '--p-diploma', name: 'Дипломы' }, { token: '--p-sites', name: 'Сайты' },
    { token: '--p-bots', name: 'Боты' }, { token: '--p-girl', name: 'Аня' },
    { token: '--p-family', name: 'Семья' },
  ];

  return (
    <>
      {showModal && (
        <EventModal defaultDate={showModal.date} defaultHour={showModal.hour} onClose={() => setShowModal(null)} />
      )}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            breadcrumb={`${fmtShortDate(weekDates[0])} – ${fmtShortDate(weekDates[6])}`}
            title="Календарь"
            sub={isLoading ? '…' : `${events.length} событий`}
            right={<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                <IconButton icon="chevron_left" onClick={() => setWeekOffset(w => w - 1)} />
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Сегодня</Button>
                <IconButton icon="chevron_right" onClick={() => setWeekOffset(w => w + 1)} />
              </div>
              <Tabs items={['День', 'Неделя', 'Месяц']} active="Неделя" />
              <Button variant="secondary" size="sm" icon="plus" onClick={() => setShowModal({ date: todayStr, hour: today.getHours() })}>Событие</Button>
            </>}
          />

          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* Left panel */}
            <aside style={{ width: 240, flex: 'none', borderRight: '1px solid var(--border-subtle)', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--bg)' }}>
              {/* Mini cal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {weekDates[0].toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <IconButton icon="chevron_left" size="sm" onClick={() => setWeekOffset(w => w - 1)} />
                    <IconButton icon="chevron_right" size="sm" onClick={() => setWeekOffset(w => w + 1)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                  {WEEK_DAYS.map(d => <span key={d} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>{d}</span>)}
                  {weekDates.map(d => {
                    const isToday = d.toISOString().slice(0,10) === todayStr;
                    const inWeek = weekOffset === 0;
                    return <span key={d}
                      onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--bg-elev-3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'var(--text)' : inWeek ? 'var(--bg-elev-2)' : 'transparent'; }}
                      style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '5px 0', borderRadius: 6, color: isToday ? 'var(--bg)' : inWeek ? 'var(--text)' : 'var(--text-3)', background: isToday ? 'var(--text)' : inWeek ? 'var(--bg-elev-2)' : 'transparent', cursor: 'pointer', transition: 'background 80ms' }}
                      onClick={() => setShowModal({ date: d.toISOString().slice(0,10), hour: 9 })}>
                      {d.getDate()}
                    </span>;
                  })}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 0' }}>Цвета проектов</span>
                {PROJECT_COLORS.map(p => (
                  <label key={p.token} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 6px', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', cursor: 'default' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: `var(${p.token})`, flex: 'none' }} />
                    <span style={{ flex: 1 }}>{p.name}</span>
                  </label>
                ))}
              </div>
            </aside>

            {/* Week grid */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7,1fr)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div />
                {weekDates.map((d, i) => {
                  const isToday = d.toISOString().slice(0,10) === todayStr;
                  return (
                    <div key={i} style={{ padding: '12px 14px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{WEEK_DAYS[i]}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 999, background: isToday ? 'var(--text)' : 'transparent', color: isToday ? 'var(--bg)' : 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{d.getDate()}</span>
                        {isToday && <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>сегодня</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* All-day strip */}
              <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7,1fr)', borderBottom: '1px solid var(--border-subtle)', minHeight: 32, padding: '4px 0' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '6px 6px 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>весь день</div>
                {weekDates.map((d, i) => {
                  const dayStr = d.toISOString().slice(0,10);
                  const dayAllDay = events.filter(e => e.all_day && e.start_at.slice(0,10) === dayStr);
                  return (
                    <div key={i} style={{ borderLeft: '1px solid var(--border-subtle)', padding: 4, minHeight: 28 }}>
                      {dayAllDay.map(e => {
                        const color = e.project?.color_token || e.color_token || '--p-openresto';
                        return (
                          <div key={e.id} style={{ padding: '3px 8px', background: `color-mix(in oklab, var(${color}) 16%, transparent)`, borderLeft: `2px solid var(${color})`, borderRadius: '0 5px 5px 0', fontSize: 11, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                            <button onClick={() => deleteEvent.mutate(e.id)} style={{ opacity: 0.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}><Icon name="x" size={10} /></button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Timed grid */}
              <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7,1fr)' }}>
                  <div style={{ position: 'relative', height: totalH }}>
                    {CAL_HOURS.map((h, i) => (
                      <span key={h} style={{ position: 'absolute', left: 8, top: i * slotH - 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{String(h).padStart(2,'0')}:00</span>
                    ))}
                  </div>
                  {weekDates.map((d, di) => {
                    const dayStr = d.toISOString().slice(0,10);
                    const isToday = dayStr === todayStr;
                    const dayEvents = events.filter(e => !e.all_day && e.start_at.startsWith(dayStr));
                    return (
                      <div key={di} style={{ position: 'relative', borderLeft: '1px solid var(--border-subtle)', height: totalH, background: isToday ? 'color-mix(in oklab, var(--text) 1.5%, transparent)' : 'transparent' }}>
                        {/* Slots (click to create) */}
                        {CAL_HOURS.map((h, hi) => (
                          <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: hi * slotH, height: slotH, borderTop: '1px solid var(--border-subtle)', opacity: 0.5, cursor: 'pointer' }}
                            onClick={() => setShowModal({ date: dayStr, hour: h })} />
                        ))}
                        {/* Events */}
                        {dayEvents.map((e, j) => {
                          const startDate = new Date(e.start_at);
                          const endDate = new Date(e.end_at);
                          const top = (startDate.getHours() + startDate.getMinutes() / 60 - CAL_HOURS[0]) * slotH + 1;
                          const h = Math.max(22, ((endDate - startDate) / 3600000) * slotH - 2);
                          const color = e.project?.color_token || e.color_token || '--p-openresto';
                          return (
                            <div key={e.id} style={{ position: 'absolute', top, height: h, left: 3, right: 3, padding: '4px 7px', background: `color-mix(in oklab, var(${color}) 16%, transparent)`, borderLeft: `2px solid var(${color})`, borderRadius: '0 6px 6px 0', overflow: 'hidden', zIndex: j + 1 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.title}</span>
                                <button onClick={() => deleteEvent.mutate(e.id)} style={{ opacity: 0.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', flex: 'none' }}><Icon name="x" size={10} /></button>
                              </div>
                              {h > 30 && <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtTime(e.start_at)}</span>}
                            </div>
                          );
                        })}
                        {/* Now line */}
                        {isToday && nowH >= CAL_HOURS[0] && nowH <= CAL_HOURS[CAL_HOURS.length - 1] && (
                          <div style={{ position: 'absolute', left: 0, right: 0, top: nowTop, zIndex: 10 }}>
                            <div style={{ position: 'relative', height: 1, background: 'var(--danger)' }}>
                              <span style={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: 999, background: 'var(--danger)' }} />
                            </div>
                          </div>
                        )}
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
