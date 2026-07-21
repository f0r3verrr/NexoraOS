import { useEffect, useRef, useState } from 'react';
import { Modal, Field, fieldStyle } from '../../components/Modal.jsx';
import {
  useFeedbackAdmin, useSetFeedbackStatus, useSetFeedbackPriority, useReplyFeedback, useFeedbackThread,
} from '../../hooks/admin/useFeedbackAdmin.js';
import { Badge, AdminButton, EmptyState } from './AdminUI.jsx';
import { fmtRel, fmtDateTime } from '../../lib/adminFormat.js';

const TYPE_LABEL = { bug: 'Баг', feature: 'Фича', question: 'Вопрос', other: 'Другое' };
const TYPE_TONE = { bug: 'danger', feature: 'success', question: 'info', other: 'neutral' };
const PRIORITY_LABEL = { low: 'Низкий', normal: 'Средний', high: 'Высокий', urgent: 'Срочно' };
const COLUMNS = [
  { status: 'open', label: 'Открыто', dot: 'var(--danger)' },
  { status: 'in_progress', label: 'В работе', dot: 'var(--warn)' },
  { status: 'closed', label: 'Закрыто', dot: 'var(--success)' },
];

function Bubble({ own, body, time }) {
  return (
    <div style={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: own ? 'flex-end' : 'flex-start' }}>
        {!own && <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>Пользователь</span>}
        <div style={{
          padding: '9px 13px',
          borderRadius: own ? '13px 13px 4px 13px' : '13px 13px 13px 4px',
          background: own ? 'var(--p-openresto)' : 'var(--bg-elev-3)',
          color: own ? 'var(--bg)' : 'var(--text)',
          fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {body}
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDateTime(time)}</span>
      </div>
    </div>
  );
}

function FeedbackDetail({ item, onClose }) {
  const setStatus = useSetFeedbackStatus();
  const setPriority = useSetFeedbackPriority();
  const reply = useReplyFeedback();
  const { data: thread = [] } = useFeedbackThread(item.id);
  const [body, setBody] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [thread.length]);

  const send = () => {
    const text = body.trim();
    if (!text || reply.isPending) return;
    reply.mutate({ id: item.id, body: text }, { onSuccess: () => setBody('') });
  };

  return (
    <Modal title={item.title} sub={item.user_email} width={520} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Статус">
            <select defaultValue={item.status} onChange={e => setStatus.mutate({ id: item.id, status: e.target.value })} style={fieldStyle}>
              {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Приоритет">
            <select defaultValue={item.priority} onChange={e => setPriority.mutate({ id: item.id, priority: e.target.value })} style={fieldStyle}>
              {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 340, overflowY: 'auto',
          padding: '4px 4px 2px', background: 'var(--bg-elev-1)', borderRadius: 12, border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ padding: '10px 10px 0' }}><Bubble body={item.body} time={item.created_at} /></div>
          <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {thread.map(r => <Bubble key={r.id} own={r.is_admin} body={r.body} time={r.created_at} />)}
          </div>
          <div ref={bottomRef} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={body} onChange={e => setBody(e.target.value)} rows={2} placeholder="Написать пользователю…"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ ...fieldStyle, flex: 1, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
          />
          <AdminButton variant="primary" disabled={!body.trim() || reply.isPending} onClick={send} style={{ alignSelf: 'flex-end' }}>
            Отправить
          </AdminButton>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminFeedback() {
  const { data: items = [], isLoading } = useFeedbackAdmin();
  const [selected, setSelected] = useState(null);

  const byStatus = (status) => items.filter(i => i.status === status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {selected && <FeedbackDetail item={selected} onClose={() => setSelected(null)} />}
      {isLoading ? (
        <EmptyState icon="message" text="Загрузка..." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16, alignItems: 'flex-start' }}>
          {COLUMNS.map(col => {
            const colItems = byStatus(col.status);
            return (
              <div key={col.status} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: col.dot }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{col.label}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{colItems.length}</span>
                </div>
                {colItems.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 4px' }}>Пусто</div>
                ) : colItems.map(it => (
                  <div key={it.id} onClick={() => setSelected(it)} style={{ cursor: 'pointer', padding: 15, borderRadius: 13, background: 'var(--bg-elev-1)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge tone={TYPE_TONE[it.type]}>{TYPE_LABEL[it.type]}</Badge>
                      <span style={{ flex: 1 }} />
                      <Badge tone="neutral">{PRIORITY_LABEL[it.priority]}</Badge>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{it.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{it.user_email}</span>
                      <span>{fmtRel(it.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
