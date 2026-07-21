import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, Badge } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import {
  useJournalEntries, useJournalEntry,
  useUpsertJournalEntry, useDeleteJournalEntry,
} from '../hooks/useJournal.js';

function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }

const MOOD_EMOJI  = ['', '😔', '😐', '🙂', '😊', '😄'];
const MOOD_LABEL  = ['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'];
const DAY_SHORT   = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function Skeleton({ h = 14, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }} />;
}

/* ── Heatmap ─────────────────────────────────────────────── */
function Heatmap({ entries, onCellClick }) {
  const [hovered, setHovered] = useState(null);
  const map = {};
  for (const e of entries) map[e.date] = e.mood ?? 1;

  const today = new Date();
  const weeks = 21;
  const cells = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekCells = [];
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - (w * 7 + d));
      const key = isoDate(dt);
      const mood = map[key];
      weekCells.push({ key, mood, isFuture: dt > today });
    }
    cells.push(weekCells);
  }

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {cells.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {week.map(({ key, mood, isFuture }) => {
            const clickable = !isFuture && mood;
            return (
              <div
                key={key}
                title={key}
                onClick={clickable ? () => onCellClick(key) : undefined}
                onMouseEnter={() => clickable && setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  cursor: clickable ? 'pointer' : 'default',
                  background: isFuture
                    ? 'transparent'
                    : mood
                      ? `color-mix(in oklab, var(--p-health) ${20 + mood * 16}%, transparent)`
                      : 'var(--bg-elev-3)',
                  outline: hovered === key ? '2px solid var(--p-health)' : 'none',
                  outlineOffset: 1,
                  transition: 'outline 80ms',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── Shared mood/energy pickers ──────────────────────────── */
function MoodPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Настроение</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            title={MOOD_LABEL[n]}
            onMouseEnter={e => { if (value !== n) e.currentTarget.style.background = 'var(--bg-elev-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = value === n ? 'color-mix(in oklab, var(--p-health) 20%, transparent)' : 'var(--bg-elev-2)'; }}
            style={{
              width: 30, height: 30, borderRadius: 7,
              background: value === n ? 'color-mix(in oklab, var(--p-health) 20%, transparent)' : 'var(--bg-elev-2)',
              border: `1px solid ${value === n ? 'color-mix(in oklab, var(--p-health) 40%, transparent)' : 'var(--border-subtle)'}`,
              color: value === n ? 'var(--p-health)' : 'var(--text-3)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, cursor: 'pointer', transition: 'background 100ms',
            }}>
            {MOOD_EMOJI[n]}
          </button>
        ))}
      </div>
    </div>
  );
}

function EnergyPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Энергия</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            width: 10, height: value >= n ? 22 : 10,
            borderRadius: 3,
            background: value >= n ? 'var(--p-health)' : 'var(--bg-elev-3)',
            border: 'none', cursor: 'pointer',
            transition: 'height 120ms, background 120ms',
          }} />
        ))}
      </div>
    </div>
  );
}

/* ── EntryModal — view/edit any date ─────────────────────── */
function EntryModal({ date, onClose }) {
  const { data: entry, isLoading } = useJournalEntry(date);
  const upsert  = useUpsertJournalEntry();
  const destroy = useDeleteJournalEntry();

  const [body,    setBody]    = useState('');
  const [mood,    setMood]    = useState(null);
  const [energy,  setEnergy]  = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (entry && !initialized.current) {
      setBody(entry.body ?? '');
      setMood(entry.mood ?? null);
      setEnergy(entry.energy ?? null);
      initialized.current = true;
    }
    if (!entry && !isLoading) {
      initialized.current = true;
    }
  }, [entry, isLoading]);

  // Autosave body
  useEffect(() => {
    if (!initialized.current) return;
    const t = setTimeout(() => { upsert.mutate({ date, body }); }, 700);
    return () => clearTimeout(t);
  }, [body]);

  const saveMood   = (v) => { setMood(v);   upsert.mutate({ date, mood: v }); };
  const saveEnergy = (v) => { setEnergy(v); upsert.mutate({ date, energy: v }); };

  const handleDelete = async () => {
    await destroy.mutateAsync(date);
    onClose();
  };

  const dateLabel = (() => {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const words = body.trim().split(/\s+/).filter(Boolean).length;

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none' }}>
        <div onClick={e => e.stopPropagation()} className="ws-scroll" style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: 620, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
          borderRadius: 16, boxShadow: 'var(--shadow-modal)',
          animation: 'scalein 140ms ease-out',
        }}>
          {/* Header */}
          <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{dateLabel}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {upsert.isPending ? 'сохраняется…' : entry ? 'сохранено' : 'новая запись'}
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}>
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* Mood + Energy */}
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 24, flexShrink: 0 }}>
            <MoodPicker value={mood} onChange={saveMood} />
            <EnergyPicker value={energy} onChange={saveEnergy} />
            {mood && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{MOOD_EMOJI[mood]}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{MOOD_LABEL[mood]}</span>
              </div>
            )}
          </div>

          {/* Textarea */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {isLoading ? (
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton h={14} /><Skeleton h={14} w="80%" /><Skeleton h={14} w="60%" />
              </div>
            ) : (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Как прошёл этот день? Что запомнилось?"
                className="ws-scroll"
                style={{
                  flex: 1, display: 'block', width: '100%', minHeight: 220,
                  padding: '18px 22px',
                  background: 'none', border: 'none', outline: 'none',
                  resize: 'none', fontSize: 14, lineHeight: 1.7,
                  color: 'var(--text)', fontFamily: 'var(--font-sans)',
                }}
              />
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 22px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {words} {words === 1 ? 'слово' : words >= 2 && words <= 4 ? 'слова' : 'слов'} · {body.length} симв.
            </span>
            <div style={{ flex: 1 }} />
            {confirmDelete ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Удалить навсегда?</span>
                <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>Отмена</button>
                <button onClick={handleDelete} disabled={destroy.isPending} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, background: 'color-mix(in oklab, var(--danger) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 35%, transparent)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {destroy.isPending ? 'Удаляем…' : 'Да, удалить'}
                </button>
              </>
            ) : (
              entry && (
                <button onClick={() => setConfirmDelete(true)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  Удалить запись
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── AnalyticsModal ──────────────────────────────────────── */
function AnalyticsModal({ entries, onClose }) {
  // Mood distribution
  const moodCounts = [0, 0, 0, 0, 0];
  for (const e of entries) if (e.mood) moodCounts[e.mood - 1]++;
  const maxMoodCount = Math.max(...moodCounts, 1);

  // Monthly activity — last 6 months
  const monthBuckets = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    monthBuckets[key] = { label: d.toLocaleDateString('ru', { month: 'short' }), count: 0, daysInMonth };
  }
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    if (monthBuckets[key]) monthBuckets[key].count++;
  }
  const months = Object.values(monthBuckets);

  // Best day of week
  const dayMoods = Array.from({ length: 7 }, () => ({ sum: 0, cnt: 0 }));
  for (const e of entries) {
    if (!e.mood) continue;
    const day = new Date(e.date + 'T00:00:00').getDay();
    dayMoods[day].sum += e.mood;
    dayMoods[day].cnt++;
  }
  const dayAvgs = dayMoods.map((d, i) => ({ day: DAY_SHORT[i], avg: d.cnt ? d.sum / d.cnt : 0 }));
  const bestDay = dayAvgs.reduce((a, b) => b.avg > a.avg ? b : a, dayAvgs[0]);

  // Best streak
  const dates = new Set(entries.map(e => e.date));
  let bestStreak = 0, cur = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const s = isoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i));
    if (dates.has(s)) { cur++; if (cur > bestStreak) bestStreak = cur; }
    else cur = 0;
  }

  const avgMood = entries.filter(e => e.mood).length
    ? (entries.reduce((a, e) => a + (e.mood ?? 0), 0) / entries.filter(e => e.mood).length).toFixed(1)
    : '—';

  const topCards = [
    { label: 'Всего записей', value: entries.length, color: 'var(--text)' },
    { label: 'Лучший стрик', value: `${bestStreak} дн`, color: 'var(--p-health)' },
    { label: 'Среднее настроение', value: avgMood, color: '#F5C518' },
    { label: 'Лучший день', value: bestDay.avg > 0 ? bestDay.day : '—', color: 'var(--p-openresto)' },
  ];

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none' }}>
        <div onClick={e => e.stopPropagation()} className="ws-scroll" style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--bg-elev-1)', border: '1px solid var(--border)',
          borderRadius: 16, boxShadow: 'var(--shadow-modal)',
          animation: 'scalein 140ms ease-out',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Аналитика дневника</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>За последние 365 дней</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}>
              <Icon name="x" size={14} />
            </button>
          </div>

          <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {topCards.map(c => (
                <div key={c.label} style={{ padding: '14px 16px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.color, marginBottom: 4 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Mood distribution */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Распределение настроения</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[5,4,3,2,1].map(n => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{MOOD_EMOJI[n]}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--bg-elev-3)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${(moodCounts[n-1] / maxMoodCount) * 100}%`,
                        background: `color-mix(in oklab, var(--p-health) ${20 + n * 16}%, transparent)`,
                        transition: 'width 600ms ease-out',
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', width: 24, textAlign: 'right' }}>{moodCounts[n-1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly activity */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Активность по месяцам</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
                {months.map(m => (
                  <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', background: 'var(--bg-elev-3)', borderRadius: '4px 4px 0 0', height: 64, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                      <div style={{
                        width: '100%',
                        height: `${(m.count / m.daysInMonth) * 100}%`,
                        background: 'var(--p-health)',
                        opacity: 0.7,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 600ms ease-out',
                        minHeight: m.count > 0 ? 4 : 0,
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best day of week */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Настроение по дням недели</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
                {dayAvgs.map(({ day, avg }) => (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', height: 48, background: 'var(--bg-elev-3)', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                      <div style={{
                        width: '100%',
                        height: `${(avg / 5) * 100}%`,
                        background: day === bestDay.day && avg > 0 ? 'var(--p-openresto)' : 'var(--p-health)',
                        opacity: 0.65,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 600ms ease-out',
                        minHeight: avg > 0 ? 3 : 0,
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: day === bestDay.day && avg > 0 ? 'var(--p-openresto)' : 'var(--text-3)', fontWeight: day === bestDay.day && avg > 0 ? 600 : 400 }}>{day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── TodayEntry ───────────────────────────────────────────── */
function TodayEntry({ focusRef }) {
  const date = isoDate();
  const { data: entry, isLoading } = useJournalEntry(date);
  const upsert = useUpsertJournalEntry();

  const [body,   setBody]   = useState('');
  const [mood,   setMood]   = useState(null);
  const [energy, setEnergy] = useState(null);
  const initialized = useRef(false);
  const textareaRef = useRef(null);

  // Expose focus trigger to parent
  if (focusRef) focusRef.current = () => textareaRef.current?.focus();

  useEffect(() => {
    if (entry && !initialized.current) {
      setBody(entry.body ?? '');
      setMood(entry.mood ?? null);
      setEnergy(entry.energy ?? null);
      initialized.current = true;
    }
    if (!entry && !isLoading) initialized.current = true;
  }, [entry, isLoading]);

  // Autosave body — only after initialized
  useEffect(() => {
    if (!initialized.current) return;
    const t = setTimeout(() => { upsert.mutate({ date, body }); }, 700);
    return () => clearTimeout(t);
  }, [body]);

  const saveMood   = (v) => { setMood(v);   upsert.mutate({ date, mood: v }); };
  const saveEnergy = (v) => { setEnergy(v); upsert.mutate({ date, energy: v }); };

  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const todayStr = new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });

  if (isLoading) return (
    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton h={16} w="30%" /><Skeleton h={80} /><Skeleton h={12} w="50%" />
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Сегодня</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{todayStr}</div>
        </div>
        <MoodPicker value={mood} onChange={saveMood} />
        <EnergyPicker value={energy} onChange={saveEnergy} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 80, textAlign: 'right' }}>
          {upsert.isPending ? 'сохраняется…' : entry ? 'сохранено' : ''}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Как прошёл день? Что было важным? Что хочешь запомнить?"
        rows={8}
        className="ws-scroll"
        style={{
          display: 'block', width: '100%',
          padding: '20px 24px',
          background: 'none', border: 'none', outline: 'none',
          resize: 'none', fontSize: 14, lineHeight: 1.7,
          color: 'var(--text)', fontFamily: 'var(--font-sans)',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ padding: '6px 24px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {words} {words === 1 ? 'слово' : words >= 2 && words <= 4 ? 'слова' : 'слов'} · {body.length} симв.
        </span>
      </div>
    </div>
  );
}

/* ── EntryCard ───────────────────────────────────────────── */
function EntryCard({ entry, onClick }) {
  const d = new Date(entry.date + 'T00:00:00');
  const label = d.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' });
  const moodColor = entry.mood >= 4 ? 'var(--p-health)' : entry.mood === 3 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 100ms' }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 999, background: entry.mood ? moodColor : 'var(--bg-elev-3)', flex: 'none', marginTop: 5 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
          {entry.mood && <span style={{ fontSize: 14 }}>{MOOD_EMOJI[entry.mood]}</span>}
          {entry.energy && <Badge tone="neutral">⚡ {entry.energy}/5</Badge>}
        </div>
      </div>
      <Icon name="chevron_right" size={14} style={{ color: 'var(--text-muted)', flex: 'none' }} />
    </div>
  );
}

/* ── Journal (main) ──────────────────────────────────────── */
export default function Journal() {
  const { data: allEntries = [], isLoading: heatmapLoading } = useJournalEntries();

  const [searchParams, setSearchParams] = useSearchParams();
  const [modalDate,     setModalDate]     = useState(() => searchParams.get('date') || null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const todayRef  = useRef(null);
  const focusRef  = useRef(null);

  // Sync URL param → modal
  useEffect(() => {
    const d = searchParams.get('date');
    if (d) { setModalDate(d); setSearchParams({}, { replace: true }); }
  }, [searchParams]);

  const handleWriteToday = () => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => focusRef.current?.(), 400);
  };

  // Stats
  const totalDays = allEntries.length;

  const streak = (() => {
    let s = 0;
    const datesSet = new Set(allEntries.map(e => e.date));
    const d = new Date();
    while (datesSet.has(isoDate(d))) { s++; d.setDate(d.getDate() - 1); }
    return s;
  })();

  const avgMood = allEntries.filter(e => e.mood).length
    ? (allEntries.reduce((a, e) => a + (e.mood ?? 0), 0) / allEntries.filter(e => e.mood).length).toFixed(1)
    : null;

  // Mood trend: last 7 days vs prior 7 days
  const moodTrend = (() => {
    const today = new Date();
    const d7ago  = isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
    const d14ago = isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14));
    const last7  = allEntries.filter(e => e.mood && e.date > d7ago);
    const prev7  = allEntries.filter(e => e.mood && e.date > d14ago && e.date <= d7ago);
    if (!last7.length || !prev7.length) return null;
    const avgL = last7.reduce((s, e) => s + e.mood, 0) / last7.length;
    const avgP = prev7.reduce((s, e) => s + e.mood, 0) / prev7.length;
    const diff = avgL - avgP;
    if (Math.abs(diff) < 0.15) return { sign: '→', label: 'стабильно', color: 'var(--text-2)' };
    return diff > 0
      ? { sign: '↑', label: `+${diff.toFixed(1)}`, color: 'var(--p-health)' }
      : { sign: '↓', label: diff.toFixed(1), color: 'var(--danger)' };
  })();

  const statCards = [
    { l: 'Стрик',              v: `${streak} дн`,            c: streak >= 7 ? 'var(--p-health)' : 'var(--text)' },
    { l: 'Всего записей',      v: String(totalDays),          c: 'var(--text)' },
    { l: 'Среднее настроение', v: avgMood ?? '—',             c: 'var(--text)' },
    { l: 'Тренд настроения',   v: moodTrend ? `${moodTrend.sign} ${moodTrend.label}` : '—', c: moodTrend?.color ?? 'var(--text-muted)' },
  ];

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          title="Дневник"
          sub={`стрик · ${streak} дней · ${totalDays} записей`}
          right={<>
            <Button variant="ghost" size="sm" icon="trending_up" onClick={() => setShowAnalytics(true)}>Аналитика</Button>
            <Button variant="secondary" size="sm" icon="edit" onClick={handleWriteToday}>Запись сегодня</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 32px' }}>
          {/* Stats row */}
          <div className="admin-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {statCards.map(s => (
              <div key={s.l} style={{ padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{s.l}</div>
                <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Активность · 21 неделя</span>
              {heatmapLoading ? <Skeleton h={12} w={80} /> : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
                  <span>меньше</span>
                  {[0,1,2,3].map(v => <span key={v} style={{ width: 12, height: 12, borderRadius: 3, background: v === 0 ? 'var(--bg-elev-3)' : `color-mix(in oklab, var(--p-health) ${20 + v * 25}%, transparent)` }} />)}
                  <span>больше</span>
                </div>
              )}
            </div>
            {heatmapLoading
              ? <Skeleton h={80} />
              : <Heatmap entries={allEntries} onCellClick={setModalDate} />
            }
          </div>

          <div className="rstack-lg" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
            {/* Today entry */}
            <div ref={todayRef}>
              <TodayEntry focusRef={focusRef} />
            </div>

            {/* Recent entries */}
            <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>История</span>
              </div>
              {heatmapLoading ? (
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3,4].map(i => <Skeleton key={i} h={12} w={`${60 + i * 8}%`} />)}
                </div>
              ) : allEntries.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Нет записей — начни сегодня!
                </div>
              ) : (
                [...allEntries].reverse().slice(0, 12).map(e => (
                  <EntryCard key={e.id} entry={e} onClick={() => setModalDate(e.date)} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {modalDate     && <EntryModal     date={modalDate}  onClose={() => setModalDate(null)} />}
      {showAnalytics && <AnalyticsModal entries={allEntries} onClose={() => setShowAnalytics(false)} />}
    </div>
  );
}
