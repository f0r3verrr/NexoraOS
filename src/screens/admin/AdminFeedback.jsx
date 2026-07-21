import { useState } from 'react';
import { Modal, Field, fieldStyle } from '../../components/Modal.jsx';
import {
  useFeedbackAdmin, useSetFeedbackStatus, useSetFeedbackPriority, useReplyFeedback,
} from '../../hooks/admin/useFeedbackAdmin.js';
import { Badge, AdminButton, EmptyState } from './AdminUI.jsx';
import { fmtRel } from '../../lib/adminFormat.js';

const TYPE_LABEL = { bug: 'Баг', feature: 'Фича', question: 'Вопрос', other: 'Другое' };
const TYPE_TONE = { bug: 'danger', feature: 'success', question: 'info', other: 'neutral' };
const PRIORITY_LABEL = { low: 'Низкий', normal: 'Средний', high: 'Высокий', urgent: 'Срочно' };
const COLUMNS = [
  { status: 'open', label: 'Открыто', dot: 'var(--danger)' },
  { status: 'in_progress', label: 'В работе', dot: 'var(--warn)' },
  { status: 'closed', label: 'Закрыто', dot: 'var(--success)' },
];

function FeedbackDetail({ item, onClose }) {
  const setStatus = useSetFeedbackStatus();
  const setPriority = useSetFeedbackPriority();
  const reply = useReplyFeedback();
  const [body, setBody] = useState('');

  return (
    <Modal title={item.title} sub={item.user_email} width={480} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.body}</div>
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
        <Field label="Ответить">
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} style={{ ...fieldStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <AdminButton variant="primary" disabled={!body.trim()} onClick={() => { reply.mutate({ id: item.id, body }, { onSuccess: () => setBody('') }); }}>
            Отправить ответ
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
