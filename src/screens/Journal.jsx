import { useState, useEffect } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useJournalEntries, useJournalEntry, useUpsertJournalEntry } from '../hooks/useJournal.js';

function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }

function Skeleton({ h = 14, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
}

/* ---- Heatmap from real data ---- */
function Heatmap({ entries }) {
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
          {week.map(({ key, mood, isFuture }) => (
            <div key={key} title={key} style={{
              width: 14, height: 14, borderRadius: 3,
              background: isFuture
                ? 'transparent'
                : mood
                  ? `color-mix(in oklab, var(--p-health) ${20 + mood * 16}%, transparent)`
                  : 'var(--bg-elev-3)',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---- Today's entry editor ---- */
function TodayEntry() {
  const date = isoDate();
  const { data: entry, isLoading } = useJournalEntry(date);
  const upsert = useUpsertJournalEntry();

  const [body, setBody] = useState('');
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);

  useEffect(() => {
    if (entry) {
      setBody(entry.body ?? '');
      setMood(entry.mood ?? null);
      setEnergy(entry.energy ?? null);
    }
  }, [entry?.id]);

  // Autosave body
  useEffect(() => {
    if (isLoading) return;
    const t = setTimeout(() => {
      upsert.mutate({ date, body });
    }, 700);
    return () => clearTimeout(t);
  }, [body]);

  const setMoodAndSave = (v) => {
    setMood(v);
    upsert.mutate({ date, mood: v });
  };

  const setEnergyAndSave = (v) => {
    setEnergy(v);
    upsert.mutate({ date, energy: v });
  };

  if (isLoading) return (
    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton h={16} w="30%" /><Skeleton h={80} /><Skeleton h={12} w="50%" />
    </div>
  );

  const todayStr = new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Сегодня</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{todayStr}</div>
        </div>

        {/* Mood */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Настроение</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setMoodAndSave(n)}
                onMouseEnter={e => { if (mood !== n) e.currentTarget.style.background = 'var(--bg-elev-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = mood === n ? 'color-mix(in oklab, var(--p-health) 20%, transparent)' : 'var(--bg-elev-2)'; }}
                style={{
                width: 30, height: 30, borderRadius: 7,
                background: mood === n ? 'color-mix(in oklab, var(--p-health) 20%, transparent)' : 'var(--bg-elev-2)',
                border: `1px solid ${mood === n ? 'color-mix(in oklab, var(--p-health) 40%, transparent)' : 'var(--border-subtle)'}`,
                color: mood === n ? 'var(--p-health)' : 'var(--text-3)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, cursor: 'pointer', transition: 'background 100ms',
              }}>
                {['😔','😐','🙂','😊','😄'][n - 1]}
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Энергия</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setEnergyAndSave(n)} style={{
                width: 10, height: energy >= n ? 22 : 10,
                borderRadius: 3,
                background: energy >= n ? 'var(--p-health)' : 'var(--bg-elev-3)',
                border: 'none', cursor: 'pointer',
                transition: 'height 120ms, background 120ms',
              }} />
            ))}
          </div>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 80, textAlign: 'right' }}>
          {upsert.isPending ? 'сохраняется…' : entry ? 'сохранено' : ''}
        </span>
      </div>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Как прошёл день? Что было важным? Что хочешь запомнить?"
        rows={8}
        style={{
          display: 'block', width: '100%',
          padding: '20px 24px',
          background: 'none', border: 'none', outline: 'none',
          resize: 'none', fontSize: 14, lineHeight: 1.7,
          color: 'var(--text)', fontFamily: 'var(--font-sans)',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

/* ---- Recent entries list ---- */
function EntryCard({ entry }) {
  const MOOD_EMOJI = ['', '😔', '😐', '🙂', '😊', '😄'];
  const d = new Date(entry.date);
  const label = d.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' });
  const moodColor = entry.mood >= 4 ? 'var(--p-health)' : entry.mood === 3 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: moodColor, flex: 'none', marginTop: 5 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
          {entry.mood && <span style={{ fontSize: 14 }}>{MOOD_EMOJI[entry.mood]}</span>}
          {entry.energy && <Badge tone="neutral">⚡ {entry.energy}/5</Badge>}
        </div>
      </div>
      <Icon name="chevron_right" size={14} style={{ color: 'var(--text-muted)', flex: 'none' }} />
    </div>
  );
}

export default function Journal() {
  const { data: allEntries = [], isLoading: heatmapLoading } = useJournalEntries();

  const totalDays = allEntries.length;
  const streak = (() => {
    let s = 0;
    const today = isoDate();
    const datesSet = new Set(allEntries.map(e => e.date));
    const d = new Date();
    while (datesSet.has(isoDate(d))) { s++; d.setDate(d.getDate() - 1); }
    return s;
  })();

  const avgMood = allEntries.filter(e => e.mood).length
    ? (allEntries.reduce((a, e) => a + (e.mood ?? 0), 0) / allEntries.filter(e => e.mood).length).toFixed(1)
    : '—';

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar
          title="Дневник"
          sub={`стрик · ${streak} дней · ${totalDays} записей`}
          right={<>
            <Button variant="ghost" size="sm" icon="trending_up">Аналитика</Button>
            <Button variant="secondary" size="sm" icon="edit">Запись сегодня</Button>
          </>}
        />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 32px' }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { l: 'Стрик',         v: `${streak} дн`,    c: streak >= 7 ? 'var(--p-health)' : 'var(--text)' },
              { l: 'Всего записей', v: String(totalDays), c: 'var(--text)' },
              { l: 'Среднее настроение', v: avgMood,      c: 'var(--text)' },
            ].map(s => (
              <div key={s.l} style={{ flex: 1, padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
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
              : <Heatmap entries={allEntries} />
            }
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
            {/* Today entry */}
            <TodayEntry />

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
                [...allEntries].reverse().slice(0, 12).map(e => <EntryCard key={e.id} entry={e} />)
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
