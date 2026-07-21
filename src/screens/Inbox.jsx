import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../icons.jsx';
import { Button, IconButton, ProjectTag, Progress } from '../components/primitives.jsx';
import { DatePicker } from '../components/DatePicker.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useProjects } from '../hooks/useProjects.js';
import {
  useInboxItems, useAddInboxItem, useResolveInboxItem, useDeleteInboxItem,
  useSnoozeInboxItem, useSnoozedItems, useResolveAllItems, useUnsnoozeItem,
  useResolvedItems, useUnresolveItem, useUnresolveAllItems,
} from '../hooks/useInbox.js';
import { useCreateTask } from '../hooks/useTasks.js';
import { supabase } from '../lib/supabase.js';
import { useQueryClient } from '@tanstack/react-query';

/* ─── Constants ──────────────────────────────────────────── */
const SRC_ICON  = { telegram: 'send', web: 'globe', voice: 'mic', email: 'message' };
const SRC_LABEL = { telegram: 'Telegram', web: 'Web', voice: 'Голос', email: 'Email' };

const SUGGEST_META = {
  task:     { label: 'Задача',      icon: 'check', color: 'var(--p-openresto)' },
  note:     { label: 'Заметка',     icon: 'note',  color: 'var(--p-sites)'     },
  reminder: { label: 'Напоминание', icon: 'bell',  color: 'var(--warn)'        },
  contact:  { label: 'Контакт',     icon: 'users', color: 'var(--p-family)'    },
};

const PRIORITY_COLOR = { 1: '--danger', 2: '--warn', 3: '--info' };
const PRIORITY_LABEL = { 1: 'P1', 2: 'P2', 3: 'P3' };

/* ─── Helpers ────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '';
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now - d;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'только что';
  if (mins < 60)  return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'вчера';
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

function fmtSnoozeDate(iso) {
  if (!iso) return '';
  const d    = new Date(iso);
  const now  = new Date();
  const diff = d - now;
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (diff <= 0)  return 'прямо сейчас';
  if (hours < 1)  return 'менее чем через час';
  if (hours < 24) return `через ${hours} ч`;
  if (days === 1) return 'завтра';
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ─── SnoozeMenu ─────────────────────────────────────────── */
function SnoozeMenu({ itemId, pos, onClose }) {
  const snooze = useSnoozeInboxItem();
  const ref = useRef(null);

  useEffect(() => {
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc  = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  const pick = (date) => { snooze.mutate({ id: itemId, until: date.toISOString() }); onClose(); };

  const inHours    = (h) => { const d = new Date(); d.setHours(d.getHours() + h, 0, 0, 0); return d; };
  const todayAt    = (h) => { const d = new Date(); d.setHours(h, 0, 0, 0); return d; };
  const tomorrowAt = (h) => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, 0, 0, 0); return d; };
  const inDaysAt   = (n, h) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d; };
  const nextMondayAt = (h) => {
    const d = new Date(); const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? 1 : 8 - day)); d.setHours(h, 0, 0, 0); return d;
  };

  const OPTIONS = [
    { label: 'Через 1 час',      sub: `~${inHours(1).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}`, fn: () => pick(inHours(1)) },
    { label: 'Сегодня вечером',  sub: '18:00',  fn: () => pick(todayAt(18)) },
    { label: 'Завтра утром',     sub: '09:00',  fn: () => pick(tomorrowAt(9)) },
    { label: 'Через 3 дня',      sub: inDaysAt(3,9).toLocaleDateString('ru',{weekday:'short',day:'numeric',month:'short'}), fn: () => pick(inDaysAt(3,9)) },
    { label: 'Следующая неделя', sub: nextMondayAt(9).toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'short'}), fn: () => pick(nextMondayAt(9)) },
  ];

  const MENU_W = 260;
  const MENU_H = 5 * 32 + 10; // 5 пунктов + padding
  // body { zoom } искажает координаты: rect приходит в визуальных px,
  // а left/top у fixed-элемента применяются в зумированной системе — делим на zoom
  const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
  const vw = window.innerWidth  / zoom;
  const vh = window.innerHeight / zoom;
  const ax = pos.x / zoom;
  const ay = pos.y / zoom;
  // якорим правый край меню к правому краю кнопки; у низа экрана открываем вверх
  const left = Math.max(8, Math.min(ax - MENU_W, vw - MENU_W - 8));
  const top  = ay + 4 + MENU_H > vh - 8
    ? Math.max(8, ay - MENU_H - 32)
    : ay + 4;

  return createPortal(
    <div ref={ref} style={{
      position: 'fixed', left, top, zIndex: 200, width: MENU_W, boxSizing: 'border-box',
      background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
      borderRadius: 10, boxShadow: 'var(--shadow-modal)', padding: 5,
      display: 'flex', flexDirection: 'column', gap: 1,
    }}>
      {OPTIONS.map((opt, i) => (
        <button key={i} onClick={opt.fn}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{opt.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.sub}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}

/* ─── ConvertToTaskModal ─────────────────────────────────── */
function ConvertToTaskModal({ item, onClose }) {
  const { data: projects = [] } = useProjects();
  const create  = useCreateTask();
  const resolve = useResolveInboxItem();
  const mousedownOnBackdrop = useRef(false);

  const [title,    setTitle]    = useState(item.text);
  const [date,     setDate]     = useState(todayStr());
  const [time,     setTime]     = useState('');
  const [priority, setPriority] = useState(null);
  const [projId,   setProjId]   = useState(item.suggested_project_id ?? '');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!title.trim()) { setError('Введи название'); return; }
    setLoading(true);
    try {
      const due_at = date
        ? (time ? new Date(`${date}T${time}:00`).toISOString() : new Date(`${date}T09:00:00`).toISOString())
        : null;
      await create.mutateAsync({ title: title.trim(), due_at, priority, project_id: projId || null, kanban_status: 'todo' });
      await resolve.mutateAsync(item.id);
      onClose();
    } catch (e) {
      setError(e?.message ?? 'Ошибка');
      setLoading(false);
    }
  };

  const sx = { height: 36, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <style>{`.cal-time::-webkit-calendar-picker-indicator{display:none}`}</style>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 440, maxWidth: '100%', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Создать задачу</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>и разобрать из Inbox</div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={16} /></button>
        </div>

        <textarea value={title} onChange={e => setTitle(e.target.value)} placeholder="Название задачи…" autoFocus rows={3}
          style={{ ...sx, height: 'auto', padding: '10px 12px', resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.5, fontSize: 14 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Дата</label>
            <DatePicker value={date} onChange={v => v && setDate(v)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Время</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="cal-time"
              style={{ ...sx, fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Приоритет</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[null, 1, 2, 3].map(p => {
              const active = priority === p;
              const color  = p ? `var(${PRIORITY_COLOR[p]})` : 'var(--text-2)';
              return (
                <button key={p ?? 'none'} onClick={() => setPriority(p)}
                  style={{ height: 30, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${active ? color : 'var(--border-subtle)'}`, background: active ? `color-mix(in oklab, ${color} 14%, transparent)` : 'transparent', color: active ? color : 'var(--text-3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms' }}>
                  {p ? PRIORITY_LABEL[p] : 'Без'}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Проект</label>
          <select value={projId} onChange={e => setProjId(e.target.value)} style={sx}>
            <option value="">— нет —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" icon="check" onClick={submit} disabled={loading}>
            {loading ? 'Создаём…' : 'Создать задачу и разобрать'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── ConvertToNoteModal ─────────────────────────────────── */
function ConvertToNoteModal({ item, onClose }) {
  const { data: projects = [] } = useProjects();
  const resolve  = useResolveInboxItem();
  const qc       = useQueryClient();
  const mousedownOnBackdrop = useRef(false);

  const FOLDERS  = ['Личное', 'Работа', 'Идеи', 'Архив'];
  const [title,   setTitle]   = useState('');
  const [body,    setBody]    = useState(item.text);
  const [folder,  setFolder]  = useState('Личное');
  const [projId,  setProjId]  = useState(item.suggested_project_id ?? '');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) { setError('Введи заголовок'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: noteErr } = await supabase.from('notes').insert({
        user_id: user.id, title: title.trim(), body, folder, project_id: projId || null,
      });
      if (noteErr) throw noteErr;
      qc.invalidateQueries({ queryKey: ['notes'] });
      await resolve.mutateAsync(item.id);
      onClose();
    } catch (e) {
      setError(e?.message ?? 'Ошибка');
      setLoading(false);
    }
  };

  const sx = { height: 36, padding: '0 12px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, boxSizing: 'border-box' }}
      onMouseDown={e => { mousedownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mousedownOnBackdrop.current) onClose(); }}>
      <div className="modal-enter" style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 440, maxWidth: '100%', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Создать заметку</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>и разобрать из Inbox</div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={16} /></button>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Заголовок заметки…" autoFocus
          style={{ ...sx, height: 40, fontSize: 14 }} />

        <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Текст заметки…"
          style={{ ...sx, height: 'auto', padding: '10px 12px', resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Папка</label>
            <select value={folder} onChange={e => setFolder(e.target.value)} style={sx}>
              {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Проект</label>
            <select value={projId} onChange={e => setProjId(e.target.value)} style={sx}>
              <option value="">— нет —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="primary" icon="note" onClick={submit} disabled={loading}>
            {loading ? 'Создаём…' : 'Создать заметку и разобрать'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── InboxRow ───────────────────────────────────────────── */
function InboxRow({ item, isSelected, onSelect, onConvertTask, onConvertNote, onSnoozeMenu, onResolve }) {
  const remove  = useDeleteInboxItem();
  const suggested = item.suggested_type ? SUGGEST_META[item.suggested_type] : null;
  const woken = item.snoozed_until && new Date(item.snoozed_until) <= new Date();

  return (
    <div
      onClick={onSelect}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      style={{
        display: 'flex', gap: 14, padding: '14px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        borderLeft: isSelected ? '3px solid var(--p-openresto)' : '3px solid transparent',
        background: isSelected ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 80ms, border-color 80ms',
        cursor: 'pointer',
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 2 }}>
        <Icon name={SRC_ICON[item.source] ?? 'globe'} size={13} />
      </span>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>{fmtDate(item.created_at)}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span>{SRC_LABEL[item.source] ?? item.source}</span>
          {woken && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--warn)', fontWeight: 500 }}>
              <Icon name="bell" size={10} /> проснулось
            </span>
          )}
          {item.duration_sec != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--warn)' }}>
              <Icon name="mic" size={10} /> {Math.floor(item.duration_sec / 60)}:{String(item.duration_sec % 60).padStart(2,'0')}
            </span>
          )}
        </div>

        <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{item.text}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {suggested && (
            <button
              onClick={e => { e.stopPropagation(); item.suggested_type === 'note' ? onConvertNote(item) : onConvertTask(item); }}
              onMouseEnter={e => e.currentTarget.style.background = `color-mix(in oklab, ${suggested.color} 22%, transparent)`}
              onMouseLeave={e => e.currentTarget.style.background = `color-mix(in oklab, ${suggested.color} 12%, transparent)`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px', borderRadius: 6, border: `1px solid color-mix(in oklab, ${suggested.color} 35%, transparent)`, background: `color-mix(in oklab, ${suggested.color} 12%, transparent)`, color: suggested.color, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'background 100ms' }}>
              <Icon name={suggested.icon} size={11} /> ★ {suggested.label}
            </button>
          )}

          <button onClick={e => { e.stopPropagation(); onConvertTask(item); }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-2)', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', transition: 'background 100ms' }}>
            <Icon name="check" size={11} /> → Задача
          </button>

          <button onClick={e => { e.stopPropagation(); onConvertNote(item); }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-2)', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', transition: 'background 100ms' }}>
            <Icon name="note" size={11} /> → Заметка
          </button>

          {item.project && (
            <>
              <span style={{ color: 'var(--border)', fontSize: 11 }}>·</span>
              <ProjectTag projectToken={item.project.color_token} label={item.project.name} size="sm" />
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 'none', paddingTop: 2 }}>
        <IconButton icon="snooze" title="Отложить" size="sm" onClick={e => { e.stopPropagation(); onSnoozeMenu(e, item.id); }} />
        <IconButton icon="check"  title="Разобрано" size="sm" onClick={e => { e.stopPropagation(); onResolve(item); }} />
        <IconButton icon="trash"  title="Удалить"   size="sm" onClick={e => { e.stopPropagation(); remove.mutate(item.id); }} />
      </div>
    </div>
  );
}

/* ─── ResolvedRow ────────────────────────────────────────── */
function ResolvedRow({ item }) {
  const unresolve = useUnresolveItem();
  const remove    = useDeleteInboxItem();

  return (
    <div
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', transition: 'background 80ms' }}
    >
      <span style={{ width: 24, height: 24, borderRadius: 999, background: 'color-mix(in oklab, var(--success) 14%, transparent)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 2 }}>
        <Icon name="check" size={12} />
      </span>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>{fmtDate(item.resolved_at ?? item.created_at)}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span>{SRC_LABEL[item.source] ?? item.source}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, textDecoration: 'line-through', textDecorationColor: 'var(--border)' }}>{item.text}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 'none', paddingTop: 2 }}>
        <IconButton icon="inbox" title="Вернуть в Inbox" size="sm" onClick={() => unresolve.mutate(item.id)} />
        <IconButton icon="trash" title="Удалить"         size="sm" onClick={() => remove.mutate(item.id)} />
      </div>
    </div>
  );
}

/* ─── SnoozedRow ─────────────────────────────────────────── */
function SnoozedRow({ item, onConvertTask, onSnoozeMenu, onResolve }) {
  const unsnooze = useUnsnoozeItem();
  const remove   = useDeleteInboxItem();

  return (
    <div
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', transition: 'background 80ms' }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 2 }}>
        <Icon name="snooze" size={13} />
      </span>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--text-3)' }}>Проснётся {fmtSnoozeDate(item.snoozed_until)}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span style={{ color: 'var(--text-muted)' }}>{SRC_LABEL[item.source] ?? item.source}</span>
        </div>

        <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{item.text}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => onResolve(item)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-2)', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', transition: 'background 100ms' }}>
            <Icon name="check" size={11} /> Разобрать
          </button>
          <button onClick={() => onConvertTask(item)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elev-2)'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-elev-2)', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', transition: 'background 100ms' }}>
            <Icon name="check" size={11} /> → Задача
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 'none', paddingTop: 2 }}>
        <IconButton icon="snooze" title="Перенести на другое время" size="sm" onClick={e => { e.stopPropagation(); onSnoozeMenu(e, item.id); }} />
        <IconButton icon="inbox"  title="Вернуть в Inbox сейчас"    size="sm" onClick={() => unsnooze.mutate(item.id)} />
        <IconButton icon="trash"  title="Удалить"                   size="sm" onClick={() => remove.mutate(item.id)} />
      </div>
    </div>
  );
}

/* ─── CaptureBox ─────────────────────────────────────────── */
function CaptureBox() {
  const [text,    setText]    = useState('');
  const [source,  setSource]  = useState('web');
  const [loading, setLoading] = useState(false);
  const add = useAddInboxItem();
  const textareaRef = useRef(null);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      await add.mutateAsync({ text: trimmed, source });
      setText('');
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <div style={{ padding: '14px 16px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 9, minHeight: 68 }}>
        <Icon name="zap" size={15} style={{ color: 'var(--text-3)', marginTop: 3, flex: 'none' }} />
        <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
          placeholder="Что не забыть? Запиши сейчас — разберёшь позже…"
          rows={2} className="no-ring"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 14, color: text ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.55, fontFamily: 'var(--font-sans)' }} />
        <Button variant="primary" icon="send" onClick={submit} disabled={loading || !text.trim()}
          style={{ opacity: text.trim() ? 1 : 0.4, flex: 'none' }}>
          {loading ? '…' : 'В Inbox'}
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Источник:</span>
        {[
          { i: 'send',    l: 'Telegram', v: 'telegram' },
          { i: 'globe',   l: 'Web',      v: 'web'      },
          { i: 'message', l: 'Email',    v: 'email'    },
        ].map(s => (
          <button key={s.v} onClick={() => setSource(s.v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 5, fontSize: 11,
            background: source === s.v ? 'var(--bg-elev-3)' : 'transparent',
            color: source === s.v ? 'var(--text)' : 'var(--text-3)',
            border: `1px solid ${source === s.v ? 'var(--border)' : 'transparent'}`,
            cursor: 'pointer', transition: 'all 100ms',
          }}>
            <Icon name={s.i} size={10} /> {s.l}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>⌘↵</span>
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
function Skeleton({ h = 14, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }} />;
}

/* ─── EmptyState ─────────────────────────────────────────── */
function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 999, background: 'color-mix(in oklab, var(--success) 14%, transparent)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} stroke={2} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>{title}</span>
      {sub && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

/* ─── VIEW: Unresolved ───────────────────────────────────── */
function UnresolvedView({ source, selectedIdx, setSelectedIdx, onConvertTask, onConvertNote, onSnoozeMenu, onResolve, onResolveAll, isResolvingAll }) {
  const { data: items = [], isLoading } = useInboxItems();
  const [sortNewest, setSortNewest] = useState(true);
  const [query, setQuery] = useState('');

  const displayed = useMemo(() => {
    let list = source ? items.filter(i => i.source === source) : items;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(i => i.text.toLowerCase().includes(q));
    return sortNewest ? list : [...list].reverse();
  }, [items, source, sortNewest, query]);

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Inbox Zero</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {isLoading ? '…' : items.length}
            <span style={{ color: 'var(--text-3)', fontSize: 13, fontFamily: 'var(--font-sans)', marginLeft: 6 }}>не разобрано</span>
          </span>
        </div>
        <div style={{ flex: 1, padding: '0 4px' }}>
          <Progress value={items.length === 0 ? 100 : 0} color={items.length === 0 ? 'var(--success)' : 'var(--p-health)'} height={3} />
        </div>
        {items.length === 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
            <Icon name="star" size={13} /> Inbox чист
          </span>
        )}
      </div>

      <CaptureBox />

      {/* List */}
      <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 'none' }}>
            Не разобрано · {isLoading ? '…' : displayed.length}
            {source && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>· {SRC_LABEL[source]}</span>}
          </span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, height: 28, padding: '0 10px', maxWidth: 260, marginLeft: 'auto', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 7 }}>
            <Icon name="search" size={12} style={{ color: 'var(--text-muted)', flex: 'none' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск…" className="no-ring"
              style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text)' }} />
            {query && (
              <button onClick={() => setQuery('')} style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                <Icon name="x" size={11} />
              </button>
            )}
          </div>
          <Button variant="ghost" size="sm" icon="sort" onClick={() => setSortNewest(s => !s)}>
            {sortNewest ? 'Свежие' : 'Старые'}
          </Button>
          <Button variant="secondary" size="sm" icon="check"
            onClick={() => displayed.length > 0 && onResolveAll(displayed.map(i => i.id))}
            disabled={displayed.length === 0 || isResolvingAll}>
            Разобрать всё
          </Button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '18px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton h={11} w="18%" />
                <Skeleton h={14} w="85%" />
                <Skeleton h={11} w="55%" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState icon="check"
            title={query ? 'Ничего не найдено' : source ? `Нет из «${SRC_LABEL[source]}»` : 'Inbox пуст'}
            sub={query ? 'Попробуй другой запрос' : source ? 'Выбери другой источник в сайдбаре' : 'Используй форму выше чтобы добавить'} />
        ) : (
          displayed.map((item, idx) => (
            <InboxRow key={item.id} item={item} isSelected={selectedIdx === idx}
              onSelect={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
              onConvertTask={onConvertTask} onConvertNote={onConvertNote} onSnoozeMenu={onSnoozeMenu} onResolve={onResolve} />
          ))
        )}
      </div>

      <div style={{ padding: '10px 4px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
        ↑↓ навигация · E разобрать · T → задача · N → заметка · S отложить до завтра · Del удалить · Esc сброс
      </div>
    </>
  );
}

/* ─── VIEW: Resolved ─────────────────────────────────────── */
function ResolvedView({ source }) {
  const { data: items = [], isLoading } = useResolvedItems();
  const [sortNewest, setSortNewest] = useState(true);

  const displayed = useMemo(() => {
    let list = source ? items.filter(i => i.source === source) : items;
    return sortNewest ? list : [...list].reverse();
  }, [items, source, sortNewest]);

  return (
    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>
          Разобрано · {isLoading ? '…' : displayed.length}
          {source && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>· {SRC_LABEL[source]}</span>}
        </span>
        <Button variant="ghost" size="sm" icon="sort" onClick={() => setSortNewest(s => !s)}>
          {sortNewest ? 'Свежие' : 'Старые'}
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Skeleton h={10} w="15%" /><Skeleton h={13} w="80%" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState icon="inbox" title="Нет разобранных элементов" sub={source ? 'Нет разобранных из этого источника' : 'Разбери что-нибудь из Inbox'} />
      ) : (
        displayed.map(item => <ResolvedRow key={item.id} item={item} />)
      )}
    </div>
  );
}

/* ─── VIEW: Snoozed ──────────────────────────────────────── */
function SnoozedView({ source, onConvertTask, onSnoozeMenu, onResolve }) {
  const { data: items = [], isLoading } = useSnoozedItems();

  const displayed = useMemo(() => {
    return source ? items.filter(i => i.source === source) : items;
  }, [items, source]);

  return (
    <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="snooze" size={13} style={{ color: 'var(--text-3)' }} />
        <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>
          Отложено · {isLoading ? '…' : displayed.length}
          {source && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>· {SRC_LABEL[source]}</span>}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>проснувшиеся возвращаются в Inbox автоматически</span>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 18 }}>
          {[1,2].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton h={11} w="20%" /><Skeleton h={14} w="75%" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState icon="snooze" title="Нет отложенных" sub="Отложи элемент из Inbox — он появится здесь" />
      ) : (
        displayed.map(item => (
          <SnoozedRow key={item.id} item={item} onConvertTask={onConvertTask} onSnoozeMenu={onSnoozeMenu} onResolve={onResolve} />
        ))
      )}
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────── */
function Toast({ toast, onUndo, onClose }) {
  return createPortal(
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
      borderRadius: 10, boxShadow: 'var(--shadow-modal)',
    }}>
      <Icon name="check" size={13} style={{ color: 'var(--success)', flex: 'none' }} />
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{toast.msg}</span>
      {toast.undo && (
        <button onClick={onUndo}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elev-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{ height: 24, padding: '0 9px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'background 100ms' }}>
          Отменить
        </button>
      )}
      <button onClick={onClose} style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
        <Icon name="x" size={13} />
      </button>
    </div>,
    document.body
  );
}

/* ─── Inbox (root) ───────────────────────────────────────── */
export default function Inbox() {
  const [searchParams] = useSearchParams();
  const view   = searchParams.get('view')   ?? 'unresolved';
  const source = searchParams.get('source') ?? null;

  const { data: items = [] } = useInboxItems();
  const resolve      = useResolveInboxItem();
  const unresolve    = useUnresolveItem();
  const resolveAll   = useResolveAllItems();
  const unresolveAll = useUnresolveAllItems();
  const snooze       = useSnoozeInboxItem();
  const unsnooze     = useUnsnoozeItem();
  const remove       = useDeleteInboxItem();

  const [convertTask, setConvertTask] = useState(null);
  const [convertNote, setConvertNote] = useState(null);
  const [snoozeMenu,  setSnoozeMenu]  = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [toast,       setToast]       = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, undo) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, undo });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const handleResolve = useCallback((item) => {
    resolve.mutate(item.id);
    showToast('Разобрано', () => unresolve.mutate(item.id));
  }, [resolve, unresolve, showToast]);

  const handleResolveAll = useCallback((ids) => {
    resolveAll.mutate(ids);
    showToast(`Разобрано: ${ids.length}`, () => unresolveAll.mutate(ids));
  }, [resolveAll, unresolveAll, showToast]);

  const displayed = useMemo(() => {
    return source ? items.filter(i => i.source === source) : items;
  }, [items, source]);

  /* Keyboard nav (unresolved view only) */
  useEffect(() => {
    if (view !== 'unresolved') return;
    const handler = (e) => {
      if (convertTask || convertNote || snoozeMenu) return;
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const item = selectedIdx != null ? displayed[selectedIdx] : null;
      switch (e.key) {
        case 'ArrowDown': case 'j':
          e.preventDefault(); setSelectedIdx(i => Math.min((i ?? -1) + 1, displayed.length - 1)); break;
        case 'ArrowUp':   case 'k':
          e.preventDefault(); setSelectedIdx(i => Math.max((i ?? 1) - 1, 0)); break;
        case 'e': case 'E':
          if (item) handleResolve(item); break;
        case 't': case 'T':
          if (item) setConvertTask(item); break;
        case 'n': case 'N':
          if (item) setConvertNote(item); break;
        case 's': case 'S':
          if (item) {
            const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
            snooze.mutate({ id: item.id, until: d.toISOString() });
            showToast('Отложено до завтра 09:00', () => unsnooze.mutate(item.id));
          }
          break;
        case 'Delete':
          if (item) { remove.mutate(item.id); setSelectedIdx(null); } break;
        case 'Escape':
          setSelectedIdx(null); break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [view, displayed, selectedIdx, convertTask, convertNote, snoozeMenu, handleResolve, snooze, unsnooze, remove, showToast]);

  /* Reset selection on view/source change */
  useEffect(() => { setSelectedIdx(null); }, [view, source]);

  const handleSnoozeMenu = useCallback((e, itemId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSnoozeMenu({ itemId, x: rect.right, y: rect.bottom });
  }, []);

  const VIEW_LABELS = {
    unresolved: { title: 'Inbox',       sub: `${items.length} не разобрано` },
    resolved:   { title: 'Разобрано',   sub: 'история разобранных' },
    snoozed:    { title: 'Отложенные',  sub: 'вернутся в нужное время' },
  };

  const { title, sub } = VIEW_LABELS[view] ?? VIEW_LABELS.unresolved;

  return (
    <>
      {convertTask && <ConvertToTaskModal item={convertTask} onClose={() => setConvertTask(null)} />}
      {convertNote && <ConvertToNoteModal item={convertNote} onClose={() => setConvertNote(null)} />}
      {snoozeMenu  && <SnoozeMenu itemId={snoozeMenu.itemId} pos={{ x: snoozeMenu.x, y: snoozeMenu.y }} onClose={() => setSnoozeMenu(null)} />}
      {toast && <Toast toast={toast} onUndo={() => { toast.undo?.(); setToast(null); }} onClose={() => setToast(null)} />}

      <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
          <TopBar
            title={title}
            sub={source ? `${sub} · ${SRC_LABEL[source]}` : sub}
          />

          <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 28px 24px' }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>

            {view === 'unresolved' && (
              <UnresolvedView
                source={source}
                selectedIdx={selectedIdx}
                setSelectedIdx={setSelectedIdx}
                onConvertTask={setConvertTask}
                onConvertNote={setConvertNote}
                onSnoozeMenu={handleSnoozeMenu}
                onResolve={handleResolve}
                onResolveAll={handleResolveAll}
                isResolvingAll={resolveAll.isPending}
              />
            )}

            {view === 'resolved' && (
              <ResolvedView source={source} />
            )}

            {view === 'snoozed' && (
              <SnoozedView
                source={source}
                onConvertTask={setConvertTask}
                onSnoozeMenu={handleSnoozeMenu}
                onResolve={handleResolve}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
