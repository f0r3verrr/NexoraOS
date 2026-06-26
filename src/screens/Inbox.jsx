import { useState, useRef } from 'react';
import { Icon } from '../icons.jsx';
import { Button, IconButton, Badge, ProjectTag, Progress } from '../components/primitives.jsx';
import { Sidebar, TopBar } from '../components/Sidebar.jsx';
import { useInboxItems, useAddInboxItem, useResolveInboxItem, useDeleteInboxItem, useSnoozeInboxItem } from '../hooks/useInbox.js';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'вчера';
  return `${days} дней назад`;
}

const SRC_ICON = { telegram: 'send', web: 'globe', voice: 'mic', email: 'message' };

function Skeleton({ h = 14, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'var(--bg-elev-3)', animation: 'pulse 1.4s ease-in-out infinite' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
  </div>;
}

function InboxRow({ item }) {
  const resolve  = useResolveInboxItem();
  const remove   = useDeleteInboxItem();
  const snooze   = useSnoozeInboxItem();

  const snoozeUntilTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    snooze.mutate({ id: item.id, until: d.toISOString() });
  };

  return (
    <div
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', gap: 14, padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)', transition: 'background 80ms', background: 'transparent' }}
    >
      <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Icon name={SRC_ICON[item.source] ?? 'globe'} size={13} />
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>{fmtDate(item.created_at)}</span>
          {item.duration_sec && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="mic" size={11} /> {Math.floor(item.duration_sec / 60)}:{String(item.duration_sec % 60).padStart(2,'0')}</span>}
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{item.text}</p>
        {item.project && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Предложено →</span>
            <ProjectTag projectToken={item.project.color_token} label={item.project.name} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 'none' }}>
        <IconButton icon="snooze" title="Отложить до завтра" onClick={snoozeUntilTomorrow} />
        <IconButton icon="check"  title="Разобрано"          onClick={() => resolve.mutate(item.id)} />
        <IconButton icon="trash"  title="Удалить"            onClick={() => remove.mutate(item.id)} />
      </div>
    </div>
  );
}

function CaptureBox() {
  const [text, setText] = useState('');
  const [source, setSource] = useState('web');
  const add = useAddInboxItem();
  const textareaRef = useRef(null);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await add.mutateAsync({ text: trimmed, source });
    setText('');
    textareaRef.current?.focus();
  };

  return (
    <div style={{ padding: '20px 22px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', background: 'var(--bg-elev-2)', border: '1px solid var(--border-subtle)', borderRadius: 10, minHeight: 88 }}>
        <Icon name="zap" size={18} style={{ color: 'var(--text-3)', marginTop: 2, flex: 'none' }} />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
          placeholder="Что не забыть? Просто запиши — разберёшь позже."
          rows={3}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 14, color: text ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
          <IconButton icon="paperclip" />
          <Button variant="primary" icon="send" onClick={submit} style={{ opacity: text.trim() ? 1 : 0.5 }}>В Inbox</Button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
        <span>Источник:</span>
        {[{ i: 'send', l: 'Telegram', v: 'telegram' }, { i: 'globe', l: 'Web', v: 'web' }, { i: 'message', l: 'Email', v: 'email' }].map(s => (
          <button key={s.v} onClick={() => setSource(s.v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px', borderRadius: 6, fontSize: 12,
            background: source === s.v ? 'var(--bg-elev-3)' : 'transparent',
            color: source === s.v ? 'var(--text)' : 'var(--text-3)',
            border: `1px solid ${source === s.v ? 'var(--border)' : 'transparent'}`,
          }}>
            <Icon name={s.i} size={12} /> {s.l}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>⌘↵ сохранить</span>
      </div>
    </div>
  );
}

export default function Inbox() {
  const { data: items = [], isLoading } = useInboxItems();

  return (
    <div className="app-surface" style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <TopBar breadcrumb="разбор · 2–3 минуты" title="Inbox" sub={isLoading ? '…' : `${items.length} ждут разбора`} right={<>
          <Button variant="ghost" size="sm" icon="filter">Источник</Button>
          <Button variant="secondary" size="sm" icon="check">Разобрать всё</Button>
        </>} />

        <div className="ws-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 28px 24px' }}>
          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 18px', background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Inbox Zero</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {isLoading ? '…' : items.length} <span style={{ color: 'var(--text-3)', fontSize: 14 }}>осталось</span>
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <Progress value={items.length === 0 ? 100 : 0} color="var(--p-health)" height={4} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge tone="info" dot>web · {items.filter(i => i.source === 'web').length}</Badge>
              <Badge tone="neutral" dot>telegram · {items.filter(i => i.source === 'telegram').length}</Badge>
              <Badge tone="warn" dot>голос · {items.filter(i => i.source === 'voice').length}</Badge>
            </div>
          </div>

          <CaptureBox />

          <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Не разобрано · {isLoading ? '…' : items.length}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>✓ готово · 🕐 отложить · 🗑 удалить</span>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '18px' }}>
                {[1,2,3].map(i => <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton h={12} w="20%" /><Skeleton h={14} w="90%" /><Skeleton h={12} w="60%" />
                </div>)}
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 999, background: 'color-mix(in oklab, var(--success) 14%, transparent)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={22} stroke={2} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>Inbox пуст</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Добавь что-то через форму выше</span>
              </div>
            ) : (
              items.map(item => <InboxRow key={item.id} item={item} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
